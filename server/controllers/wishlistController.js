import crypto from "crypto";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import pool from "../database/db.js";

const parseImagenes = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const listarWishlist = catchAsyncErrors(async (req, res, next) => {
  if (!req.usuario?.id) {
    return next(new ErrorHandler("Usuario no autenticado.", 401));
  }

  const [resWishlist] = await pool.query(`CALL sp_listar_wishlist(?)`, [req.usuario.id]);
  const rows = resWishlist[0] || [];

  const items = rows.map((row) => ({
    wishlist_id: row.wishlist_id,
    agregado_en: row.agregado_en,
    producto: {
      id: row.id,
      nombre: row.nombre,
      descripcion: row.descripcion,
      precio: row.precio,
      categoria: row.categoria,
      stock: row.stock,
      imagenes: parseImagenes(row.imagenes),
      calificaciones: row.calificaciones,
    },
  }));

  res.status(200).json({
    success: true,
    items,
    total: items.length,
  });
});

export const agregarWishlist = catchAsyncErrors(async (req, res, next) => {
  if (!req.usuario?.id) {
    return next(new ErrorHandler("Usuario no autenticado.", 401));
  }

  const { productoId } = req.params;
  const idDeseo = crypto.randomUUID();
  const [resAgregar] = await pool.query(`CALL sp_agregar_wishlist(?, ?, ?)`, [idDeseo, req.usuario.id, productoId]);
  const result = resAgregar[0]?.[0] || { status: 0 };

  if (result.status === 0) {
    return next(new ErrorHandler("Producto no encontrado.", 404));
  }

  if (result.status === 2) {
    return res.status(200).json({
      success: true,
      message: result.message,
      alreadyExists: true,
    });
  }

  res.status(201).json({
    success: true,
    message: "Producto agregado a la lista de deseos.",
  });
});

export const eliminarWishlist = catchAsyncErrors(async (req, res, next) => {
  if (!req.usuario?.id) {
    return next(new ErrorHandler("Usuario no autenticado.", 401));
  }

  const { productoId } = req.params;
  const [resDelete] = await pool.query(`CALL sp_eliminar_wishlist(?, ?)`, [req.usuario.id, productoId]);
  const affectedRows = resDelete[0]?.[0]?.affected || 0;

  if (affectedRows === 0) {
    return next(new ErrorHandler("El producto no está en tu lista de deseos.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Producto eliminado de la lista de deseos.",
  });
});

export const verificarWishlist = catchAsyncErrors(async (req, res, next) => {
  if (!req.usuario?.id) {
    return next(new ErrorHandler("Usuario no autenticado.", 401));
  }

  const { productoId } = req.params;
  const [resRows] = await pool.query(`CALL sp_verificar_wishlist(?, ?)`, [req.usuario.id, productoId]);
  const rows = resRows[0] || [];

  res.status(200).json({
    success: true,
    enWishlist: rows.length > 0,
  });
});
