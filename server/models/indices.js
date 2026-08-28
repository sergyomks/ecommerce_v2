import pool from "../database/db.js";

const INDICES = [
  ["productos", "idx_producto_estado_categoria", "estado, id_categoria"],
  ["productos", "idx_producto_estado_fecha", "estado, fecha_creacion"],
  ["productos", "idx_producto_estado_calificacion", "estado, calificaciones"],
  ["productos", "idx_producto_stock", "stock"],
  ["pedidos", "idx_pedido_pagado", "fecha_pagado"],
  ["pedidos", "idx_pedido_creado", "fecha_creado"],
  ["pedidos", "idx_pedido_comprador_fecha", "id_comprador, fecha_creado"],
  ["pedidos", "idx_pedido_expiracion", "fecha_pagado, stock_reservado, estado_pedido"],
  ["mensajes_contacto", "idx_contacto_fecha", "fecha_creacion"],
];

const existeIndice = async (tabla, nombre) => {
  const [rows] = await pool.query(
    `SELECT 1 FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
     LIMIT 1`,
    [tabla, nombre]
  );
  return rows.length > 0;
};

export const asegurarIndices = async () => {
  let creados = 0;

  for (const [tabla, nombre, columnas] of INDICES) {
    try {
      if (await existeIndice(tabla, nombre)) continue;
      await pool.query(`ALTER TABLE ${tabla} ADD INDEX ${nombre} (${columnas})`);
      creados += 1;
    } catch (error) {
      console.error(
        `No se pudo crear el índice ${nombre} en ${tabla}:`,
        error.message
      );
    }
  }

  if (creados > 0) {
    console.log(`Índices de rendimiento creados: ${creados}.`);
  }
};
