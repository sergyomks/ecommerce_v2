export const calcularDescuentoCupon = (cupon, subtotal) => {
  const sub = Number(subtotal) || 0;

  const bruto =
    cupon.tipo === "porcentaje"
      ? sub * (Number(cupon.valor) / 100)
      : Number(cupon.valor);

  const descuento = Math.round(bruto * 100) / 100;

  return descuento > sub ? sub : descuento;
};
