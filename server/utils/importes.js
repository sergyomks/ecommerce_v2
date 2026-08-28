const TOLERANCIA_CENTIMOS = 1;

export const aCentimos = (valor) => Math.round(Number(valor) * 100);

export const importeCoincide = (montoCargo, precioTotal) => {
  const esperado = aCentimos(precioTotal);
  const recibido = Math.round(Number(montoCargo));

  if (!Number.isFinite(esperado) || !Number.isFinite(recibido)) return false;
  return Math.abs(esperado - recibido) <= TOLERANCIA_CENTIMOS;
};
