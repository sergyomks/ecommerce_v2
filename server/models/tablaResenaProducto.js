import pool from "../database/db.js";

export async function crearResenaProductoTabla() {
  try {
    const query = `
        CREATE TABLE IF NOT EXISTS resenas_productos (
        id CHAR(36) PRIMARY KEY,
        id_producto CHAR(36) NOT NULL,
        id_usuario CHAR(36) NOT NULL,
        calificacion DECIMAL(3,2) NOT NULL CHECK (calificacion BETWEEN 0 AND 5),
        comentario TEXT NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE,
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
      );
        `;
    await pool.query(query);

  } catch (error) {
    console.error("Error al crear la tabla de reseñas de productos:", error.message);
    throw error;
  }
}
