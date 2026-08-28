import pool from "../database/db.js";

export async function crearUsuarioTabla() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id CHAR(36) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL CHECK (char_length(nombre) >= 3),
        email VARCHAR(100) UNIQUE NOT NULL,
        contraseña TEXT NOT NULL,
        id_rol INT NOT NULL DEFAULT 1,
        imagen JSON DEFAULT NULL,
        reset_contraseña_token TEXT DEFAULT NULL,
        reset_contraseña_expire TIMESTAMP NULL DEFAULT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (id_rol) REFERENCES roles(id) ON UPDATE CASCADE ON DELETE RESTRICT
      );
    `;
    await pool.query(query);
  } catch (error) {
    console.error("Error al crear la tabla de usuarios:", error.message);
    throw error;
  }
}

export async function migrarRolAFK() {
  try {
    const [cols] = await pool.query(
      `SHOW COLUMNS FROM usuarios LIKE 'rol'`
    );
    if (cols.length === 0) return;

    console.log("Migrando usuarios.rol (VARCHAR) → id_rol (FK)...");

    const [nuevaCols] = await pool.query(
      `SHOW COLUMNS FROM usuarios LIKE 'id_rol'`
    );
    if (nuevaCols.length === 0) {
      await pool.query(
        `ALTER TABLE usuarios ADD COLUMN id_rol INT NOT NULL DEFAULT 1 AFTER contraseña`
      );
    }

    await pool.query(`
      UPDATE usuarios u
      INNER JOIN roles r ON r.nombre = u.rol
      SET u.id_rol = r.id
    `);

    const [fks] = await pool.query(`
      SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'usuarios'
        AND COLUMN_NAME = 'id_rol'
        AND REFERENCED_TABLE_NAME = 'roles'
      LIMIT 1
    `);
    if (fks.length === 0) {
      await pool.query(`
        ALTER TABLE usuarios
        ADD CONSTRAINT fk_usuario_rol
        FOREIGN KEY (id_rol) REFERENCES roles(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
      `);
    }

    await pool.query(`ALTER TABLE usuarios DROP COLUMN rol`);
    console.log("Migración usuarios.rol → id_rol completada.");
  } catch (error) {
    console.error("Error en migración de rol:", error.message);
    throw error;
  }
}

export async function asegurarColumnasIntentosAcceso() {
  try {
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'
         AND COLUMN_NAME IN ('intentos_fallidos', 'bloqueado_hasta')`
    );
    const existentes = new Set(cols.map((c) => c.COLUMN_NAME));

    if (!existentes.has("intentos_fallidos")) {
      await pool.query(
        `ALTER TABLE usuarios
         ADD COLUMN intentos_fallidos INT NOT NULL DEFAULT 0 AFTER id_rol`
      );
    }

    if (!existentes.has("bloqueado_hasta")) {
      await pool.query(
        `ALTER TABLE usuarios
         ADD COLUMN bloqueado_hasta TIMESTAMP NULL DEFAULT NULL AFTER intentos_fallidos`
      );
    }

    if (existentes.size < 2) {
      console.log("Columnas de control de acceso añadidas a usuarios.");
    }
  } catch (error) {
    console.error("Error al añadir columnas de intentos de acceso:", error.message);
    throw error;
  }
}

export async function asegurarColumnasGoogle() {
  try {
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME, IS_NULLABLE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'
         AND COLUMN_NAME IN ('google_id', 'contraseña')`
    );
    const porNombre = new Map(cols.map((c) => [c.COLUMN_NAME, c]));

    if (!porNombre.has("google_id")) {
      await pool.query(
        `ALTER TABLE usuarios
         ADD COLUMN google_id VARCHAR(64) NULL DEFAULT NULL AFTER email,
         ADD UNIQUE KEY uq_usuario_google (google_id)`
      );
      console.log("Columna google_id añadida a usuarios.");
    }

    if (porNombre.get("contraseña")?.IS_NULLABLE === "NO") {
      await pool.query(
        `ALTER TABLE usuarios MODIFY COLUMN contraseña TEXT NULL DEFAULT NULL`
      );
      console.log("usuarios.contraseña ahora admite NULL (cuentas de Google).");
    }
  } catch (error) {
    console.error("Error al preparar el acceso con Google:", error.message);
    throw error;
  }
}
