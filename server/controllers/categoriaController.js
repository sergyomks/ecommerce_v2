import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import pool from "../database/db.js";
import { slugifyCategoria } from "../models/tablaCategoria.js";

const parseImagen = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return { url: String(raw) };
  }
};

const mapCategoria = (row) => ({
  id: row.id,
  nombre: row.nombre,
  slug: row.slug,
  categoria_padre_id: null,
  categoria_padre_nombre: null,
  imagen: parseImagen(row.imagen),
  activo: Boolean(row.activo),
  fecha_creacion: row.fecha_creacion,
  fecha_actualizacion: row.fecha_actualizacion,
});

export const listarCategorias = catchAsyncErrors(async (req, res) => {
  const [result] = await pool.query(`CALL sp_listar_categorias(1)`);
  const rows = result[0] || [];

  res.status(200).json({
    success: true,
    categorias: rows.map(mapCategoria),
  });
});

export const listarCategoriasAdmin = catchAsyncErrors(async (req, res) => {
  const [result] = await pool.query(`CALL sp_listar_categorias(0)`);
  const rows = result[0] || [];

  res.status(200).json({
    success: true,
    categorias: rows.map(mapCategoria),
  });
});

export const crearCategoria = catchAsyncErrors(async (req, res, next) => {
  const { nombre, imagen_url } = req.body;

  if (!nombre || !String(nombre).trim()) {
    return next(new ErrorHandler("El nombre de la categoría es obligatorio.", 400));
  }

  const nombreNorm = String(nombre).trim();
  const slug = slugifyCategoria(nombreNorm);

  const [resDuplicado] = await pool.query(`CALL sp_verificar_categoria_duplicada(?, ?, NULL)`, [nombreNorm, slug]);
  const duplicado = resDuplicado[0] || [];
  if (duplicado.length > 0) {
    return next(new ErrorHandler("Ya existe una categoría con ese nombre.", 400));
  }

  let imagen = null;

  if (req.files?.imagen) {
    const file = Array.isArray(req.files.imagen)
      ? req.files.imagen[0]
      : req.files.imagen;
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "ecommerce_categoria_imagenes",
      width: 600,
      crop: "scale",
    });
    imagen = { url: result.secure_url, public_id: result.public_id };
  } else if (imagen_url) {
    imagen = { url: String(imagen_url).trim() };
  }

  const id = crypto.randomUUID();
  const [resCat] = await pool.query(
    `CALL sp_crear_categoria(?, ?, ?, ?)`,
    [id, nombreNorm, slug, imagen ? JSON.stringify(imagen) : null]
  );
  const rows = resCat[0] || [];

  res.status(201).json({
    success: true,
    message: "Categoría creada correctamente.",
    categoria: mapCategoria(rows[0]),
  });
});

export const actualizarCategoria = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { nombre, imagen_url, activo } = req.body;

  const [existentes] = await pool.query(
    `SELECT * FROM categorias WHERE id = ? LIMIT 1`,
    [id]
  );
  if (existentes.length === 0) {
    return next(new ErrorHandler("Categoría no encontrada.", 404));
  }

  const actual = existentes[0];
  const nombreNorm = nombre ? String(nombre).trim() : actual.nombre;
  const slug = slugifyCategoria(nombreNorm);

  if (nombreNorm !== actual.nombre) {
    const [resDuplicado] = await pool.query(`CALL sp_verificar_categoria_duplicada(?, ?, ?)`, [nombreNorm, slug, id]);
    const duplicado = resDuplicado[0] || [];
    if (duplicado.length > 0) {
      return next(new ErrorHandler("Ya existe otra categoría con ese nombre.", 400));
    }
  }

  let imagen = parseImagen(actual.imagen);

  if (req.files?.imagen) {
    if (imagen?.public_id) {
      try {
        await cloudinary.uploader.destroy(imagen.public_id);
      } catch {

      }
    }
    const file = Array.isArray(req.files.imagen)
      ? req.files.imagen[0]
      : req.files.imagen;
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "ecommerce_categoria_imagenes",
      width: 600,
      crop: "scale",
    });
    imagen = { url: result.secure_url, public_id: result.public_id };
  } else if (imagen_url) {
    imagen = { url: String(imagen_url).trim(), public_id: imagen?.public_id };
  }

  const activoVal =
    activo === undefined || activo === null || activo === ""
      ? actual.activo
      : activo === true || activo === "1" || activo === 1 || activo === "true"
        ? 1
        : 0;

  const [resCat] = await pool.query(
    `CALL sp_actualizar_categoria(?, ?, ?, ?, ?)`,
    [id, nombreNorm, slug, imagen ? JSON.stringify(imagen) : null, activoVal]
  );
  const rows = resCat[0] || [];

  res.status(200).json({
    success: true,
    message: "Categoría actualizada correctamente.",
    categoria: mapCategoria(rows[0]),
  });
});

export const eliminarCategoria = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const [existentes] = await pool.query(
    `SELECT * FROM categorias WHERE id = ? LIMIT 1`,
    [id]
  );
  if (existentes.length === 0) {
    return next(new ErrorHandler("Categoría no encontrada.", 404));
  }

  const cat = existentes[0];

  const [resSubcats] = await pool.query(`CALL sp_contar_subcategorias_por_categoria(?)`, [id]);
  const subcats = resSubcats[0] || [];
  if (Number(subcats[0].total) > 0) {
    return next(
      new ErrorHandler(
        "Primero elimina las subcategorías asociadas a esta categoría.",
        400
      )
    );
  }

  const [resProductos] = await pool.query(`CALL sp_contar_productos_por_categoria(?)`, [id]);
  const productos = resProductos[0] || [];

  if (Number(productos[0].total) > 0) {
    await pool.query(`CALL sp_desactivar_categoria(?)`, [id]);
    return res.status(200).json({
      success: true,
      message:
        "La categoría tiene productos asociados; se desactivó en lugar de eliminarla.",
      softDeleted: true,
    });
  }

  if (parseImagen(cat.imagen)?.public_id) {
    try {
      await cloudinary.uploader.destroy(parseImagen(cat.imagen).public_id);
    } catch {

    }
  }

  await pool.query(`CALL sp_eliminar_categoria(?)`, [id]);

  res.status(200).json({
    success: true,
    message: "Categoría eliminada correctamente.",
  });
});
