import pool from "../database/db.js";

export async function crearPedidoDetalleTabla() {
  try {
    const query = `
        CREATE TABLE IF NOT EXISTS detalles_pedido (
        id CHAR(36) PRIMARY KEY,
        id_pedido CHAR(36) NOT NULL,
        id_producto CHAR(36) NOT NULL,
        cantidad INT NOT NULL CHECK (cantidad > 0),
        precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
        imagen TEXT NOT NULL,
        titulo TEXT NOT NULL,
        fecha_creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
        FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE
      );
        `;
    await pool.query(query);

  } catch (error) {
    console.error("Error al crear la tabla de detalles de pedido:", error.message);
    throw error;
  }
}

export async function asegurarColumnasVarianteDetalle() {
  try {
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'detalles_pedido'
         AND COLUMN_NAME IN ('id_variante', 'talla', 'color')`
    );
    const existentes = new Set(cols.map((c) => c.COLUMN_NAME));

    if (!existentes.has("id_variante")) {
      await pool.query(
        `ALTER TABLE detalles_pedido
         ADD COLUMN id_variante CHAR(36) NULL DEFAULT NULL AFTER id_producto`
      );
    }
    if (!existentes.has("talla")) {
      await pool.query(
        `ALTER TABLE detalles_pedido
         ADD COLUMN talla VARCHAR(20) NULL DEFAULT NULL AFTER id_variante`
      );
    }
    if (!existentes.has("color")) {
      await pool.query(
        `ALTER TABLE detalles_pedido
         ADD COLUMN color VARCHAR(40) NULL DEFAULT NULL AFTER talla`
      );
    }

    const [fks] = await pool.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'detalles_pedido'
         AND COLUMN_NAME = 'id_variante' AND REFERENCED_TABLE_NAME IS NOT NULL
       LIMIT 1`
    );
    if (fks.length === 0) {
      await pool.query(
        `ALTER TABLE detalles_pedido
         ADD CONSTRAINT fk_detalle_variante
         FOREIGN KEY (id_variante) REFERENCES variantes_producto(id)
         ON DELETE SET NULL`
      );
    }

    if (existentes.size < 3) {
      console.log("Columnas de variante añadidas a detalles_pedido.");
    }
  } catch (error) {
    console.error("Error al añadir columnas de variante al detalle:", error.message);
    throw error;
  }
}
