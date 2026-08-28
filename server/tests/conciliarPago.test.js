import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { cargar, comprobarConexion, prepararEsquema } from "./entornoPrueba.js";

const { default: pool } = await cargar("database/db.js");
const { conciliarCargoHuerfano } = await cargar("utils/conciliarPago.js");
const { liberarReservaPedido } = await cargar("utils/stockPedido.js");

const usuarioId = crypto.randomUUID();
const productoId = crypto.randomUUID();

const cargoDe = (pedidoId, centimos) => ({
  amount: centimos,
  email: "cliente@prueba.test",
  metadata: { order_id: pedidoId },
});

const stockActual = async () => {
  const [r] = await pool.query(`SELECT stock FROM productos WHERE id = ?`, [productoId]);
  return Number(r[0].stock);
};

const fijarStock = async (valor) => {
  await pool.query(
    `UPDATE variantes_producto SET stock = ? WHERE id_producto = ?`,
    [valor, productoId]
  );
  await pool.query(`UPDATE productos SET stock = ? WHERE id = ?`, [valor, productoId]);
};

const crearPedido = async ({ cantidad, precioTotal, reservarStock = true }) => {
  const pedidoId = crypto.randomUUID();

  await pool.query(
    `INSERT INTO pedidos (id, id_comprador, precio_total, impuesto, precio_envio,
                          stock_reservado, estado_pedido)
     VALUES (?, ?, ?, 0, 0, ?, 'Procesando')`,
    [pedidoId, usuarioId, precioTotal, reservarStock ? 1 : 0]
  );

  const [varRows] = await pool.query(
    `SELECT id, talla, color FROM variantes_producto WHERE id_producto = ? LIMIT 1`,
    [productoId]
  );
  const variante = varRows[0];

  await pool.query(
    `INSERT INTO detalles_pedido
       (id, id_pedido, id_producto, id_variante, talla, color, cantidad, precio, imagen, titulo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', 'Producto Prueba')`,
    [
      crypto.randomUUID(),
      pedidoId,
      productoId,
      variante.id,
      variante.talla,
      variante.color,
      cantidad,
      precioTotal / cantidad,
    ]
  );

  if (reservarStock) {

    await pool.query(
      `UPDATE variantes_producto SET stock = stock - ? WHERE id = ?`,
      [cantidad, variante.id]
    );
    await pool.query(`UPDATE productos SET stock = stock - ? WHERE id = ?`, [
      cantidad,
      productoId,
    ]);
  }

  return pedidoId;
};

const cancelarYLiberar = async (pedidoId) => {
  const conexion = await pool.getConnection();
  await conexion.beginTransaction();
  await liberarReservaPedido(pedidoId, conexion);
  await conexion.query(`UPDATE pedidos SET estado_pedido = 'Cancelado' WHERE id = ?`, [
    pedidoId,
  ]);
  await conexion.commit();
  conexion.release();
};

const leerPedido = async (pedidoId) => {
  const [r] = await pool.query(
    `SELECT estado_pedido, fecha_pagado, stock_reservado FROM pedidos WHERE id = ?`,
    [pedidoId]
  );
  return r[0];
};

const contarPagos = async (pedidoId) => {
  const [r] = await pool.query(
    `SELECT COUNT(*) AS total FROM pagos WHERE id_pedido = ?`,
    [pedidoId]
  );
  return Number(r[0].total);
};

before(async () => {
  await comprobarConexion(pool);
  await prepararEsquema();

  const [rolRows] = await pool.query(
    `SELECT id FROM roles WHERE nombre = 'Usuario' LIMIT 1`
  );
  await pool.query(
    `INSERT INTO usuarios (id, nombre, email, contraseña, id_rol)
     VALUES (?, 'Cliente Prueba', ?, 'hash', ?)`,
    [usuarioId, `cliente-${usuarioId.slice(0, 8)}@prueba.test`, rolRows[0]?.id || 1]
  );
  const [catRows] = await pool.query(
    `SELECT id FROM categorias WHERE nombre = 'Electronicos' LIMIT 1`
  );
  const categoriaId = catRows[0]?.id || crypto.randomUUID();

  await pool.query(
    `INSERT INTO productos (id, nombre, descripcion, precio, id_categoria, stock, imagenes, creado_por)
     VALUES (?, 'Producto Prueba', 'desc', 50.00, ?, 1000, '[]', ?)`,
    [productoId, categoriaId, usuarioId]
  );

  await pool.query(`CALL sp_guardar_variantes(?, ?)`, [
    productoId,
    JSON.stringify([{ talla: "Única", color: "Único", stock: 1000 }]),
  ]);
});

after(async () => {
  await pool.query(`DELETE FROM usuarios WHERE id = ?`, [usuarioId]);
  await pool.end();
});

test("la tabla pagos admite varios intentos por pedido", async () => {
  const [indices] = await pool.query(
    `SHOW INDEX FROM pagos WHERE Column_name = 'id_pedido'`
  );
  assert.equal(
    indices.filter((i) => i.Non_unique === 0).length,
    0,
    "id_pedido no debe tener índice único"
  );
  assert.ok(indices.length > 0, "la FK necesita un índice de respaldo");
});

test("respuesta perdida: el webhook concilia y deja el pedido pagado", async () => {
  const pedidoId = await crearPedido({ cantidad: 2, precioTotal: 100.0 });
  const stockPrevio = await stockActual();

  const resultado = await conciliarCargoHuerfano(cargoDe(pedidoId, 10000), `chr_${pedidoId}`);
  const pedido = await leerPedido(pedidoId);

  assert.equal(resultado.pagoRegistrado, true);
  assert.notEqual(pedido.fecha_pagado, null);
  assert.equal(await contarPagos(pedidoId), 1);
  assert.equal(await stockActual(), stockPrevio);
});

test("el mismo webhook dos veces no duplica el pago", async () => {
  const pedidoId = await crearPedido({ cantidad: 1, precioTotal: 50.0 });
  const chargeId = `chr_dup_${pedidoId}`;

  await conciliarCargoHuerfano(cargoDe(pedidoId, 5000), chargeId);
  const segunda = await conciliarCargoHuerfano(cargoDe(pedidoId, 5000), chargeId);

  assert.equal(segunda.pagoRegistrado, false);
  assert.equal(await contarPagos(pedidoId), 1);
});

test("un importe que no coincide no toca el pedido", async () => {
  const pedidoId = await crearPedido({ cantidad: 1, precioTotal: 80.0 });

  const resultado = await conciliarCargoHuerfano(cargoDe(pedidoId, 500), `chr_${pedidoId}`);
  const pedido = await leerPedido(pedidoId);

  assert.equal(resultado, null);
  assert.equal(pedido.fecha_pagado, null);
  assert.equal(await contarPagos(pedidoId), 0);
});

test("webhook tardío: revive el pedido expirado y vuelve a reservar stock", async () => {
  const pedidoId = await crearPedido({ cantidad: 3, precioTotal: 150.0 });
  await cancelarYLiberar(pedidoId);

  const stockTrasExpirar = await stockActual();
  const resultado = await conciliarCargoHuerfano(cargoDe(pedidoId, 15000), `chr_${pedidoId}`);
  const pedido = await leerPedido(pedidoId);

  assert.equal(resultado.pagoRegistrado, true);
  assert.notEqual(pedido.fecha_pagado, null);
  assert.equal(pedido.estado_pedido, "Procesando");
  assert.equal(pedido.stock_reservado, 1);
  assert.equal(await stockActual(), stockTrasExpirar - 3);
});

test("webhook tardío sin stock: registra el dinero y no sobrevende", async () => {
  const pedidoId = await crearPedido({ cantidad: 2, precioTotal: 100.0 });
  await cancelarYLiberar(pedidoId);
  await fijarStock(0);

  const resultado = await conciliarCargoHuerfano(cargoDe(pedidoId, 10000), `chr_${pedidoId}`);
  const pedido = await leerPedido(pedidoId);

  assert.equal(resultado.pagoRegistrado, true);
  assert.notEqual(pedido.fecha_pagado, null);
  assert.equal(await stockActual(), 0);
  assert.equal(pedido.estado_pedido, "Cancelado");

  await fijarStock(1000);
});

test("un cargo sin metadata.order_id no revienta", async () => {
  const resultado = await conciliarCargoHuerfano({ amount: 1000, metadata: {} }, "chr_sin_meta");
  assert.equal(resultado, null);
});

test("un cargo que apunta a un pedido inexistente se descarta", async () => {
  const resultado = await conciliarCargoHuerfano(
    cargoDe(crypto.randomUUID(), 1000),
    "chr_fantasma"
  );
  assert.equal(resultado, null);
});

test("conviven intentos fallidos y exitosos en el mismo pedido", async () => {
  const pedidoId = await crearPedido({
    cantidad: 1,
    precioTotal: 50.0,
    reservarStock: false,
  });

  await pool.query(
    `INSERT INTO pagos (id, id_pedido, tipo_pago, estado_pago, id_intento_pago)
     VALUES (?, ?, 'Online', 'Fallido', ?)`,
    [crypto.randomUUID(), pedidoId, `chr_fail_${pedidoId}`]
  );
  await pool.query(
    `INSERT INTO pagos (id, id_pedido, tipo_pago, estado_pago, id_intento_pago)
     VALUES (?, ?, 'Online', 'Pagado', ?)`,
    [crypto.randomUUID(), pedidoId, `chr_ok_${pedidoId}`]
  );

  assert.equal(await contarPagos(pedidoId), 2);
});
