import pool from "../database/db.js";

export async function crearVarianteTabla() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS variantes_producto (
        id CHAR(36) PRIMARY KEY,
        id_producto CHAR(36) NOT NULL,
        talla VARCHAR(20) NOT NULL,
        color VARCHAR(40) NOT NULL,
        color_hex CHAR(7) NULL DEFAULT NULL,
        sku VARCHAR(60) NULL DEFAULT NULL,
        stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
        activo TINYINT(1) NOT NULL DEFAULT 1,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP NULL DEFAULT NULL,
        UNIQUE KEY uq_variante (id_producto, talla, color),
        UNIQUE KEY uq_variante_sku (sku),
        KEY idx_variante_producto_activa (id_producto, activo, stock),
        FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE
      );
    `);
  } catch (error) {
    console.error("Error al crear la tabla de variantes:", error.message);
    throw error;
  }
}

export const TALLA_UNICA = "Única";
export const COLOR_UNICO = "Único";

export async function migrarProductosAVariantes() {
  try {
    const [pendientes] = await pool.query(
      `SELECT p.id, p.stock
       FROM productos p
       LEFT JOIN variantes_producto v ON v.id_producto = p.id
       WHERE v.id IS NULL`
    );

    if (pendientes.length === 0) return;

    console.log(
      `Creando variante ${TALLA_UNICA}/${COLOR_UNICO} para ${pendientes.length} producto(s) sin variantes...`
    );

    await pool.query(
      `INSERT INTO variantes_producto (id, id_producto, talla, color, stock, activo)
       SELECT UUID(), p.id, ?, ?, p.stock, 1
       FROM productos p
       LEFT JOIN variantes_producto v ON v.id_producto = p.id
       WHERE v.id IS NULL`,
      [TALLA_UNICA, COLOR_UNICO]
    );

    console.log("Migración de productos a variantes completada.");
  } catch (error) {
    console.error("Error al migrar productos a variantes:", error.message);
    throw error;
  }
}

export async function recalcularStockTotal(idProducto = null) {
  try {
    const [resultado] = await pool.query(
      `UPDATE productos p
       SET p.stock = COALESCE((
         SELECT SUM(v.stock) FROM variantes_producto v
         WHERE v.id_producto = p.id AND v.activo = 1
       ), 0)
       WHERE (? IS NULL OR p.id = ?)`,
      [idProducto, idProducto]
    );
    return resultado.affectedRows;
  } catch (error) {
    console.error("Error al recalcular el stock total:", error.message);
    throw error;
  }
}

export async function migrarDetallesAVariantes() {
  try {
    const [resultado] = await pool.query(
      `UPDATE detalles_pedido d
       INNER JOIN variantes_producto v
         ON v.id_producto = d.id_producto AND v.talla = ? AND v.color = ?
       SET d.id_variante = v.id, d.talla = v.talla, d.color = v.color
       WHERE d.id_variante IS NULL`,
      [TALLA_UNICA, COLOR_UNICO]
    );

    if (resultado.affectedRows > 0) {
      console.log(
        `Líneas de pedido enlazadas a su variante: ${resultado.affectedRows}.`
      );
    }
  } catch (error) {
    console.error("Error al enlazar detalles con variantes:", error.message);
    throw error;
  }
}
