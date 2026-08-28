export const IGV_RATE = 0.18;

export function extraerIgv(montoConIgv) {
  const gross = Math.max(Number(montoConIgv) || 0, 0);
  const impuesto =
    Math.round(((gross * IGV_RATE) / (1 + IGV_RATE)) * 100) / 100;
  const base = Math.round((gross - impuesto) * 100) / 100;
  return {
    base,
    impuesto,
    gross: Math.round(gross * 100) / 100,
  };
}
