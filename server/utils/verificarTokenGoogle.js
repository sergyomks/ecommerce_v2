import { OAuth2Client } from "google-auth-library";

let cliente = null;

const obtenerCliente = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "Acceso con Google no configurado: falta GOOGLE_CLIENT_ID en config.env."
    );
  }
  if (!cliente) cliente = new OAuth2Client(clientId);
  return cliente;
};

export async function verificarTokenGoogle(credential) {
  if (!credential || typeof credential !== "string") {
    return { ok: false, motivo: "Falta el token de Google." };
  }

  let payload;
  try {
    const ticket = await obtenerCliente().verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (error) {
    return {
      ok: false,
      motivo: "El token de Google no es válido o ya caducó.",
      detalle: error?.message,
    };
  }

  if (!payload?.sub || !payload?.email) {
    return { ok: false, motivo: "Google no devolvió un perfil utilizable." };
  }

  return {
    ok: true,
    perfil: {
      googleId: String(payload.sub),
      email: String(payload.email).trim().toLowerCase(),
      emailVerificado: payload.email_verified === true,
      nombre: (payload.name || payload.given_name || "").trim(),
      foto: payload.picture || null,
    },
  };
}

export const googleDisponible = () =>
  Boolean((process.env.GOOGLE_CLIENT_ID || "").trim());
