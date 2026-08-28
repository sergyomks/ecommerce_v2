const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

export const comoLista = (campo) => {
  if (!campo) return [];
  return Array.isArray(campo) ? campo : [campo];
};

export const validarImagenes = (imagenes) => {
  for (const imagen of imagenes) {
    if (!TIPOS_PERMITIDOS.includes(imagen.mimetype)) {
      return `Formato no permitido en "${imagen.name}". Usa JPG, PNG, WEBP o AVIF.`;
    }
    if (imagen.size > TAMANO_MAXIMO_BYTES) {
      return `La imagen "${imagen.name}" supera el máximo de 5 MB.`;
    }
  }
  return null;
};
