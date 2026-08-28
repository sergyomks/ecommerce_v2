import pool from "../database/db.js";
import crypto from "crypto";

const SEED_TARIFAS = [
  { departamento: "Lima", precio: 2 },
  { departamento: "Callao", precio: 2 },
  { departamento: "Arequipa", precio: 8 },
  { departamento: "Cusco", precio: 10 },
  { departamento: "La Libertad", precio: 8 },
  { departamento: "Piura", precio: 10 },
  { departamento: "Lambayeque", precio: 9 },
  { departamento: "Junín", precio: 8 },
  { departamento: "Puno", precio: 12 },
  { departamento: "Ancash", precio: 9 },
  { departamento: "Ica", precio: 7 },
  { departamento: "Cajamarca", precio: 11 },
  { departamento: "San Martín", precio: 12 },
  { departamento: "Loreto", precio: 15 },
  { departamento: "Ucayali", precio: 14 },
  { departamento: "Madre de Dios", precio: 15 },
  { departamento: "Tacna", precio: 11 },
  { departamento: "Moquegua", precio: 11 },
  { departamento: "Ayacucho", precio: 10 },
  { departamento: "Huánuco", precio: 10 },
  { departamento: "Pasco", precio: 9 },
  { departamento: "Huancavelica", precio: 10 },
  { departamento: "Apurímac", precio: 11 },
  { departamento: "Amazonas", precio: 13 },
  { departamento: "Tumbes", precio: 12 },
];

export async function crearTarifaEnvioTabla() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tarifas_envio (
        id CHAR(36) PRIMARY KEY,
        id_departamento INT NOT NULL,
        precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
        activo TINYINT(1) NOT NULL DEFAULT 1,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_tarifa_departamento (id_departamento),
        FOREIGN KEY (id_departamento) REFERENCES departamentos(id) ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM tarifas_envio`
    );
    if (Number(countRows[0].total) === 0) {
      for (const t of SEED_TARIFAS) {
        const [dep] = await pool.query(`SELECT id FROM departamentos WHERE nombre = ? LIMIT 1`, [t.departamento]);
        if (dep.length > 0) {
          await pool.query(
            `INSERT INTO tarifas_envio (id, id_departamento, precio, activo)
             VALUES (?, ?, ?, 1)`,
            [crypto.randomUUID(), dep[0].id, t.precio]
          );
        }
      }
      console.log("Tarifas de envío iniciales insertadas.");
    }
  } catch (error) {
    console.error("Error al crear la tabla tarifas_envio:", error.message);
    throw error;
  }
}

export async function migrarTarifasEnvioAFK() {
  try {
    const [cols] = await pool.query(`SHOW COLUMNS FROM tarifas_envio LIKE 'departamento'`);
    if (cols.length === 0) return;

    console.log("Migrando tarifas_envio.departamento (VARCHAR) → id_departamento (FK)...");

    const [nuevaCols] = await pool.query(`SHOW COLUMNS FROM tarifas_envio LIKE 'id_departamento'`);
    if (nuevaCols.length === 0) {
      await pool.query(`ALTER TABLE tarifas_envio ADD COLUMN id_departamento INT NULL AFTER id`);
    }

    await pool.query(`
      UPDATE tarifas_envio te
      INNER JOIN departamentos d ON d.nombre = te.departamento
      SET te.id_departamento = d.id
    `);

    const [huerfanos] = await pool.query(`SELECT COUNT(*) AS total FROM tarifas_envio WHERE id_departamento IS NULL`);
    if (Number(huerfanos[0].total) > 0) {
      await pool.query(`DELETE FROM tarifas_envio WHERE id_departamento IS NULL`);
    }

    await pool.query(`ALTER TABLE tarifas_envio MODIFY COLUMN id_departamento INT NOT NULL`);

    const [idx] = await pool.query(`SHOW INDEX FROM tarifas_envio WHERE Key_name = 'uk_tarifa_departamento'`);
    if (idx.length > 0) {
      await pool.query(`ALTER TABLE tarifas_envio DROP INDEX uk_tarifa_departamento`);
    }

    const [fks] = await pool.query(`
      SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tarifas_envio'
        AND COLUMN_NAME = 'id_departamento'
        AND REFERENCED_TABLE_NAME = 'departamentos'
      LIMIT 1
    `);
    if (fks.length === 0) {
      await pool.query(`
        ALTER TABLE tarifas_envio
        ADD CONSTRAINT uk_tarifa_departamento UNIQUE (id_departamento),
        ADD CONSTRAINT fk_tarifa_departamento FOREIGN KEY (id_departamento) REFERENCES departamentos(id) ON DELETE CASCADE ON UPDATE CASCADE
      `);
    }

    await pool.query(`ALTER TABLE tarifas_envio DROP COLUMN departamento`);
    console.log("Migración tarifas_envio.departamento → id_departamento completada.");
  } catch (error) {
    console.error("Error en migración de tarifas_envio:", error.message);
    throw error;
  }
}

export async function quitarColumnasTrackingEnvio() {
  try {
    const columnas = ["carrier", "codigo_seguimiento", "url_tracking"];
    for (const col of columnas) {
      const [cols] = await pool.query(
        `SHOW COLUMNS FROM informacion_envio LIKE ?`,
        [col]
      );
      if (cols.length > 0) {
        await pool.query(`ALTER TABLE informacion_envio DROP COLUMN ${col}`);
      }
    }
  } catch (error) {
    console.error("Error al quitar columnas de tracking:", error.message);
  }
}
