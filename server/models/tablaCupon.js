import pool from "../database/db.js";

export async function crearCuponTabla() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS cupones (
        id CHAR(36) PRIMARY KEY,
        codigo VARCHAR(50) NOT NULL,
        tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('porcentaje', 'fijo')),
        valor DECIMAL(10,2) NOT NULL CHECK (valor > 0),
        minimo_compra DECIMAL(10,2) NOT NULL DEFAULT 0,
        usos_maximos INT NULL,
        usos_actuales INT NOT NULL DEFAULT 0,
        fecha_inicio TIMESTAMP NULL DEFAULT NULL,
        fecha_fin TIMESTAMP NULL DEFAULT NULL,
        activo TINYINT(1) NOT NULL DEFAULT 1,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_cupon_codigo (codigo)
      );
    `;
    await pool.query(query);
  } catch (error) {
    console.error("Error al crear la tabla cupones:", error.message);
    throw error;
  }
}

export async function asegurarColumnasPedidoCupon() {
  try {
    const [cols] = await pool.query(
      `SHOW COLUMNS FROM pedidos LIKE 'descuento'`
    );
    if (cols.length === 0) {
      await pool.query(
        `ALTER TABLE pedidos
         ADD COLUMN descuento DECIMAL(10,2) NOT NULL DEFAULT 0`
      );
      console.log("Columna descuento añadida a pedidos.");
    }
  } catch (error) {
    console.error("Error al alterar pedidos para cupones:", error.message);
  }
}

export async function migrarCodigoCuponAFK() {
  try {
    const [colsId] = await pool.query(
      `SHOW COLUMNS FROM pedidos LIKE 'id_cupon'`
    );
    if (colsId.length === 0) {
      await pool.query(
        `ALTER TABLE pedidos ADD COLUMN id_cupon CHAR(36) NULL AFTER descuento`
      );
      console.log("Columna id_cupon añadida a pedidos.");
    }

    const [colsCodigo] = await pool.query(
      `SHOW COLUMNS FROM pedidos LIKE 'codigo_cupon'`
    );
    if (colsCodigo.length > 0) {
      console.log("Migrando pedidos.codigo_cupon (VARCHAR) → id_cupon (FK)…");
      await pool.query(`
        UPDATE pedidos p
        INNER JOIN cupones c
          ON UPPER(TRIM(c.codigo)) = UPPER(TRIM(p.codigo_cupon))
        SET p.id_cupon = c.id
        WHERE p.id_cupon IS NULL
          AND p.codigo_cupon IS NOT NULL
          AND TRIM(p.codigo_cupon) <> ''
      `);

      const [huerfanos] = await pool.query(`
        SELECT COUNT(*) AS total
        FROM pedidos
        WHERE codigo_cupon IS NOT NULL
          AND TRIM(codigo_cupon) <> ''
          AND id_cupon IS NULL
      `);
      if (Number(huerfanos[0].total) > 0) {
        console.warn(
          `⚠️  ${huerfanos[0].total} pedido(s) tenían un código de cupón que ya no existe. Se deja id_cupon en NULL y se conserva el descuento.`
        );
      }

      await pool.query(`ALTER TABLE pedidos DROP COLUMN codigo_cupon`);
      console.log("Columna codigo_cupon eliminada de pedidos.");
    }

    const [fks] = await pool.query(`
      SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'pedidos'
        AND COLUMN_NAME = 'id_cupon'
        AND REFERENCED_TABLE_NAME = 'cupones'
      LIMIT 1
    `);
    if (fks.length === 0) {
      await pool.query(`
        ALTER TABLE pedidos
        ADD CONSTRAINT fk_pedido_cupon
        FOREIGN KEY (id_cupon) REFERENCES cupones(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
      `);
      console.log("FK pedidos.id_cupon → cupones.id creada.");
    }
  } catch (error) {
    console.error("Error en migración de cupón:", error.message);
    throw error;
  }
}
