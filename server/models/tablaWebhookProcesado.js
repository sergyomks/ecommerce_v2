import pool from "../database/db.js";

export async function crearWebhookProcesadoTabla() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS webhooks_procesados (
        id CHAR(36) PRIMARY KEY,
        id_evento VARCHAR(255) NOT NULL,
        tipo_evento VARCHAR(100) NOT NULL,
        id_cargo VARCHAR(255) NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_id_evento (id_evento),
        KEY idx_id_cargo (id_cargo)
      );
    `;
    await pool.query(query);
  } catch (error) {
    console.error("Error al crear la tabla de webhooks_procesados:", error.message);
    throw error;
  }
}
