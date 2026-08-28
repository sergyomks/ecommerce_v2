import pool from "../database/db.js";

export async function crearContactoTabla() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS mensajes_contacto (
        id CHAR(36) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        asunto VARCHAR(200) NOT NULL,
        mensaje TEXT NOT NULL,
        leido TINYINT(1) DEFAULT 0,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
  } catch (error) {
    console.error("Error al crear la tabla mensajes_contacto:", error.message);
    throw error;
  }
}
