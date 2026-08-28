import crypto from "crypto";
import pool from "../database/db.js";
import { reservarStockPedido } from "./stockPedido.js";
import { importeCoincide } from "./importes.js";

const registrarPago = async (pedidoId, chargeId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(
      `INSERT INTO pagos (id, id_pedido, tipo_pago, estado_pago, id_intento_pago)
       VALUES (?, ?, 'Online', 'Pagado', ?)`,
      [crypto.randomUUID(), pedidoId, chargeId]
    );

    const [actualizado] = await connection.query(
      `UPDATE pedidos SET fecha_pagado = NOW(), pago_iniciado_en = NULL
       WHERE id = ? AND fecha_pagado IS NULL`,
      [pedidoId]
    );

    await connection.commit();
    return actualizado.affectedRows > 0;
  } catch (error) {
    await connection.rollback();
    if (error?.code === "ER_DUP_ENTRY") return false;
    throw error;
  } finally {
    connection.release();
  }
};

const restaurarReservaStock = async (pedidoId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [detalles] = await connection.query(
      `SELECT id_producto, id_variante, cantidad, titulo, talla, color
       FROM detalles_pedido WHERE id_pedido = ?`,
      [pedidoId]
    );

    await reservarStockPedido(connection, detalles);

    await connection.query(
      `UPDATE pedidos
       SET stock_reservado = 1, estado_pedido = 'Procesando', fecha_actualizado = NOW()
       WHERE id = ?`,
      [pedidoId]
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error(
      `ATENCION — pedido ${pedidoId} pagado pero sin stock disponible: ${error.message}. ` +
        `Queda como Cancelado con fecha_pagado: requiere reposición o reembolso manual.`
    );
    return false;
  } finally {
    connection.release();
  }
};

export const conciliarCargoHuerfano = async (cargo, chargeId) => {
  const pedidoId = cargo?.metadata?.order_id;

  if (!pedidoId) {
    console.warn(
      `Cargo ${chargeId} sin metadata.order_id: imposible conciliar con un pedido.`
    );
    return null;
  }

  const [pedidos] = await pool.query(
    `SELECT id, estado_pedido, fecha_pagado, precio_total, stock_reservado
     FROM pedidos WHERE id = ? LIMIT 1`,
    [pedidoId]
  );

  if (pedidos.length === 0) {
    console.warn(`Cargo ${chargeId} apunta a un pedido inexistente: ${pedidoId}.`);
    return null;
  }

  const pedido = pedidos[0];

  if (!importeCoincide(cargo.amount, pedido.precio_total)) {
    console.error(
      `Cargo ${chargeId} de ${cargo.amount} céntimos no coincide con el pedido ` +
        `${pedidoId} (${pedido.precio_total}). No se concilia.`
    );
    return null;
  }

  const pagoRegistrado = await registrarPago(pedidoId, chargeId);

  if (!pedido.stock_reservado) {
    await restaurarReservaStock(pedidoId);
  } else if (pedido.estado_pedido === "Cancelado") {
    await pool.query(
      `UPDATE pedidos SET estado_pedido = 'Procesando', fecha_actualizado = NOW()
       WHERE id = ?`,
      [pedidoId]
    );
  }

  console.log(
    `Cargo ${chargeId} conciliado con el pedido ${pedidoId} vía webhook.`
  );

  return { pedidoId, pagoRegistrado };
};
