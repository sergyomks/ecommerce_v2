
import pool from "../database/db.js";

export async function crearProductoTabla() {
    try {
        const query = `
        CREATE TABLE IF NOT EXISTS productos (
        id CHAR(36) PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        descripcion TEXT NOT NULL,
        precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
        id_categoria CHAR(36) NOT NULL,
        id_subcategoria CHAR(36) NULL,
        calificaciones DECIMAL(3,2) DEFAULT 0 CHECK (calificaciones BETWEEN 0 AND 5),
        imagenes JSON DEFAULT (JSON_ARRAY()),
        stock INT NOT NULL CHECK (stock >= 0),
        creado_por CHAR(36) NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        estado ENUM('activo', 'eliminado') DEFAULT 'activo',
        fecha_eliminacion TIMESTAMP NULL,
        FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        FOREIGN KEY (id_subcategoria) REFERENCES subcategorias(id) ON UPDATE CASCADE ON DELETE SET NULL
      );
        `;
        await pool.query(query);
    } catch (error) {
        console.error("Error al crear la tabla de productos:", error.message);
        throw error;
    }
}

export async function migrarCategoriaAFK() {
    try {

        const [cols] = await pool.query(
            `SHOW COLUMNS FROM productos LIKE 'categoria'`
        );
        if (cols.length === 0) return;

        console.log("Migrando productos.categoria (VARCHAR) → id_categoria (FK)…");

        const [nuevaCols] = await pool.query(
            `SHOW COLUMNS FROM productos LIKE 'id_categoria'`
        );
        if (nuevaCols.length === 0) {
            await pool.query(
                `ALTER TABLE productos ADD COLUMN id_categoria CHAR(36) NULL AFTER precio`
            );
        }

        await pool.query(`
            UPDATE productos p
            INNER JOIN categorias c ON c.nombre = p.categoria
            SET p.id_categoria = c.id
        `);

        const [huerfanos] = await pool.query(
            `SELECT COUNT(*) AS total FROM productos WHERE id_categoria IS NULL`
        );
        if (Number(huerfanos[0].total) > 0) {
            console.warn(
                `⚠️  ${huerfanos[0].total} producto(s) tienen categoría no reconocida. Se les asignará la primera categoría activa.`
            );

            const [primera] = await pool.query(
                `SELECT id FROM categorias WHERE activo = 1 ORDER BY nombre ASC LIMIT 1`
            );
            if (primera.length > 0) {
                await pool.query(
                    `UPDATE productos SET id_categoria = ? WHERE id_categoria IS NULL`,
                    [primera[0].id]
                );
            }
        }

        await pool.query(
            `ALTER TABLE productos MODIFY COLUMN id_categoria CHAR(36) NOT NULL`
        );

        const [indices] = await pool.query(
            `SHOW INDEX FROM productos WHERE Key_name = 'idx_producto_estado_categoria'`
        );
        if (indices.length > 0) {
            await pool.query(
                `ALTER TABLE productos DROP INDEX idx_producto_estado_categoria`
            );
        }

        const [fks] = await pool.query(`
            SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'productos'
              AND COLUMN_NAME = 'id_categoria'
              AND REFERENCED_TABLE_NAME = 'categorias'
            LIMIT 1
        `);
        if (fks.length === 0) {
            await pool.query(`
                ALTER TABLE productos
                ADD CONSTRAINT fk_producto_categoria
                FOREIGN KEY (id_categoria) REFERENCES categorias(id)
                ON UPDATE CASCADE ON DELETE RESTRICT
            `);
        }

        await pool.query(`ALTER TABLE productos DROP COLUMN categoria`);

        console.log("✅ Migración productos.categoria → id_categoria completada.");
    } catch (error) {
        console.error("Error en migración de categoría:", error.message);
        throw error;
    }
}

export async function asegurarColumnaSubcategoriaProducto() {
    try {
        const [cols] = await pool.query(
            `SHOW COLUMNS FROM productos LIKE 'id_subcategoria'`
        );
        if (cols.length === 0) {
            await pool.query(
                `ALTER TABLE productos
                 ADD COLUMN id_subcategoria CHAR(36) NULL AFTER id_categoria,
                 ADD CONSTRAINT fk_producto_subcategoria
                 FOREIGN KEY (id_subcategoria) REFERENCES subcategorias(id)
                 ON UPDATE CASCADE ON DELETE SET NULL`
            );
            console.log("Columna id_subcategoria añadida a productos.");
        }
    } catch (error) {
        console.error("Error al asegurar id_subcategoria en productos:", error.message);
    }
}

export async function asegurarColumnasOferta() {
  try {
    const [cols] = await pool.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos'
         AND COLUMN_NAME IN ('precio_oferta', 'oferta_inicio', 'oferta_fin')`
    );
    const existentes = new Set(cols.map((c) => c.COLUMN_NAME));

    if (!existentes.has("precio_oferta")) {
      await pool.query(
        `ALTER TABLE productos
         ADD COLUMN precio_oferta DECIMAL(10,2) NULL DEFAULT NULL AFTER precio`
      );
    }
    if (!existentes.has("oferta_inicio")) {
      await pool.query(
        `ALTER TABLE productos
         ADD COLUMN oferta_inicio DATETIME NULL DEFAULT NULL AFTER precio_oferta`
      );
    }
    if (!existentes.has("oferta_fin")) {
      await pool.query(
        `ALTER TABLE productos
         ADD COLUMN oferta_fin DATETIME NULL DEFAULT NULL AFTER oferta_inicio`
      );
    }

    const [idx] = await pool.query(
      `SELECT 1 FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'productos'
         AND INDEX_NAME = 'idx_producto_oferta' LIMIT 1`
    );
    if (idx.length === 0) {
      await pool.query(
        `ALTER TABLE productos
         ADD INDEX idx_producto_oferta (estado, precio_oferta, oferta_fin)`
      );
    }

    if (existentes.size < 3) {
      console.log("Columnas de oferta añadidas a productos.");
    }
  } catch (error) {
    console.error("Error al añadir columnas de oferta:", error.message);
    throw error;
  }
}
