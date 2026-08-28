import pool from "../database/db.js";

export function getEnvioConfig() {
  return {
    umbral_gratis: Number(process.env.ENVIO_UMBRAL_GRATIS) || 50,
    precio_default: Number(process.env.ENVIO_PRECIO_DEFAULT) || 2,
  };
}

export async function calcularPrecioEnvio({ departamento, subtotal }, connection = null) {
  const db = connection || pool;
  const { umbral_gratis, precio_default } = getEnvioConfig();
  const sub = Number(subtotal) || 0;

  if (sub >= umbral_gratis) {
    return {
      precio: 0,
      gratis: true,
      umbral_gratis,
      precio_base: 0,
      departamento: departamento || null,
    };
  }

  let precio = precio_default;
  let fuente = "default";

  if (departamento && String(departamento).trim()) {
    const [rows] = await db.query(
      `SELECT t.precio FROM tarifas_envio t
       INNER JOIN departamentos d ON d.id = t.id_departamento
       WHERE (LOWER(d.nombre) = LOWER(? COLLATE utf8mb4_spanish2_ci) OR t.id_departamento = ?) AND t.activo = 1
       LIMIT 1`,
      [String(departamento).trim(), Number(departamento) || 0]
    );
    if (rows.length > 0) {
      precio = Number(rows[0].precio);
      fuente = "tarifa";
    }
  }

  return {
    precio: Math.round(precio * 100) / 100,
    gratis: false,
    umbral_gratis,
    precio_base: Math.round(precio * 100) / 100,
    fuente,
    departamento: departamento || null,
  };
}
