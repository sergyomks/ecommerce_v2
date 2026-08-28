

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(__dirname, "..", "database", "procedimientos");

const CABECERA_UTF8 =
  "-- El SET NAMES no es opcional: el esquema tiene identificadores con acentos\n" +
  "-- (usuarios.contraseña) y sin él el cliente los envía en latin1, lo que rompe\n" +
  "-- el CREATE con un error de sintaxis engañoso.\n\n" +
  "SET NAMES utf8mb4;\n\n";

function sinComentariosIniciales(sql) {
  return sql
    .split("\n")
    .filter((linea, i, todas) => {
      const previas = todas.slice(0, i);
      const yaEmpezo = previas.some((l) => l.trim() && !l.trim().startsWith("--"));
      return yaEmpezo || (linea.trim() && !linea.trim().startsWith("--"));
    })
    .join("\n")
    .trim();
}

function cuerpoDe(ruta, nombre) {
  const sql = fs.readFileSync(ruta, "utf8");
  const inicio = sql.indexOf("DELIMITER $$");
  const fin = sql.lastIndexOf("$$");

  if (inicio === -1 || fin <= inicio) {
    throw new Error(`${nombre}.sql no tiene el bloque DELIMITER $$ … $$ esperado.`);
  }

  const cuerpo = sql.slice(inicio + "DELIMITER $$".length, fin).trim();
  const tipo = nombre.startsWith("fn_") ? "FUNCTION" : "PROCEDURE";

  if (!sinComentariosIniciales(cuerpo).startsWith(`CREATE ${tipo} ${nombre}`)) {
    throw new Error(`${nombre}.sql no declara CREATE ${tipo} ${nombre}.`);
  }

  return { cuerpo, tipo };
}

const dominios = fs
  .readdirSync(BASE, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

const rutinas = [];
for (const dominio of dominios) {
  const carpeta = path.join(BASE, dominio);
  for (const archivo of fs.readdirSync(carpeta).sort()) {
    if (!archivo.endsWith(".sql") || archivo.startsWith("_")) continue;
    const nombre = path.basename(archivo, ".sql");
    const { cuerpo, tipo } = cuerpoDe(path.join(carpeta, archivo), nombre);
    rutinas.push({ nombre, dominio, tipo, cuerpo });
  }
}

const bloque = ({ nombre, tipo, cuerpo }) =>
  `-- ─── ${nombre} ${"─".repeat(Math.max(0, 66 - nombre.length))}\n` +
  `DROP ${tipo} IF EXISTS ${nombre}$$\n${cuerpo}$$\n`;

const ordenar = (lista) =>
  [...lista].sort((a, b) => (a.tipo === b.tipo ? 0 : a.tipo === "FUNCTION" ? -1 : 1));

for (const dominio of dominios) {
  const delDominio = ordenar(rutinas.filter((r) => r.dominio === dominio));
  fs.writeFileSync(
    path.join(BASE, dominio, "_instalar.sql"),
    `-- Rutinas del dominio: ${dominio} (${delDominio.length})\n` +
      `-- Ejecuta este archivo completo para instalarlas todas de una vez.\n\n` +
      CABECERA_UTF8 +
      `DELIMITER $$\n\n${delDominio.map(bloque).join("\n")}\nDELIMITER ;\n`,
    "utf8"
  );
}

const funciones = rutinas.filter((r) => r.tipo === "FUNCTION");
const procedimientos = rutinas.filter((r) => r.tipo === "PROCEDURE");

const seccion = (titulo, lista) =>
  `-- ══════════════════════════════════════════════════════════════════\n` +
  `-- ${titulo} (${lista.length})\n` +
  `-- ══════════════════════════════════════════════════════════════════\n\n` +
  lista.map(bloque).join("\n");

const partes = [];
if (funciones.length) partes.push(seccion("FUNCIONES", funciones));
for (const dominio of dominios) {
  const delDominio = procedimientos.filter((r) => r.dominio === dominio);
  if (delDominio.length) partes.push(seccion(dominio.toUpperCase(), delDominio));
}

fs.writeFileSync(
  path.join(BASE, "instalar.sql"),
  `-- Las ${rutinas.length} rutinas almacenadas de tairo_v1 ` +
    `(${procedimientos.length} procedimientos, ${funciones.length} función${funciones.length === 1 ? "" : "es"}).\n` +
    `-- Generado por scripts/generarInstalador.mjs desde los .sql de este directorio.\n` +
    `-- No lo edites a mano: edita el .sql correspondiente y vuelve a generarlo.\n` +
    `--\n` +
    `-- Instalación:\n` +
    `--   mysql --default-character-set=utf8mb4 -u <usuario> -p <base> \\\n` +
    `--     < database/procedimientos/instalar.sql\n` +
    `-- o pega el contenido completo en MySQL Workbench y ejecútalo.\n\n` +
    CABECERA_UTF8 +
    `DELIMITER $$\n\n${partes.join("\n")}\nDELIMITER ;\n`,
  "utf8"
);

console.log(`Rutinas: ${rutinas.length} (${procedimientos.length} SP + ${funciones.length} FN)`);
for (const dominio of dominios) {
  const n = rutinas.filter((r) => r.dominio === dominio).length;
  console.log(`  ${dominio.padEnd(12)} ${String(n).padStart(3)}`);
}
console.log("\ninstalar.sql y los _instalar.sql regenerados.");
