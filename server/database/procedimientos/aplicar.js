import fs from "fs/promises";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import pool from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NOMBRE_LOCK = "tairo_aplicar_procedimientos";

export async function listarProcedimientos() {
  const entradas = await fs.readdir(__dirname, { withFileTypes: true });
  const dominios = entradas.filter((e) => e.isDirectory()).map((e) => e.name).sort();

  const procedimientos = [];
  for (const dominio of dominios) {
    const carpeta = path.join(__dirname, dominio);
    const archivos = (await fs.readdir(carpeta))
      .filter((f) => f.endsWith(".sql") && !f.startsWith("_"))
      .sort();

    for (const archivo of archivos) {
      const nombre = path.basename(archivo, ".sql");
      procedimientos.push({
        nombre,

        tipo: nombre.startsWith("fn_") ? "FUNCTION" : "PROCEDURE",
        dominio,
        ruta: path.join(carpeta, archivo),
      });
    }
  }
  return procedimientos;
}

export async function listarInstalados(db = pool) {
  const [filas] = await db.query(
    `SELECT ROUTINE_NAME AS nombre
     FROM information_schema.ROUTINES
     WHERE ROUTINE_SCHEMA = DATABASE()
       AND ROUTINE_TYPE IN ('PROCEDURE', 'FUNCTION')`
  );
  return new Set(filas.map((f) => f.nombre));
}

export async function verificarProcedimientos(db = pool) {
  const declarados = await listarProcedimientos();
  const instalados = await listarInstalados(db);

  const faltantes = declarados.filter((p) => !instalados.has(p.nombre));
  const nombresDeclarados = new Set(declarados.map((p) => p.nombre));
  const sobrantes = [...instalados].filter((n) => !nombresDeclarados.has(n));

  return { declarados, faltantes, sobrantes, total: declarados.length };
}

function sentenciasDe(sql, nombre, tipo) {
  const inicio = sql.indexOf("DELIMITER $$");
  const fin = sql.lastIndexOf("$$");

  if (inicio === -1 || fin <= inicio) {
    throw new Error(`${nombre}.sql no tiene el bloque DELIMITER $$ … $$ esperado.`);
  }

  const cuerpo = sql.slice(inicio + "DELIMITER $$".length, fin).trim();

  const declaracion = cuerpo
    .split("\n")
    .find((l) => l.trim() && !l.trim().startsWith("--")) || "";

  if (!declaracion.trim().startsWith(`CREATE ${tipo} ${nombre}`)) {
    throw new Error(`${nombre}.sql no declara CREATE ${tipo} ${nombre}.`);
  }

  return [`DROP ${tipo} IF EXISTS ${nombre}`, cuerpo];
}

export async function aplicarProcedimientos({ solo = null } = {}) {
  const declarados = await listarProcedimientos();
  const objetivo = solo
    ? declarados.filter((p) => p.nombre === solo || p.dominio === solo)
    : declarados;

  if (objetivo.length === 0) {
    throw new Error(`No hay procedimientos que coincidan con "${solo}".`);
  }

  const connection = await pool.getConnection();
  let bloqueado = false;

  try {
    const [[{ obtenido }]] = await connection.query(
      `SELECT GET_LOCK(?, 10) AS obtenido`,
      [NOMBRE_LOCK]
    );
    if (obtenido !== 1) {
      throw new Error(
        "Otro proceso está instalando los procedimientos. Inténtalo en unos segundos."
      );
    }
    bloqueado = true;

    let aplicados = 0;

    const ordenado = [...objetivo].sort((a, b) =>
      a.tipo === b.tipo ? 0 : a.tipo === "FUNCTION" ? -1 : 1
    );
    for (const { nombre, ruta, tipo } of ordenado) {
      const sql = await fs.readFile(ruta, "utf8");
      for (const sentencia of sentenciasDe(sql, nombre, tipo)) {
        await connection.query(sentencia);
      }
      aplicados += 1;
    }

    return { aplicados, total: objetivo.length };
  } finally {
    if (bloqueado) {
      await connection.query(`SELECT RELEASE_LOCK(?)`, [NOMBRE_LOCK]);
    }
    connection.release();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  const args = process.argv.slice(2);
  const soloVerificar = args.includes("--check");
  const filtro = args.find((a) => !a.startsWith("--")) || null;

  try {
    if (soloVerificar) {
      const { total, faltantes, sobrantes } = await verificarProcedimientos();
      console.log(`Declarados en el proyecto: ${total}`);
      console.log(`Instalados y correctos:    ${total - faltantes.length}`);

      if (faltantes.length) {
        console.log(`\nFaltan en la base de datos (${faltantes.length}):`);
        for (const p of faltantes) console.log(`  - ${p.dominio}/${p.nombre}`);
      }
      if (sobrantes.length) {
        console.log(`\nEn la base pero no en el proyecto (${sobrantes.length}):`);
        for (const n of sobrantes) console.log(`  - ${n}`);
      }
      if (!faltantes.length && !sobrantes.length) {
        console.log("\nTodo en orden.");
      }

      await pool.end();
      process.exit(faltantes.length ? 1 : 0);
    }

    const { aplicados } = await aplicarProcedimientos({ solo: filtro });
    console.log(
      filtro
        ? `${aplicados} procedimientos instalados (filtro: ${filtro}).`
        : `${aplicados} procedimientos instalados.`
    );

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    await pool.end().catch(() => {});
    process.exit(1);
  }
}
