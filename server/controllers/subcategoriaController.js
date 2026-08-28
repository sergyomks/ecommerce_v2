import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import pool from "../database/db.js";
import { slugifySubcategoria } from "../models/tablaSubcategoria.js";

const parseImagen = (raw) => {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return { url: String(raw) };
  }
};

const mapSubcategoria = (row) => ({
  id: row.id,
  nombre: row.nombre,
  slug: row.slug,
  id_categoria: row.id_categoria,
  categoria_nombre: row.categoria_nombre || null,
  imagen: parseImagen(row.imagen),
  activo: Boolean(row.activo),
  fecha_creacion: row.fecha_creacion,
  fecha_actualizacion: row.fecha_actualizacion,
});

export const listarSubcategorias = catchAsyncErrors(async (req, res) => {
  const [result] = await pool.query(`CALL sp_listar_subcategorias(NULL, 1)`);
  const rows = result[0] || [];

  res.status(200).json({
    success: true,
    subcategorias: rows.map(mapSubcategoria),
  });
});

export const listarSubcategoriasAdmin = catchAsyncErrors(async (req, res) => {
  const [result] = await pool.query(`CALL sp_listar_subcategorias(NULL, 0)`);
  const rows = result[0] || [];

  res.status(200).json({
    success: true,
    subcategorias: rows.map(mapSubcategoria),
  });
});

export const crearSubcategoria = catchAsyncErrors(async (req, res, next) => {
  const { nombre, id_categoria, imagen_url } = req.body;

  if (!nombre || !String(nombre).trim()) {
    return next(new ErrorHandler("El nombre de la subcategoría es obligatorio.", 400));
  }
  if (!id_categoria) {
    return next(new ErrorHandler("La categoría padre (id_categoria) es obligatoria.", 400));
  }

  const nombreNorm = String(nombre).trim();
  const slug = slugifySubcategoria(nombreNorm);

  const [resCat] = await pool.query(`CALL sp_obtener_categoria_por_id(?)`, [id_categoria]);
  const catExiste = resCat[0] || [];
  if (catExiste.length === 0) {
    return next(new ErrorHandler("La categoría padre especificada no existe.", 404));
  }

  const [resDuplicado] = await pool.query(`CALL sp_verificar_subcategoria_duplicada(?, ?, NULL)`, [nombreNorm, slug]);
  const duplicado = resDuplicado[0] || [];
  if (duplicado.length > 0) {
    return next(new ErrorHandler("Ya existe una subcategoría con ese nombre.", 400));
  }

  let imagen = null;
  if (req.files?.imagen) {
    const file = Array.isArray(req.files.imagen) ? req.files.imagen[0] : req.files.imagen;
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "ecommerce_subcategoria_imagenes",
      width: 600,
      crop: "scale",
    });
    imagen = { url: result.secure_url, public_id: result.public_id };
  } else if (imagen_url) {
    imagen = { url: String(imagen_url).trim() };
  }

  const id = crypto.randomUUID();
  const [resSubcat] = await pool.query(
    `CALL sp_crear_subcategoria(?, ?, ?, ?, ?, 1)`,
    [id, nombreNorm, slug, id_categoria, imagen ? JSON.stringify(imagen) : null]
  );
  const rows = resSubcat[0] || [];

  res.status(201).json({
    success: true,
    message: "Subcategoría creada correctamente.",
    subcategoria: mapSubcategoria(rows[0]),
  });
});

export const actualizarSubcategoria = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { nombre, id_categoria, imagen_url, activo } = req.body;

  const [resExistentes] = await pool.query(`CALL sp_obtener_subcategoria_por_id(?)`, [id]);
  const existentes = resExistentes[0] || [];
  if (existentes.length === 0) {
    return next(new ErrorHandler("Subcategoría no encontrada.", 404));
  }

  const actual = existentes[0];
  const nombreNorm = nombre ? String(nombre).trim() : actual.nombre;
  const slug = slugifySubcategoria(nombreNorm);
  const catId = id_categoria || actual.id_categoria;

  if (nombreNorm !== actual.nombre) {
    const [resDuplicado] = await pool.query(`CALL sp_verificar_subcategoria_duplicada(?, ?, ?)`, [nombreNorm, slug, id]);
    const duplicado = resDuplicado[0] || [];
    if (duplicado.length > 0) {
      return next(new ErrorHandler("Ya existe otra subcategoría con ese nombre.", 400));
    }
  }

  let imagen = parseImagen(actual.imagen);
  if (req.files?.imagen) {
    if (imagen?.public_id) {
      try {
        await cloudinary.uploader.destroy(imagen.public_id);
      } catch {}
    }
    const file = Array.isArray(req.files.imagen) ? req.files.imagen[0] : req.files.imagen;
    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: "ecommerce_subcategoria_imagenes",
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
      : (activo === true || activo === "1" || activo === 1 || activo === "true") ? 1 : 0;

  const [resSubcat] = await pool.query(
    `CALL sp_actualizar_subcategoria(?, ?, ?, ?, ?, ?)`,
    [id, nombreNorm, slug, catId, imagen ? JSON.stringify(imagen) : null, activoVal]
  );
  const rows = resSubcat[0] || [];

  res.status(200).json({
    success: true,
    message: "Subcategoría actualizada correctamente.",
    subcategoria: mapSubcategoria(rows[0]),
  });
});

export const eliminarSubcategoria = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const [resExistentes] = await pool.query(`CALL sp_obtener_subcategoria_por_id(?)`, [id]);
  const existentes = resExistentes[0] || [];
  if (existentes.length === 0) {
    return next(new ErrorHandler("Subcategoría no encontrada.", 404));
  }

  await pool.query(`CALL sp_eliminar_subcategoria(?)`, [id]);

  res.status(200).json({
    success: true,
    message: "Subcategoría eliminada correctamente.",
  });
});
