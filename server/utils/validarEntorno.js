const OBLIGATORIAS = [
  "JWT_SECRET_KEY",
  "DB_NAME",
  "FRONTEND_URL",
  "CULQI_PUBLIC_KEY",
  "CULQI_SECRET_KEY",
  "CULQI_WEBHOOK_SECRET",
  "CLOUDINARY_CLIENT_NAME",
  "CLOUDINARY_CLIENT_API",
  "CLOUDINARY_CLIENT_SECRET",
];

const LONGITUD_MINIMA_JWT = 32;

const definida = (nombre) => Boolean(String(process.env[nombre] || "").trim());

const avisosDeProduccion = () => {
  const avisos = [];

  if (process.env.NODE_ENV !== "production") return avisos;

  if (process.env.COOKIE_SECURE !== "true") {
    avisos.push("COOKIE_SECURE debería ser true en producción (HTTPS).");
  }
  if (process.env.CULQI_SECRET_KEY?.startsWith("sk_test")) {
    avisos.push("CULQI_SECRET_KEY es de pruebas (sk_test) en un entorno de producción.");
  }
  if (process.env.CULQI_PUBLIC_KEY?.startsWith("pk_test")) {
    avisos.push("CULQI_PUBLIC_KEY es de pruebas (pk_test) en un entorno de producción.");
  }

  return avisos;
};

const entornoDeLlavesCulqi = () => {
  const publica = process.env.CULQI_PUBLIC_KEY || "";
  const secreta = process.env.CULQI_SECRET_KEY || "";
  const entornoPublica = publica.startsWith("pk_live") ? "live" : "test";
  const entornoSecreta = secreta.startsWith("sk_live") ? "live" : "test";
  return entornoPublica === entornoSecreta ? null : { entornoPublica, entornoSecreta };
};

export const validarEntorno = () => {
  const faltantes = OBLIGATORIAS.filter((nombre) => !definida(nombre));

  if (faltantes.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${faltantes.join(", ")}. ` +
        `Revisa server/config/config.env (ver config.env.example).`
    );
  }

  const mezcla = entornoDeLlavesCulqi();
  if (mezcla) {
    throw new Error(
      `Las llaves de Culqi son de entornos distintos: pública=${mezcla.entornoPublica}, ` +
        `secreta=${mezcla.entornoSecreta}. Usa ambas de test o ambas de producción.`
    );
  }

  const avisos = avisosDeProduccion();

  if (process.env.JWT_SECRET_KEY.length < LONGITUD_MINIMA_JWT) {
    avisos.push(
      `JWT_SECRET_KEY tiene ${process.env.JWT_SECRET_KEY.length} caracteres; ` +
        `usa al menos ${LONGITUD_MINIMA_JWT} (openssl rand -base64 48).`
    );
  }

  for (const aviso of avisos) {
    console.warn(`AVISO DE CONFIGURACION: ${aviso}`);
  }
};
