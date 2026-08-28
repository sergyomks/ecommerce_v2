import axios from "axios";
import crypto from "crypto";

const CULQI_API_BASE = "https://api.culqi.com/v2";

export function verificarSecretoWebhook(req) {
  const esperado = process.env.CULQI_WEBHOOK_SECRET;

  if (!esperado || !esperado.trim()) {
    return {
      ok: false,
      status: 503,
      message: "Webhook no configurado: falta CULQI_WEBHOOK_SECRET.",
    };
  }

  const recibido =
    req.query?.secret ||
    req.headers["x-culqi-webhook-secret"] ||
    req.headers["x-webhook-secret"];

  if (!recibido || typeof recibido !== "string") {
    return { ok: false, status: 401, message: "Secreto de webhook ausente." };
  }

  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, status: 401, message: "Secreto de webhook inválido." };
  }

  return { ok: true, omitido: false };
}

function authHeaders() {
  const secretKey = process.env.CULQI_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Falta CULQI_SECRET_KEY en variables de entorno.");
  }
  return {
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };
}

export async function obtenerCargoCulqi(chargeId) {
  const response = await axios.get(`${CULQI_API_BASE}/charges/${chargeId}`, {
    headers: authHeaders(),
    validateStatus: () => true,
  });

  if (response.status === 200 && response.data?.id === chargeId) {
    return { ok: true, cargo: response.data };
  }

  return {
    ok: false,
    status: 401,
    message: "Cargo Culqi no verificado.",
    detalle: response.data,
  };
}

export async function obtenerEventoCulqi(eventId) {
  if (!eventId || typeof eventId !== "string") {
    return { ok: false, omitido: true };
  }

  const response = await axios.get(`${CULQI_API_BASE}/events/${eventId}`, {
    headers: authHeaders(),
    validateStatus: () => true,
  });

  if (response.status === 200 && response.data?.id === eventId) {
    return { ok: true, evento: response.data };
  }

  return {
    ok: false,
    status: response.status,
    message: "Evento Culqi no encontrado o no verificable.",
    detalle: response.data,
  };
}

export async function verificarPayloadWebhookCulqi(req) {
  const secreto = verificarSecretoWebhook(req);
  if (!secreto.ok) {
    return secreto;
  }

  const body = req.body || {};
  const tipo = body.type;
  const chargeId = body.data?.id;
  const eventId = body.id;

  if (!tipo || typeof tipo !== "string") {
    return { ok: false, status: 400, message: "Evento sin type." };
  }

  if (!chargeId || typeof chargeId !== "string") {
    return { ok: false, status: 400, message: "Evento sin data.id (cargo)." };
  }

  const cargoResult = await obtenerCargoCulqi(chargeId);
  if (!cargoResult.ok) {
    return cargoResult;
  }

  let eventoCulqi = null;
  if (eventId) {
    const eventoResult = await obtenerEventoCulqi(eventId);
    if (eventoResult.ok) {
      eventoCulqi = eventoResult.evento;

      const cargoEnEvento = eventoResult.evento?.data?.id;
      if (cargoEnEvento && cargoEnEvento !== chargeId) {
        return {
          ok: false,
          status: 401,
          message: "El evento Culqi no coincide con el cargo del payload.",
        };
      }
    } else if (!eventoResult.omitido) {

      console.warn(
        "Webhook Culqi: no se pudo reconsultar el evento",
        eventId,
        eventoResult.message
      );
    }
  }

  return {
    ok: true,
    tipo,
    chargeId,
    eventId: eventId || `charge:${chargeId}:${tipo}`,
    cargo: cargoResult.cargo,
    eventoCulqi,
  };
}
