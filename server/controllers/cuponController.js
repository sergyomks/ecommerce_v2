import crypto from "crypto";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import pool from "../database/db.js";
import { calcularDescuentoCupon } from "../utils/descuentoCupon.js";

const mapCupon = (row) => ({
  id: row.id,
  codigo: row.codigo,
  tipo: row.tipo,
  valor: Number(row.valor),
  minimo_compra: Number(row.minimo_compra),
  usos_maximos: row.usos_maximos,
  usos_actuales: row.usos_actuales,
  fecha_inicio: row.fecha_inicio,
  fecha_fin: row.fecha_fin,
  activo: Boolean(row.activo),
  fecha_creacion: row.fecha_creacion,
});

async function buscarCupon(columna, valor, connection = null) {
  const campo = columna === "id" ? "id" : "codigo";
  const db = connection || pool;
  const lockVal = connection ? 1 : 0;
  let rows;
  if (campo === "id") {
    const [res] = await db.query(`CALL sp_obtener_cupon_por_id(?, ?)`, [valor, lockVal]);
    rows = res[0] || [];
  } else {
    const [res] = await db.query(`CALL sp_obtener_cupon_por_codigo(?, ?)`, [valor, lockVal]);
    rows = res[0] || [];
  }
  return rows;
}

export async function validarCuponParaCompra(codigo, subtotal, connection = null) {
  if (!codigo || !String(codigo).trim()) {
    return { ok: false, message: "Código de cupón vacío." };
  }

  const codigoNorm = String(codigo).trim().toUpperCase();
  const rows = await buscarCupon("codigo", codigoNorm, connection);

  if (!rows.length) {
    return { ok: false, message: "Cupón no válido." };
  }

  return evaluarCupon(rows[0], subtotal);
}

export async function validarCuponPorId(id, subtotal, connection = null) {
  if (!id) {
    return { ok: false, message: "Cupón no válido." };
  }

  const rows = await buscarCupon("id", id, connection);
  if (!rows.length) {
    return { ok: false, message: "Cupón no válido." };
  }

  return evaluarCupon(rows[0], subtotal);
}

function evaluarCupon(cupon, subtotal) {
  if (!cupon.activo) {
    return { ok: false, message: "Este cupón está inactivo." };
  }

  const now = new Date();
  if (cupon.fecha_inicio && new Date(cupon.fecha_inicio) > now) {
    return { ok: false, message: "Este cupón aún no está vigente." };
  }
  if (cupon.fecha_fin && new Date(cupon.fecha_fin) < now) {
    return { ok: false, message: "Este cupón ha expirado." };
  }

  if (
    cupon.usos_maximos !== null &&
    cupon.usos_maximos !== undefined &&
    Number(cupon.usos_actuales) >= Number(cupon.usos_maximos)
  ) {
    return { ok: false, message: "Este cupón alcanzó el máximo de usos." };
  }

  const sub = Number(subtotal) || 0;
  if (sub < Number(cupon.minimo_compra || 0)) {
    return {
      ok: false,
      message: `Compra mínima de S/ ${Number(cupon.minimo_compra).toFixed(2)} requerida.`,
    };
  }

  const descuento = calcularDescuentoCupon(cupon, sub);
  return {
    ok: true,
    cupon: mapCupon(cupon),
    descuento,
    subtotalConDescuento: Math.round((sub - descuento) * 100) / 100,
  };
}

export const validarCuponPublico = catchAsyncErrors(async (req, res, next) => {
  const { codigo, subtotal } = req.body;
  const resultado = await validarCuponParaCompra(codigo, subtotal);
  if (!resultado.ok) {
    return next(new ErrorHandler(resultado.message, 400));
  }

  res.status(200).json({
    success: true,
    message: "Cupón válido.",
    ...resultado,
  });
});

export const listarCupones = catchAsyncErrors(async (req, res) => {
  const [resRows] = await pool.query(`CALL sp_listar_cupones()`);
  const rows = resRows[0] || [];
  res.status(200).json({
    success: true,
    cupones: rows.map(mapCupon),
  });
});

export const crearCupon = catchAsyncErrors(async (req, res, next) => {
  const {
    codigo,
    tipo,
    valor,
    minimo_compra = 0,
    usos_maximos,
    fecha_inicio,
    fecha_fin,
    activo = true,
  } = req.body;

  if (!codigo || !tipo || valor === undefined || valor === null || valor === "") {
    return next(new ErrorHandler("Código, tipo y valor son obligatorios.", 400));
  }
  if (!["porcentaje", "fijo"].includes(tipo)) {
    return next(new ErrorHandler("Tipo debe ser porcentaje o fijo.", 400));
  }

  const valorNum = Number(valor);
  if (!Number.isFinite(valorNum) || valorNum <= 0) {
    return next(new ErrorHandler("Valor de cupón inválido.", 400));
  }
  if (tipo === "porcentaje" && valorNum > 100) {
    return next(new ErrorHandler("El porcentaje no puede superar 100.", 400));
  }

  const codigoNorm = String(codigo).trim().toUpperCase();
  const id = crypto.randomUUID();

  let rows;
  try {
    const [resRows] = await pool.query(
      `CALL sp_crear_cupon(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        codigoNorm,
        tipo,
        valorNum,
        Number(minimo_compra) || 0,
        usos_maximos === "" || usos_maximos === undefined || usos_maximos === null
          ? null
          : Number(usos_maximos),
        fecha_inicio || null,
        fecha_fin || null,
        activo === false || activo === "0" || activo === 0 ? 0 : 1,
      ]
    );
    rows = resRows[0] || [];
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return next(new ErrorHandler("Ya existe un cupón con ese código.", 400));
    }
    throw err;
  }

  res.status(201).json({
    success: true,
    message: "Cupón creado correctamente.",
    cupon: mapCupon(rows[0]),
  });
});

export const actualizarCupon = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const {
    codigo,
    tipo,
    valor,
    minimo_compra,
    usos_maximos,
    fecha_inicio,
    fecha_fin,
    activo,
  } = req.body;

  const [existentes] = await pool.query(
    `SELECT * FROM cupones WHERE id = ? LIMIT 1`,
    [id]
  );
  if (!existentes.length) {
    return next(new ErrorHandler("Cupón no encontrado.", 404));
  }

  const actual = existentes[0];
  const codigoNorm = codigo
    ? String(codigo).trim().toUpperCase()
    : actual.codigo;
  const tipoFinal = tipo || actual.tipo;
  const valorNum =
    valor !== undefined && valor !== null && valor !== ""
      ? Number(valor)
      : Number(actual.valor);

  if (!["porcentaje", "fijo"].includes(tipoFinal)) {
    return next(new ErrorHandler("Tipo debe ser porcentaje o fijo.", 400));
  }
  if (!Number.isFinite(valorNum) || valorNum <= 0) {
    return next(new ErrorHandler("Valor de cupón inválido.", 400));
  }

  let rows;
  try {
    const [resRows] = await pool.query(
      `CALL sp_actualizar_cupon(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        codigoNorm,
        tipoFinal,
        valorNum,
        minimo_compra !== undefined
          ? Number(minimo_compra) || 0
          : actual.minimo_compra,
        usos_maximos === "" || usos_maximos === undefined
          ? actual.usos_maximos
          : usos_maximos === null
            ? null
            : Number(usos_maximos),
        fecha_inicio !== undefined ? fecha_inicio || null : actual.fecha_inicio,
        fecha_fin !== undefined ? fecha_fin || null : actual.fecha_fin,
        activo === undefined
          ? actual.activo
          : activo === false || activo === "0" || activo === 0
            ? 0
            : 1,
      ]
    );
    rows = resRows[0] || [];
  } catch (err) {
    if (err?.code === "ER_DUP_ENTRY") {
      return next(new ErrorHandler("Ya existe otro cupón con ese código.", 400));
    }
    throw err;
  }
  res.status(200).json({
    success: true,
    message: "Cupón actualizado.",
    cupon: mapCupon(rows[0]),
  });
});

export const eliminarCupon = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const [resExistentes] = await pool.query(`CALL sp_obtener_cupon_por_id(?, 0)`, [id]);
  const existentes = resExistentes[0] || [];
  if (!existentes.length) {
    return next(new ErrorHandler("Cupón no encontrado.", 404));
  }

  const [resUsos] = await pool.query(`CALL sp_contar_usos_cupon(?)`, [id]);
  const usos = resUsos[0] || [];
  if (Number(usos[0].total) > 0) {
    await pool.query(`CALL sp_actualizar_cupon(?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      existentes[0].id, existentes[0].codigo, existentes[0].tipo, existentes[0].valor,
      existentes[0].minimo_compra, existentes[0].usos_maximos, existentes[0].fecha_inicio,
      existentes[0].fecha_fin, 0
    ]);
    return res.status(200).json({
      success: true,
      message:
        "El cupón está usado en pedidos; se desactivó en lugar de eliminarlo.",
      softDeleted: true,
    });
  }

  await pool.query(`CALL sp_eliminar_cupon(?)`, [id]);
  res.status(200).json({
    success: true,
    message: "Cupón eliminado.",
  });
});
