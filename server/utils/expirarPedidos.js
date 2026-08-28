import pool from "../database/db.js";
import { liberarReservaPedido } from "./stockPedido.js";

const MINUTOS_GRACIA_PAGO = 5;

const enteroPositivo = (valor, respaldo) => {
  const numero = Math.trunc(Number(valor));
  return Number.isFinite(numero) && numero > 0 ? numero : respaldo;
};

const minutosExpiracion = () =>
  enteroPositivo(process.env.PEDIDO_EXPIRA_MINUTOS, 30);

const minutosIntervalo = () =>
  enteroPositivo(process.env.PEDIDO_EXPIRA_INTERVALO_MINUTOS, 5);

const buscarVencidos = async (minutos) => {
  const [filas] = await pool.query(
    `SELECT id FROM pedidos
     WHERE fecha_pagado IS NULL
       AND stock_reservado = 1
       AND estado_pedido <> 'Cancelado'
       AND fecha_creado < NOW() - INTERVAL ? MINUTE
       AND (pago_iniciado_en IS NULL OR pago_iniciado_en < NOW() - INTERVAL ? MINUTE)`,
    [minutos, MINUTOS_GRACIA_PAGO]
  );
  return filas.map((fila) => fila.id);
};

const cancelarPedidoVencido = async (pedidoId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await liberarReservaPedido(pedidoId, connection);
    await connection.query(
      `UPDATE pedidos SET estado_pedido = 'Cancelado', fecha_actualizado = NOW()
       WHERE id = ? AND fecha_pagado IS NULL`,
      [pedidoId]
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error(`No se pudo expirar el pedido ${pedidoId}:`, error.message);
    return false;
  } finally {
    connection.release();
  }
};

const NOMBRE_LOCK = "ecommerce_expirar_pedidos";

const ejecutarConLockExclusivo = async (tarea) => {
  const connection = await pool.getConnection();
  try {
    const [[{ obtenido }]] = await connection.query(
      `SELECT GET_LOCK(?, 0) AS obtenido`,
      [NOMBRE_LOCK]
    );

    if (obtenido !== 1) return null;

    try {
      return await tarea();
    } finally {
      await connection.query(`SELECT RELEASE_LOCK(?)`, [NOMBRE_LOCK]);
    }
  } finally {
    connection.release();
  }
};

const cancelarVencidos = async () => {
  const minutos = minutosExpiracion();
  const vencidos = await buscarVencidos(minutos);

  let expirados = 0;
  for (const pedidoId of vencidos) {
    if (await cancelarPedidoVencido(pedidoId)) {
      expirados += 1;
    }
  }

  if (expirados > 0) {
    console.log(
      `Pedidos impagos expirados: ${expirados} (sin pagar tras ${minutos} min).`
    );
  }

  return expirados;
};

export const expirarPedidosVencidos = async () => {
  const resultado = await ejecutarConLockExclusivo(cancelarVencidos);
  return resultado ?? 0;
};

export const iniciarExpiracionPedidos = () => {
  if (process.env.EXPIRACION_PEDIDOS_EN_PROCESO === "false") {
    console.log(
      "Expiración de pedidos desactivada en el proceso; usa un cron externo."
    );
    return null;
  }

  const intervaloMs = minutosIntervalo() * 60 * 1000;

  const temporizador = setInterval(() => {
    expirarPedidosVencidos().catch((error) =>
      console.error("Error en la expiración de pedidos:", error.message)
    );
  }, intervaloMs);

  temporizador.unref();
  return temporizador;
};
