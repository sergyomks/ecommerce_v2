import pool from "../database/db.js";

export function slugifySubcategoria(nombre) {
  return String(nombre)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function crearSubcategoriaTabla() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS subcategorias (
        id CHAR(36) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        slug VARCHAR(120) NOT NULL,
        id_categoria CHAR(36) NOT NULL,
        imagen JSON DEFAULT NULL,
        activo TINYINT(1) DEFAULT 1,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_subcategoria_nombre (nombre),
        UNIQUE KEY uk_subcategoria_slug (slug),
        FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    await pool.query(query);
  } catch (error) {
    console.error("Error al crear la tabla subcategorias:", error.message);
    throw error;
  }
}

export async function migrarSubcategorias() {
  try {
    const [cols] = await pool.query(
      `SHOW COLUMNS FROM categorias LIKE 'categoria_padre_id'`
    );
    if (cols.length === 0) return;

    console.log("Migrando subcategorías desde categorias.categoria_padre_id...");

    const [hijos] = await pool.query(
      `SELECT * FROM categorias WHERE categoria_padre_id IS NOT NULL`
    );

    for (const h of hijos) {
      const [existe] = await pool.query(
        `SELECT id FROM subcategorias WHERE id = ? LIMIT 1`,
        [h.id]
      );
      if (existe.length === 0) {
        await pool.query(
          `INSERT INTO subcategorias (id, nombre, slug, id_categoria, imagen, activo, fecha_creacion, fecha_actualizacion)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            h.id,
            h.nombre,
            h.slug,
            h.categoria_padre_id,
            h.imagen ? (typeof h.imagen === "object" ? JSON.stringify(h.imagen) : h.imagen) : null,
            h.activo,
            h.fecha_creacion,
            h.fecha_actualizacion,
          ]
        );
      }
    }

    const [prodCols] = await pool.query(`SHOW COLUMNS FROM productos LIKE 'id_subcategoria'`);
    if (prodCols.length > 0) {
      await pool.query(`
        UPDATE productos p
        INNER JOIN categorias c ON c.id = p.id_categoria
        SET p.id_subcategoria = c.id, p.id_categoria = c.categoria_padre_id
        WHERE c.categoria_padre_id IS NOT NULL
      `);
    }

    const [fks] = await pool.query(`
      SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'categorias'
        AND CONSTRAINT_NAME = 'fk_categoria_padre'
      LIMIT 1
    `);
    if (fks.length > 0) {
      await pool.query(`ALTER TABLE categorias DROP FOREIGN KEY fk_categoria_padre`);
    }

    await pool.query(`DELETE FROM categorias WHERE categoria_padre_id IS NOT NULL`);

    const [restricciones] = await pool.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'categorias'
         AND COLUMN_NAME = 'categoria_padre_id'
         AND REFERENCED_TABLE_NAME IS NOT NULL`
    );
    for (const { CONSTRAINT_NAME } of restricciones) {
      await pool.query(
        `ALTER TABLE categorias DROP FOREIGN KEY \`${CONSTRAINT_NAME}\``
      );
    }

    await pool.query(`ALTER TABLE categorias DROP COLUMN categoria_padre_id`);

    console.log("Migración de subcategorías completada.");
  } catch (error) {
    console.error("Error en migración de subcategorías:", error.message);
    throw error;
  }
}
