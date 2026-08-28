import pool from "../database/db.js";

export async function reservarStockPedido(connection, detalles) {
  for (const detalle of detalles) {
    if (!detalle.id_variante) {
      throw new Error(
        `Falta la talla o el color de "${detalle.titulo || detalle.id_producto}".`
      );
    }

    try {
      await connection.query(`CALL sp_reservar_variante(?, ?)`, [
        detalle.id_variante,
        detalle.cantidad,
      ]);
    } catch (error) {
      if (error?.sqlState === "45000") {
        const descripcion = [detalle.titulo, detalle.talla, detalle.color]
          .filter(Boolean)
          .join(" · ");

        if (error.sqlMessage === "STOCK_INSUFICIENTE") {
          throw new Error(`Ya no queda stock de ${descripcion}.`);
        }
        if (error.sqlMessage === "VARIANTE_NO_ENCONTRADA") {
          throw new Error(`${descripcion} ya no está disponible.`);
        }
      }
      throw error;
    }
  }
}

export async function liberarReservaPedido(pedidoId, connection = pool) {
  const [pedidos] = await connection.query(
    `SELECT id, stock_reservado, id_cupon FROM pedidos WHERE id = ? FOR UPDATE`,
    [pedidoId]
  );
  if (!pedidos.length || !pedidos[0].stock_reservado) {
    return false;
  }

  const [detalles] = await connection.query(
    `SELECT id_variante, id_producto, cantidad, titulo, talla, color
     FROM detalles_pedido WHERE id_pedido = ?`,
    [pedidoId]
  );

  const huerfanas = [];
  for (const item of detalles) {
    if (!item.id_variante) {
      huerfanas.push(item.titulo || item.id_producto);
      continue;
    }
    await connection.query(`CALL sp_liberar_variante(?, ?)`, [
      item.id_variante,
      item.cantidad,
    ]);
  }

  if (huerfanas.length > 0) {
    console.warn(
      `Pedido ${pedidoId}: no se devolvió stock de ${huerfanas.join(", ")} ` +
        `porque su variante ya no existe en el catálogo. Ajusta el inventario a mano.`
    );
  }

  if (pedidos[0].id_cupon) {
    await connection.query(
      `UPDATE cupones SET usos_actuales = GREATEST(usos_actuales - 1, 0) WHERE id = ?`,
      [pedidos[0].id_cupon]
    );
  }

  await connection.query(
    `UPDATE pedidos SET stock_reservado = 0 WHERE id = ?`,
    [pedidoId]
  );

  return true;
}
