import pool from "../database/db.js";
import crypto from "crypto";

const SEED_CATEGORIAS = [
  {
    nombre: "Electronicos",
    imagen: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=300",
  },
  {
    nombre: "Moda",
    imagen: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=300",
  },
  {
    nombre: "Hogar y jardin",
    imagen: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300",
  },
  {
    nombre: "Deportes",
    imagen: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300",
  },
  {
    nombre: "Libros",
    imagen: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300",
  },
  {
    nombre: "Belleza",
    imagen: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300",
  },
  {
    nombre: "Automotriz",
    imagen: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300",
  },
  {
    nombre: "Niños y bebes",
    imagen: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=300",
  },
];

export function slugifyCategoria(nombre) {
  return String(nombre)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function crearCategoriaTabla() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS categorias (
        id CHAR(36) PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        slug VARCHAR(120) NOT NULL,
        categoria_padre_id CHAR(36) NULL,
        imagen JSON DEFAULT NULL,
        activo TINYINT(1) DEFAULT 1,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uk_categoria_nombre (nombre),
        UNIQUE KEY uk_categoria_slug (slug),
        FOREIGN KEY (categoria_padre_id) REFERENCES categorias(id) ON DELETE CASCADE
      );
    `;
    await pool.query(query);

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM categorias`
    );
    if (Number(countRows[0].total) === 0) {
      for (const cat of SEED_CATEGORIAS) {
        await pool.query(
          `INSERT INTO categorias (id, nombre, slug, imagen, activo)
           VALUES (?, ?, ?, ?, 1)`,
          [
            crypto.randomUUID(),
            cat.nombre,
            slugifyCategoria(cat.nombre),
            JSON.stringify({ url: cat.imagen }),
          ]
        );
      }
      console.log("Categorías iniciales insertadas (seed).");
    }
  } catch (error) {
    console.error("Error al crear la tabla categorias:", error.message);
    throw error;
  }
}

export async function asegurarColumnaCategoriaPadre() {
  try {
    const [cols] = await pool.query(
      `SHOW COLUMNS FROM categorias LIKE 'categoria_padre_id'`
    );
    if (cols.length === 0) {
      await pool.query(
        `ALTER TABLE categorias
         ADD COLUMN categoria_padre_id CHAR(36) NULL AFTER slug,
         ADD CONSTRAINT fk_categoria_padre
         FOREIGN KEY (categoria_padre_id) REFERENCES categorias(id) ON DELETE CASCADE`
      );
      console.log("Columna categoria_padre_id añadida a categorias.");
    }
  } catch (error) {
    console.error("Error al alterar categorias para categoria_padre_id:", error.message);
  }
}
