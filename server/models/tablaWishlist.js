import pool from "../database/db.js";

export async function crearWishlistTabla() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS lista_deseos (
        id CHAR(36) PRIMARY KEY,
        id_usuario CHAR(36) NOT NULL,
        id_producto CHAR(36) NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_wishlist_user_product (id_usuario, id_producto),
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE
      );
    `;
    await pool.query(query);
  } catch (error) {
    console.error("Error al crear la tabla lista_deseos:", error.message);
    throw error;
  }
}
