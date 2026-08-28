

export function leerPrecio(producto) {
  const precio = Number(producto?.precio ?? 0);
  const efectivo = Number(producto?.precio_efectivo ?? precio);

  const enOferta =
    Boolean(producto?.en_oferta) &&
    Number.isFinite(efectivo) &&
    Number.isFinite(precio) &&
    efectivo < precio;

  return {

    actual: enOferta ? efectivo : precio,

    anterior: enOferta ? precio : null,
    enOferta,

    porcentaje: enOferta ? Math.round((1 - efectivo / precio) * 100) : 0,
  };
}

export const formatearSoles = (valor) =>
  `S/. ${Number(valor || 0).toFixed(2)}`;

export const precioLinea = (item) => leerPrecio(item?.producto).actual;

export const etiquetaVariante = (variante) => {
  if (!variante) return "";
  const partes = [variante.talla, variante.color].filter(
    (p) => p && p !== "Única" && p !== "Único"
  );
  return partes.join(" · ");
};
