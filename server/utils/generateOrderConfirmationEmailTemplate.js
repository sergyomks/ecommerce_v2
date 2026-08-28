import { escaparHtml, urlSegura } from "./escaparHtml.js";

const formatMoney = (value) => {
  const num = Number(value) || 0;
  return `S/ ${num.toFixed(2)}`;
};

export const generateOrderConfirmationEmailTemplate = (data) => {
  const {
    nombreUsuario,
    pedidoId,
    chargeId,
    items = [],
    impuesto,
    precioEnvio,
    precioTotal,
    ordersUrl,
  } = data;

  const itemsRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #333; color: #ccc;">${escaparHtml(item.titulo)}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #333; color: #ccc; text-align: center;">${escaparHtml(item.cantidad)}</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #333; color: #fff; text-align: right;">${formatMoney(item.precio * item.cantidad)}</td>
      </tr>`
    )
    .join("");

  const shortId = escaparHtml(pedidoId?.slice(0, 8) || "—");
  const enlacePedidos = urlSegura(ordersUrl);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #000; color: #fff;">
      <h2 style="color: #fff; text-align: center;">Pago confirmado</h2>
      <p style="font-size: 16px; color: #ccc;">Hola ${escaparHtml(nombreUsuario || "cliente")},</p>
      <p style="font-size: 16px; color: #ccc;">
        Recibimos tu pago correctamente. Tu pedido <strong style="color:#fff;">#${shortId}</strong> ya está en proceso.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr>
            <th style="padding: 10px 8px; border-bottom: 1px solid #555; text-align: left; color: #fff;">Producto</th>
            <th style="padding: 10px 8px; border-bottom: 1px solid #555; text-align: center; color: #fff;">Cant.</th>
            <th style="padding: 10px 8px; border-bottom: 1px solid #555; text-align: right; color: #fff;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div style="margin: 16px 0; padding: 12px; border: 1px solid #333; border-radius: 6px;">
        <p style="margin: 6px 0; color: #ccc;">IGV (incluido): <span style="float:right; color:#fff;">${formatMoney(impuesto)}</span></p>
        <p style="margin: 6px 0; color: #ccc;">Envío: <span style="float:right; color:#fff;">${formatMoney(precioEnvio)}</span></p>
        <p style="margin: 10px 0 0; font-size: 18px; color: #fff; clear: both;">
          Total pagado: <span style="float:right;">${formatMoney(precioTotal)}</span>
        </p>
      </div>

      ${
        chargeId
          ? `<p style="font-size: 13px; color: #888;">Referencia de pago Culqi: ${escaparHtml(chargeId)}</p>`
          : ""
      }
      <p style="font-size: 13px; color: #888;">ID de pedido: ${escaparHtml(pedidoId)}</p>

      ${
        enlacePedidos
          ? `<div style="text-align: center; margin: 24px 0;">
              <a href="${enlacePedidos}"
                 style="display: inline-block; font-size: 16px; font-weight: bold; color: #000; text-decoration: none; padding: 12px 20px; border: 1px solid #fff; border-radius: 5px; background-color: #fff;">
                Ver mis pedidos
              </a>
            </div>`
          : ""
      }

      <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #666;">
        <p>Gracias por tu compra,<br>SYSTEC STORE</p>
        <p style="font-size: 12px; color: #444;">Este es un mensaje automático. Por favor, no responda a este correo electrónico.</p>
      </footer>
    </div>
  `;
};
