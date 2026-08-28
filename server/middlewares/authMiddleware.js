import jwt from "jsonwebtoken";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "./errorMiddleware.js";
import pool from "../database/db.js";

export const isAuthenticate = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return next(
      new ErrorHandler("Inicie sesión para acceder a este recurso.", 401)
    );
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  const [result] = await pool.query(`CALL sp_obtener_usuario_por_id(?)`, [decoded.id]);
  const rows = result[0] || [];
  if (!rows.length) {
    return next(new ErrorHandler("Usuario no encontrado.", 401));
  }
  req.user = rows[0];
  req.usuario = rows[0];
  next();
});

export const autherizedRoles = (...roles) => {
  return (req, res, next) => {
    const user = req.user || req.usuario;
    if (!user || !roles.includes(user.rol)) {
      return next(
        new ErrorHandler(
          `Role (${user ? user.rol : "desconocido"}) no autorizado para acceder a este recurso.`,
          403
        )
      );
    }
    next();
  };
};
