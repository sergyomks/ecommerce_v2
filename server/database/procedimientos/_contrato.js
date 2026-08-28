import pool from "../db.js";

export const filas = (res, i = 0) => (Array.isArray(res) ? res[i] : null) ?? [];

export const fila = (res, i = 0) => filas(res, i)[0] ?? null;

export const escrito = (res) => {
  if (!Array.isArray(res)) return Number(res?.affectedRows ?? 0);
  const primera = fila(res);
  if (primera && "affected" in primera) return Number(primera.affected);
  const cabecera = res[res.length - 1];
  return Number(cabecera?.affectedRows ?? 0);
};

export async function sp(db, nombre, params = []) {
  const marcas = params.map(() => "?").join(", ");
  const [res] = await (db || pool).query(`CALL ${nombre}(${marcas})`, params);
  return res;
}
