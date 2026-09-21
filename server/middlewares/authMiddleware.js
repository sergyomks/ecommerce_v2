import jwt from "jsonwebtoken";
import { catchAsyncErrors } from "./catchAsyncError.js";
import ErrorHandler from "./errorMiddleware.js";
import pool from "../database/db.js";
import { COOKIE_NAMES } from "../utils/jwtToken.js";

const leerToken = (req) => {
  const scopeHeader = req.headers?.["x-auth-scope"];
  if (scopeHeader === "admin") {
    return req.cookies?.[COOKIE_NAMES.admin] || null;
  }
  if (scopeHeader === "store") {
    return req.cookies?.[COOKIE_NAMES.store] || null;
  }
  return req.cookies?.[COOKIE_NAMES.admin] || req.cookies?.[COOKIE_NAMES.store] || null;
};

export const isAuthenticate = catchAsyncErrors(async (req, res, next) => {
  const token = leerToken(req);
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
  req.authScope = decoded.scope || "store";
  next();
});

export const isAuthenticateAdmin = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies?.[COOKIE_NAMES.admin];
  if (!token) {
    return next(
      new ErrorHandler("Inicie sesión como administrador para acceder a este recurso.", 401)
    );
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  if (decoded.scope !== "admin") {
    return next(
      new ErrorHandler("Sesión no válida para el panel administrativo.", 403)
    );
  }
  const [result] = await pool.query(`CALL sp_obtener_usuario_por_id(?)`, [decoded.id]);
  const rows = result[0] || [];
  if (!rows.length) {
    return next(new ErrorHandler("Usuario no encontrado.", 401));
  }
  if (rows[0].rol !== "Admin") {
    return next(
      new ErrorHandler("No tiene permisos de administrador.", 403)
    );
  }
  req.user = rows[0];
  req.usuario = rows[0];
  req.authScope = "admin";
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
