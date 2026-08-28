import pool from "../database/db.js";

export async function crearPagoTabla() {
  try {
    const query = `
        CREATE TABLE IF NOT EXISTS pagos (
        id CHAR(36) PRIMARY KEY,
        id_pedido CHAR(36) NOT NULL,
        tipo_pago VARCHAR(20) NOT NULL CHECK (tipo_pago IN ('Online')),
        estado_pago VARCHAR(20) NOT NULL CHECK (estado_pago IN ('Pagado', 'Pendiente', 'Fallido')),
        id_intento_pago VARCHAR(255) UNIQUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_pago_pedido (id_pedido),
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE
      );
        `;
    await pool.query(query);
  } catch (error) {
    console.error("Error al crear la tabla de pagos:", error.message);
    throw error;
  }
}

export async function asegurarPagosMultiplesIntentos() {
  try {
    const [unicos] = await pool.query(
      `SHOW INDEX FROM pagos WHERE Column_name = 'id_pedido' AND Non_unique = 0`
    );
    const aEliminar = unicos.filter((i) => i.Key_name !== "PRIMARY");

    if (aEliminar.length === 0) return;

    const [existentes] = await pool.query(
      `SHOW INDEX FROM pagos WHERE Key_name = 'idx_pago_pedido'`
    );
    if (existentes.length === 0) {
      await pool.query(
        `ALTER TABLE pagos ADD INDEX idx_pago_pedido (id_pedido)`
      );
    }

    for (const indice of aEliminar) {
      await pool.query(`ALTER TABLE pagos DROP INDEX \`${indice.Key_name}\``);
      console.log(
        `Índice único ${indice.Key_name} eliminado de pagos (permite reintentos de cobro).`
      );
    }
  } catch (error) {
    console.error("Error al ajustar índices de pagos:", error.message);
  }
}