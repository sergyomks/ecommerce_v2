import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import pool from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARCHIVO = path.join(__dirname, "ubigeo-peru.json");

const clave = (texto) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

export async function cargarUbigeo({ silencioso = false } = {}) {
  const datos = JSON.parse(await fs.readFile(ARCHIVO, "utf8"));
  const log = (...args) => { if (!silencioso) console.log(...args); };

  const connection = await pool.getConnection();
  try {

    const [depExistentes] = await connection.query(
      `SELECT id, nombre, ubigeo FROM departamentos`
    );
    const depPorNombre = new Map(
      depExistentes.map((d) => [clave(d.nombre), d])
    );
    const idPorUbigeoDep = new Map();
    let depNuevos = 0;

    for (const dep of datos.departamentos) {
      const existente = depPorNombre.get(clave(dep.nombre));
      if (existente) {
        if (existente.ubigeo !== dep.ubigeo) {
          await connection.query(
            `UPDATE departamentos SET ubigeo = ? WHERE id = ?`,
            [dep.ubigeo, existente.id]
          );
        }
        idPorUbigeoDep.set(dep.ubigeo, existente.id);
      } else {
        const [r] = await connection.query(
          `INSERT INTO departamentos (nombre, ubigeo) VALUES (?, ?)`,
          [dep.nombre, dep.ubigeo]
        );
        idPorUbigeoDep.set(dep.ubigeo, r.insertId);
        depNuevos += 1;
      }
    }

    const [provExistentes] = await connection.query(
      `SELECT id, nombre, id_departamento, ubigeo FROM provincias`
    );
    const claveProv = (idDep, nombre) => `${idDep}|${clave(nombre)}`;
    const provPorClave = new Map(
      provExistentes.map((p) => [claveProv(p.id_departamento, p.nombre), p])
    );
    const idPorUbigeoProv = new Map();
    let provNuevas = 0;

    for (const prov of datos.provincias) {
      const idDep = idPorUbigeoDep.get(prov.departamento);
      if (!idDep) continue;

      const existente = provPorClave.get(claveProv(idDep, prov.nombre));
      if (existente) {
        if (existente.ubigeo !== prov.ubigeo) {
          await connection.query(
            `UPDATE provincias SET ubigeo = ? WHERE id = ?`,
            [prov.ubigeo, existente.id]
          );
        }
        idPorUbigeoProv.set(prov.ubigeo, existente.id);
      } else {
        const [r] = await connection.query(
          `INSERT INTO provincias (nombre, id_departamento, ubigeo) VALUES (?, ?, ?)`,
          [prov.nombre, idDep, prov.ubigeo]
        );
        idPorUbigeoProv.set(prov.ubigeo, r.insertId);
        provNuevas += 1;
      }
    }

    const [distExistentes] = await connection.query(
      `SELECT id, nombre, id_provincia, ubigeo FROM distritos`
    );
    const claveDist = (idProv, nombre) => `${idProv}|${clave(nombre)}`;
    const distPorClave = new Map(
      distExistentes.map((d) => [claveDist(d.id_provincia, d.nombre), d])
    );
    let distNuevos = 0;

    const pendientes = [];
    for (const dist of datos.distritos) {
      const idProv = idPorUbigeoProv.get(dist.provincia);
      if (!idProv) continue;

      const existente = distPorClave.get(claveDist(idProv, dist.nombre));
      if (existente) {
        if (existente.ubigeo !== dist.ubigeo) {
          await connection.query(
            `UPDATE distritos SET ubigeo = ? WHERE id = ?`,
            [dist.ubigeo, existente.id]
          );
        }
      } else {
        pendientes.push([dist.nombre, idProv, dist.ubigeo]);
      }
    }

    for (let i = 0; i < pendientes.length; i += 500) {
      const lote = pendientes.slice(i, i + 500);
      await connection.query(
        `INSERT INTO distritos (nombre, id_provincia, ubigeo) VALUES ?`,
        [lote]
      );
      distNuevos += lote.length;
    }

    const [tablaEnvios] = await connection.query(
      `SELECT COUNT(*) AS existe FROM information_schema.TABLES
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'informacion_envio'`
    );
    const hayEnvios = Number(tablaEnvios[0].existe) > 0;

    const [sobrantes] = await connection.query(
      hayEnvios
        ? `SELECT d.id, d.nombre AS distrito, p.nombre AS provincia,
                  (SELECT COUNT(*) FROM informacion_envio ie WHERE ie.id_distrito = d.id) AS pedidos
           FROM distritos d
           INNER JOIN provincias p ON p.id = d.id_provincia
           WHERE d.ubigeo IS NULL`
        : `SELECT d.id, d.nombre AS distrito, p.nombre AS provincia, 0 AS pedidos
           FROM distritos d
           INNER JOIN provincias p ON p.id = d.id_provincia
           WHERE d.ubigeo IS NULL`
    );

    const borrables = sobrantes.filter((s) => Number(s.pedidos) === 0);
    if (borrables.length > 0) {
      await connection.query(`DELETE FROM distritos WHERE id IN (?)`, [
        borrables.map((s) => s.id),
      ]);

      await connection.query(
        `DELETE p FROM provincias p
         LEFT JOIN distritos d ON d.id_provincia = p.id
         WHERE p.ubigeo IS NULL AND d.id IS NULL`
      );
    }

    log(
      `Ubigeo cargado: ${depNuevos} departamento(s), ${provNuevas} provincia(s) ` +
        `y ${distNuevos} distrito(s) nuevos.`
    );

    const conservados = sobrantes.filter((s) => Number(s.pedidos) > 0);
    if (borrables.length > 0) {
      log(
        `  ${borrables.length} distrito(s) inventados por la semilla antigua ` +
          `eliminados (no tenían pedidos).`
      );
    }
    if (conservados.length > 0) {
      log(
        `  ${conservados.length} distrito(s) sin código oficial se conservan ` +
          `porque tienen pedidos: ${conservados.map((s) => s.distrito).join(", ")}.`
      );
    }

    return { depNuevos, provNuevas, distNuevos, borrados: borrables.length, conservados };
  } finally {
    connection.release();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  try {
    await cargarUbigeo();
    const [[conteo]] = await pool.query(
      `SELECT (SELECT COUNT(*) FROM departamentos) AS departamentos,
              (SELECT COUNT(*) FROM provincias)    AS provincias,
              (SELECT COUNT(*) FROM distritos)     AS distritos`
    );
    console.log(
      `Total en la base: ${conteo.departamentos} departamentos, ` +
        `${conteo.provincias} provincias, ${conteo.distritos} distritos.`
    );
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("Error al cargar el ubigeo:", error.message);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}
