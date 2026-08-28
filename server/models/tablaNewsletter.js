import pool from "../database/db.js";

export async function quitarTablaSuscriptoresNewsletter() {
  try {
    await pool.query(`DROP TABLE IF EXISTS suscriptores_newsletter`);
  } catch (error) {
    console.error(
      "Error al eliminar la tabla suscriptores_newsletter:",
      error.message
    );
  }
}
