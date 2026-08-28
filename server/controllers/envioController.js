import crypto from "crypto";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import pool from "../database/db.js";
import {
  calcularPrecioEnvio,
  getEnvioConfig,
} from "../utils/calcularEnvio.js";

export const obtenerConfigEnvio = catchAsyncErrors(async (req, res) => {
  const config = getEnvioConfig();
  res.status(200).json({
    success: true,
    ...config,
  });
});

export const calcularEnvioEndpoint = catchAsyncErrors(async (req, res) => {
  const departamento = req.query.departamento || req.body?.departamento;
  const subtotal = req.query.subtotal ?? req.body?.subtotal ?? 0;
  const resultado = await calcularPrecioEnvio({
    departamento,
    subtotal: Number(subtotal) || 0,
  });

  res.status(200).json({
    success: true,
    ...resultado,
  });
});

export const listarTarifasPublicas = catchAsyncErrors(async (req, res) => {
  const [resTarifas] = await pool.query(`CALL sp_listar_tarifas_envio(1)`);
  const rows = resTarifas[0] || [];
  res.status(200).json({
    success: true,
    tarifas: rows.map((r) => ({
      departamento: r.departamento,
      precio: Number(r.precio),
    })),
  });
});

export const listarTarifas = catchAsyncErrors(async (req, res) => {
  const [resTarifas] = await pool.query(`CALL sp_listar_tarifas_envio(0)`);
  const rows = resTarifas[0] || [];
  res.status(200).json({
    success: true,
    tarifas: rows.map((r) => ({
      id: r.id,
      id_departamento: r.id_departamento,
      departamento: r.departamento,
      precio: Number(r.precio),
      activo: Boolean(r.activo),
      fecha_creacion: r.fecha_creacion,
    })),
    config: getEnvioConfig(),
  });
});

export const crearTarifa = catchAsyncErrors(async (req, res, next) => {
  const { id_departamento, departamento, precio, activo = true } = req.body;
  const precioNum = Number(precio);
  if (!Number.isFinite(precioNum) || precioNum < 0) {
    return next(new ErrorHandler("Precio inválido.", 400));
  }

  let depId = id_departamento;
  if (!depId && departamento) {
    const [resDep] = await pool.query(`CALL sp_obtener_departamento_por_nombre(?)`, [String(departamento).trim()]);
    const dep = resDep[0] || [];
    if (dep.length > 0) depId = dep[0].id;
  }

  if (!depId) {
    return next(new ErrorHandler("El departamento especificado no existe.", 400));
  }

  const id = crypto.randomUUID();
  try {
    const [resRows] = await pool.query(`CALL sp_crear_tarifa_envio(?, ?, ?, ?)`, [
      id,
      depId,
      precioNum,
      activo === false || activo === "0" || activo === 0 ? 0 : 1,
    ]);
    const rows = resRows[0] || [];
    res.status(201).json({
      success: true,
      message: "Tarifa creada.",
      tarifa: rows[0],
    });
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return next(new ErrorHandler("Ya existe una tarifa para ese departamento.", 400));
    }
    throw err;
  }
});

export const actualizarTarifa = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { precio, activo } = req.body;

  const [resExistentes] = await pool.query(`CALL sp_obtener_tarifa_envio(?)`, [id]);
  const existentes = resExistentes[0] || [];
  if (!existentes.length) {
    return next(new ErrorHandler("Tarifa no encontrada.", 404));
  }

  const actual = existentes[0];
  const precioNum =
    precio !== undefined && precio !== null && precio !== ""
      ? Number(precio)
      : Number(actual.precio);
  const activoVal =
    activo === undefined
      ? actual.activo
      : activo === false || activo === "0" || activo === 0
        ? 0
        : 1;

  if (!Number.isFinite(precioNum) || precioNum < 0) {
    return next(new ErrorHandler("Precio inválido.", 400));
  }

  const [resUpdate] = await pool.query(`CALL sp_actualizar_tarifa_envio(?, ?, ?)`, [id, precioNum, activoVal]);
  const rows = resUpdate[0] || [];
  res.status(200).json({
    success: true,
    message: "Tarifa actualizada.",
    tarifa: rows[0],
  });
});

export const eliminarTarifa = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const [resDelete] = await pool.query(`CALL sp_eliminar_tarifa_envio(?)`, [id]);
  const affectedRows = resDelete[0]?.[0]?.affected || 0;
  if (affectedRows === 0) {
    return next(new ErrorHandler("Tarifa no encontrada.", 404));
  }
  res.status(200).json({
    success: true,
    message: "Tarifa eliminada.",
  });
});
