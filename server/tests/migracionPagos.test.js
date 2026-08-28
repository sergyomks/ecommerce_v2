import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { cargar, comprobarConexion } from "./entornoPrueba.js";

const { default: pool } = await cargar("database/db.js");
const { crearUsuarioTabla } = await cargar("models/tablaUsuario.js");
const { crearPedidoTabla } = await cargar("models/tablaPedido.js");
const { asegurarPagosMultiplesIntentos } = await cargar("models/tablaPago.js");

const usuarioId = crypto.randomUUID();
const pedidoId = crypto.randomUUID();

const indicesDeIdPedido = async () => {
  const [r] = await pool.query(`SHOW INDEX FROM pagos WHERE Column_name = 'id_pedido'`);
  return r;
};

const insertarPago = (estado, chargeId) =>
  pool.query(
    `INSERT INTO pagos (id, id_pedido, tipo_pago, estado_pago, id_intento_pago)
     VALUES (?, ?, 'Online', ?, ?)`,
    [crypto.randomUUID(), pedidoId, estado, chargeId]
  );

before(async () => {
  await comprobarConexion(pool);
  await crearUsuarioTabla();
  await crearPedidoTabla();

  await pool.query(`DROP TABLE IF EXISTS pagos`);
  await pool.query(`
    CREATE TABLE pagos (
      id CHAR(36) PRIMARY KEY,
      id_pedido CHAR(36) NOT NULL UNIQUE,
      tipo_pago VARCHAR(20) NOT NULL CHECK (tipo_pago IN ('Online')),
      estado_pago VARCHAR(20) NOT NULL CHECK (estado_pago IN ('Pagado', 'Pendiente', 'Fallido')),
      id_intento_pago VARCHAR(255) UNIQUE,
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE
    )
  `);

  await pool.query(
    `INSERT INTO usuarios (id, nombre, email, contraseña)
     VALUES (?, 'Legacy', ?, 'hash')`,
    [usuarioId, `legacy-${usuarioId.slice(0, 8)}@prueba.test`]
  );
  await pool.query(
    `INSERT INTO pedidos (id, id_comprador, precio_total, impuesto, precio_envio)
     VALUES (?, ?, 100, 0, 0)`,
    [pedidoId, usuarioId]
  );
  await insertarPago("Pagado", "chr_legacy_previo");
});

after(async () => {
  await pool.query(`DELETE FROM usuarios WHERE id = ?`, [usuarioId]);
  await pool.end();
});

test("el esquema antiguo impide un segundo intento de cobro", async () => {
  await assert.rejects(
    () => insertarPago("Fallido", "chr_legacy_segundo"),
    (error) => error.code === "ER_DUP_ENTRY"
  );
});

test("la migración suelta el único y conserva datos, FK e idempotencia", async () => {
  await asegurarPagosMultiplesIntentos();

  const indices = await indicesDeIdPedido();
  assert.equal(indices.filter((i) => i.Non_unique === 0).length, 0);
  assert.ok(indices.length > 0, "la FK necesita índice de respaldo");

  const [filas] = await pool.query(`SELECT COUNT(*) AS t FROM pagos`);
  assert.equal(Number(filas[0].t), 1, "la fila preexistente debe sobrevivir");

  const [fks] = await pool.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pagos'
       AND REFERENCED_TABLE_NAME = 'pedidos'`
  );
  assert.equal(fks.length, 1, "la clave foránea debe seguir intacta");

  await insertarPago("Fallido", "chr_legacy_tercero");

  await assert.rejects(
    () => insertarPago("Pagado", "chr_legacy_previo"),
    (error) => error.code === "ER_DUP_ENTRY",
    "id_intento_pago debe seguir siendo único"
  );
});

test("re-ejecutar la migración es idempotente", async () => {
  await asegurarPagosMultiplesIntentos();
  const indices = await indicesDeIdPedido();
  assert.equal(indices.filter((i) => i.Non_unique === 0).length, 0);
  assert.ok(indices.length > 0);
});
