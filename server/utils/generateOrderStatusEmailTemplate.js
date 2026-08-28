import { escaparHtml, urlSegura } from "./escaparHtml.js";

const MENSAJES_POR_ESTADO = {
  Enviado:
    "Tu pedido ya fue enviado. Pronto llegará a la dirección de entrega registrada.",
  Entregado:
    "Tu pedido fue marcado como entregado. ¡Esperamos que disfrutes tu compra!",
  Cancelado:
    "Tu pedido fue cancelado. Si crees que es un error, contáctanos respondiendo desde la tienda.",
};

export const generateOrderStatusEmailTemplate = (data) => {
  const {
    nombreUsuario,
    pedidoId,
    estadoAnterior,
    estadoNuevo,
    ordersUrl,
  } = data;

  const shortId = escaparHtml(pedidoId?.slice(0, 8) || "—");
  const estadoNuevoSeguro = escaparHtml(estadoNuevo);
  const estadoAnteriorSeguro = escaparHtml(estadoAnterior);

  const detalle =
    MENSAJES_POR_ESTADO[estadoNuevo] ||
    `El estado de tu pedido cambió de ${estadoAnteriorSeguro} a ${estadoNuevoSeguro}.`;

  const enlacePedidos = urlSegura(ordersUrl);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #000; color: #fff;">
      <h2 style="color: #fff; text-align: center;">Actualización de pedido</h2>
      <p style="font-size: 16px; color: #ccc;">Hola ${escaparHtml(nombreUsuario || "cliente")},</p>
      <p style="font-size: 16px; color: #ccc;">
        Tu pedido <strong style="color:#fff;">#${shortId}</strong> ahora está en estado
        <strong style="color:#fff;">${estadoNuevoSeguro}</strong>.
      </p>
      <p style="font-size: 16px; color: #ccc;">${detalle}</p>
      <p style="font-size: 13px; color: #888;">Estado anterior: ${estadoAnteriorSeguro}</p>
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
        <p>Gracias,<br>SYSTEC STORE</p>
        <p style="font-size: 12px; color: #444;">Este es un mensaje automático. Por favor, no responda a este correo electrónico.</p>
      </footer>
    </div>
  `;
};
