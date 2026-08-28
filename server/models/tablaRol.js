import pool from "../database/db.js";

const SEED_ROLES = ["Usuario", "Admin"];

export async function crearRolTabla() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(30) NOT NULL UNIQUE
      );
    `);

    const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM roles`);
    if (Number(rows[0].total) === 0) {
      for (const nombre of SEED_ROLES) {
        await pool.query(`INSERT INTO roles (nombre) VALUES (?)`, [nombre]);
      }
      console.log("Roles iniciales insertados.");
    }
  } catch (error) {
    console.error("Error al crear la tabla roles:", error.message);
    throw error;
  }
}
