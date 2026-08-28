import pool from "../database/db.js";

export async function crearInformacionEnvioTabla() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS informacion_envio (
        id CHAR(36) PRIMARY KEY,
        id_pedido CHAR(36) NOT NULL UNIQUE,
        nombre_completo VARCHAR(100) NOT NULL,
        id_distrito INT NOT NULL,
        direccion TEXT NOT NULL,
        referencia TEXT,
        codigo_postal VARCHAR(10) DEFAULT NULL,
        telefono VARCHAR(15) NOT NULL,
        FOREIGN KEY (id_pedido) REFERENCES pedidos(id) ON DELETE CASCADE,
        FOREIGN KEY (id_distrito) REFERENCES distritos(id) ON DELETE RESTRICT
      );
    `;
    await pool.query(query);
  } catch (error) {
    console.error("Error al crear la tabla de información de envío:", error.message);
    throw error;
  }
}

export async function migrarInformacionEnvioAFK() {
  try {
    const [cols] = await pool.query(`SHOW COLUMNS FROM informacion_envio LIKE 'distrito'`);
    if (cols.length === 0) return;

    console.log("Migrando informacion_envio (departamento, provincia, distrito) → id_distrito (FK)...");

    const [nuevaCols] = await pool.query(`SHOW COLUMNS FROM informacion_envio LIKE 'id_distrito'`);
    if (nuevaCols.length === 0) {
      await pool.query(`ALTER TABLE informacion_envio ADD COLUMN id_distrito INT NULL AFTER nombre_completo`);
    }

    await pool.query(`
      UPDATE informacion_envio ie
      INNER JOIN distritos d ON d.nombre = ie.distrito
      SET ie.id_distrito = d.id
    `);

    const [huerfanos] = await pool.query(`SELECT COUNT(*) AS total FROM informacion_envio WHERE id_distrito IS NULL`);
    if (Number(huerfanos[0].total) > 0) {
      const [primerDist] = await pool.query(`SELECT id FROM distritos LIMIT 1`);
      if (primerDist.length > 0) {
        await pool.query(`UPDATE informacion_envio SET id_distrito = ? WHERE id_distrito IS NULL`, [primerDist[0].id]);
      }
    }

    await pool.query(`ALTER TABLE informacion_envio MODIFY COLUMN id_distrito INT NOT NULL`);

    const [fks] = await pool.query(`
      SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'informacion_envio'
        AND COLUMN_NAME = 'id_distrito'
        AND REFERENCED_TABLE_NAME = 'distritos'
      LIMIT 1
    `);
    if (fks.length === 0) {
      await pool.query(`
        ALTER TABLE informacion_envio
        ADD CONSTRAINT fk_info_envio_distrito FOREIGN KEY (id_distrito) REFERENCES distritos(id) ON DELETE RESTRICT
      `);
    }

    const [depCol] = await pool.query(`SHOW COLUMNS FROM informacion_envio LIKE 'departamento'`);
    if (depCol.length > 0) await pool.query(`ALTER TABLE informacion_envio DROP COLUMN departamento`);

    const [provCol] = await pool.query(`SHOW COLUMNS FROM informacion_envio LIKE 'provincia'`);
    if (provCol.length > 0) await pool.query(`ALTER TABLE informacion_envio DROP COLUMN provincia`);

    const [distCol] = await pool.query(`SHOW COLUMNS FROM informacion_envio LIKE 'distrito'`);
    if (distCol.length > 0) await pool.query(`ALTER TABLE informacion_envio DROP COLUMN distrito`);

    console.log("Migración informacion_envio → id_distrito completada.");
  } catch (error) {
    console.error("Error en migración de informacion_envio:", error.message);
    throw error;
  }
}