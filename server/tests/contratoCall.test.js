import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { filas, fila, escrito } from "../database/procedimientos/_contrato.js";

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const CARPETAS = ["controllers", "utils", "middlewares"];

const archivosJs = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) archivosJs(p, acc);
    else if (e.name.endsWith(".js")) acc.push(p);
  }
  return acc;
};

test("ningún CALL se lee con .length o .affectedRows directo", () => {
  const sospechas = [];

  for (const carpeta of CARPETAS) {
    const dir = path.join(RAIZ, carpeta);
    if (!fs.existsSync(dir)) continue;

    for (const archivo of archivosJs(dir)) {
      const src = fs.readFileSync(archivo, "utf8");

      const declaracion = /const \[(\w+)\]\s*=\s*await\s+\w+\.query\(\s*`CALL[^`]*`/g;
      let m;

      while ((m = declaracion.exec(src))) {
        const variable = m.group?.(1) ?? m[1];

        const siguiente = src.slice(m.index, m.index + 600);

        const usoDirecto = new RegExp(
          `\\b${variable}\\.(length|affectedRows)\\b`
        );
        if (usoDirecto.test(siguiente)) {
          const linea = src.slice(0, m.index).split("\n").length;
          sospechas.push(
            `${path.relative(RAIZ, archivo)}:${linea} → usa ${variable}.length/.affectedRows ` +
              `sobre el resultado de un CALL (debería ser ${variable}[0])`
          );
        }
      }
    }
  }

  assert.deepEqual(
    sospechas,
    [],
    `\nSe leyó mal el resultado de un CALL:\n  ${sospechas.join("\n  ")}\n`
  );
});

test("filas() y fila() desenvuelven el resultado de un CALL", () => {

  const conFilas = [[{ id: "a" }, { id: "b" }], { affectedRows: 0 }];
  assert.equal(filas(conFilas).length, 2);
  assert.equal(fila(conFilas).id, "a");

  const vacio = [[], { affectedRows: 0 }];
  assert.equal(vacio.length, 2, "esta es la trampa: length vale 2");
  assert.equal(filas(vacio).length, 0, "filas() sí distingue que no hay nada");
  assert.equal(fila(vacio), null);

  const multiple = [[{ total: 1 }], [{ otro: 2 }], { affectedRows: 0 }];
  assert.equal(fila(multiple, 1).otro, 2);

  assert.deepEqual(filas(null), []);
  assert.deepEqual(filas(undefined), []);
});

test("escrito() cuenta las escrituras en las dos formas de mysql2", () => {

  assert.equal(escrito([[{ affected: 3 }], { affectedRows: 0 }]), 3);
  assert.equal(escrito([[{ affected: 0 }], { affectedRows: 0 }]), 0);

  assert.equal(escrito({ affectedRows: 5 }), 5);

  assert.equal(escrito(null), 0);
});
