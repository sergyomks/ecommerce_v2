import axios from "axios";
import pool from "../database/db.js";
import crypto from "crypto";
import { aCentimos } from "./importes.js";

const CULQI_API_URL = "https://api.culqi.com/v2/charges";
const TIEMPO_MAXIMO_MS = 25000;
const MONTO_MINIMO_CENTIMOS = Number(process.env.CULQI_MONTO_MINIMO_CENTIMOS) || 300;

const registrarIntento = async (orderId, chargeId, estado) => {
  try {
    await pool.query(
      `INSERT INTO pagos (id, id_pedido, tipo_pago, estado_pago, id_intento_pago)
       VALUES (?, ?, 'Online', ?, ?)`,
      [crypto.randomUUID(), orderId, estado, chargeId]
    );
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") return;
    console.error(
      `No se pudo registrar el intento de pago ${chargeId} del pedido ${orderId}:`,
      error?.message || error
    );
  }
};

export async function generarCargoCulqi({
  orderId,
  totalPrice,
  tokenId,
  email,
  antifraudDetails,
  authentication3DS,
}) {
  const CULQI_SECRET_KEY = process.env.CULQI_SECRET_KEY;

  if (!CULQI_SECRET_KEY) {
    return {
      success: false,
      indeterminado: false,
      message: "Configuración del comercio: falta la llave secreta de Culqi.",
    };
  }

  const amount = aCentimos(totalPrice);

  if (!Number.isFinite(amount) || amount < MONTO_MINIMO_CENTIMOS) {
    return {
      success: false,
      indeterminado: false,
      message: `El importe mínimo para pagar con tarjeta es S/ ${(MONTO_MINIMO_CENTIMOS / 100).toFixed(2)}.`,
    };
  }

  const chargeBody = {
    amount,
    currency_code: "PEN",
    email: String(email || "").trim().toLowerCase(),
    source_id: String(tokenId || "").trim(),
    description: `Pedido ${orderId.slice(0, 8)}`,
    metadata: { order_id: orderId },
  };

  if (antifraudDetails && Object.keys(antifraudDetails).length > 0) {
    chargeBody.antifraud_details = antifraudDetails;
  }

  if (authentication3DS && Object.keys(authentication3DS).length > 0) {
    chargeBody.authentication_3DS = authentication3DS;
  }

  let cargo;

  try {
    const response = await axios.post(CULQI_API_URL, chargeBody, {
      headers: {
        Authorization: `Bearer ${CULQI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: TIEMPO_MAXIMO_MS,
    });
    cargo = response.data;
  } catch (error) {
    const culqiError = error.response?.data;
    const chargeIdFallido = culqiError?.charge_id || null;

    if (chargeIdFallido) {
      await registrarIntento(orderId, chargeIdFallido, "Fallido");
    }

    if (!error.response) {
      console.error(
        `Resultado indeterminado al cobrar el pedido ${orderId}: ${error.message}. ` +
          `El cargo puede haberse realizado; se espera al webhook de Culqi.`
      );
      return {
        success: false,
        indeterminado: true,
        message: "No se pudo confirmar el resultado del pago con Culqi.",
      };
    }

    if (culqiError?.decline_code || culqiError?.code) {
      console.warn(
        `Cargo rechazado para el pedido ${orderId}: ` +
          `${culqiError.decline_code || culqiError.code} (${culqiError.merchant_message || "sin detalle"})`
      );
    }

    return {
      success: false,
      indeterminado: false,
      chargeId: chargeIdFallido,
      declineCode: culqiError?.decline_code || culqiError?.code || null,
      message:
        culqiError?.type === "api_error"
          ? "Culqi no pudo crear el cargo. Contacta a culqi.com/soporte."
          : culqiError?.user_message || "El pago no pudo ser procesado.",
    };
  }

  await registrarIntento(orderId, cargo.id, "Pagado");

  return {
    success: true,
    indeterminado: false,
    chargeId: cargo.id,
    fraudScore: cargo.fraud_score ?? null,
  };
}
