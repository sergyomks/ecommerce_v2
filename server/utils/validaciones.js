const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NOMBRE_REGEX = /^[\p{L}][\p{L}\s'’.-]*$/u;

const SOLO_DIGITOS = /^\d+$/;

export const esUuid = (valor) =>
  typeof valor === "string" && UUID_REGEX.test(valor);

export const esEmail = (valor) =>
  typeof valor === "string" && EMAIL_REGEX.test(valor.trim());

export const esNombrePersona = (valor, { min = 3, max = 100 } = {}) => {
  if (typeof valor !== "string") return false;
  const limpio = valor.trim().replace(/\s+/g, " ");
  if (limpio.length < min || limpio.length > max) return false;
  return NOMBRE_REGEX.test(limpio);
};

const nucleoTelefono = (valor) => {
  const digitos = String(valor ?? "").replace(/[\s()+.-]/g, "");
  if (!SOLO_DIGITOS.test(digitos) || digitos === "") return "";
  const sinPais =
    digitos.startsWith("51") && digitos.length > 9 ? digitos.slice(2) : digitos;
  return sinPais.startsWith("0") ? sinPais.slice(1) : sinPais;
};

export const esTelefono = (valor) => {
  if (typeof valor !== "string") return false;
  const nucleo = nucleoTelefono(valor);
  if (nucleo.length === 9) return nucleo.startsWith("9");
  return nucleo.length === 7 || nucleo.length === 8;
};

export const normalizarTelefono = (valor) => nucleoTelefono(valor);

export const esCodigoPostal = (valor) =>
  typeof valor === "string" && /^\d{5}$/.test(valor.trim());

export const esEnteroNoNegativo = (valor, { max = Number.MAX_SAFE_INTEGER } = {}) => {
  const texto = String(valor ?? "").trim();
  if (!SOLO_DIGITOS.test(texto)) return false;
  const n = Number(texto);
  return Number.isSafeInteger(n) && n >= 0 && n <= max;
};

export const esImporte = (valor, { max = 999999.99 } = {}) => {
  const texto = String(valor ?? "").trim();
  if (!/^\d+([.,]\d{1,2})?$/.test(texto)) return false;
  const n = Number(texto.replace(",", "."));
  return Number.isFinite(n) && n >= 0 && n <= max;
};

export const esTextoConLongitud = (valor, { min = 1, max = 255 } = {}) => {
  if (typeof valor !== "string") return false;
  const limpio = valor.trim();
  return limpio.length >= min && limpio.length <= max;
};

export const primerError = (reglas) => {
  for (const [valor, comprobacion, mensaje] of reglas) {
    if (!comprobacion(valor)) return mensaje;
  }
  return null;
};
