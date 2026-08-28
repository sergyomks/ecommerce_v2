import pool from "../database/db.js";

export async function crearPedidoTabla() {
  try {
    const query = `
        CREATE TABLE IF NOT EXISTS pedidos (
        id CHAR(36) PRIMARY KEY,
        id_comprador CHAR(36) NOT NULL,
        precio_total DECIMAL(10,2) NOT NULL CHECK (precio_total >= 0),
        impuesto DECIMAL(10,2) NOT NULL CHECK (impuesto >= 0),
        precio_envio DECIMAL(10,2) NOT NULL CHECK (precio_envio >= 0),
        descuento DECIMAL(10,2) NOT NULL DEFAULT 0,
        id_cupon CHAR(36) NULL,
        stock_reservado TINYINT(1) NOT NULL DEFAULT 0,
        pago_iniciado_en TIMESTAMP NULL DEFAULT NULL,
        estado_pedido VARCHAR(50) DEFAULT 'Procesando' CHECK (estado_pedido IN ('Procesando', 'Enviado', 'Entregado', 'Cancelado')),
        fecha_pagado TIMESTAMP NULL DEFAULT NULL,
        fecha_entregado TIMESTAMP NULL DEFAULT NULL,
        fecha_actualizado TIMESTAMP NULL DEFAULT NULL,
        fecha_creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_pedido_comprador
          FOREIGN KEY (id_comprador) REFERENCES usuarios(id) ON DELETE CASCADE,
        CONSTRAINT fk_pedido_cupon
          FOREIGN KEY (id_cupon) REFERENCES cupones(id)
          ON UPDATE CASCADE ON DELETE RESTRICT
      );
        `;
    await pool.query(query);
  } catch (error) {
    console.error("Error al crear la tabla de pedidos:", error.message);
    throw error;
  }
}

export async function asegurarColumnaStockReservado() {
  try {
    const [cols] = await pool.query(
      `SHOW COLUMNS FROM pedidos LIKE 'stock_reservado'`
    );
    if (cols.length === 0) {
      await pool.query(
        `ALTER TABLE pedidos
         ADD COLUMN stock_reservado TINYINT(1) NOT NULL DEFAULT 0`
      );
      console.log("Columna stock_reservado añadida a pedidos.");
    }
  } catch (error) {
    console.error("Error al alterar pedidos para stock_reservado:", error.message);
  }
}

export async function asegurarColumnaPagoIniciado() {
  try {
    const [cols] = await pool.query(
      `SHOW COLUMNS FROM pedidos LIKE 'pago_iniciado_en'`
    );
    if (cols.length === 0) {
      await pool.query(
        `ALTER TABLE pedidos
         ADD COLUMN pago_iniciado_en TIMESTAMP NULL DEFAULT NULL`
      );
      console.log("Columna pago_iniciado_en añadida a pedidos.");
    }
  } catch (error) {
    console.error("Error al alterar pedidos para pago_iniciado_en:", error.message);
  }
}
