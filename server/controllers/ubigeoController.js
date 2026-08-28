import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import pool from "../database/db.js";

export const listarDepartamentos = catchAsyncErrors(async (req, res) => {
  const [result] = await pool.query(`CALL sp_listar_departamentos()`);
  res.status(200).json({ success: true, departamentos: result[0] || [] });
});

export const listarProvinciasPorDepartamento = catchAsyncErrors(async (req, res) => {
  const { departamentoId } = req.params;
  const [result] = await pool.query(
    `CALL sp_listar_provincias_por_departamento(?)`,
    [departamentoId]
  );
  res.status(200).json({ success: true, provincias: result[0] || [] });
});

export const listarDistritosPorProvincia = catchAsyncErrors(async (req, res) => {
  const { provinciaId } = req.params;
  const [result] = await pool.query(
    `CALL sp_listar_distritos_por_provincia(?)`,
    [provinciaId]
  );
  res.status(200).json({ success: true, distritos: result[0] || [] });
});
