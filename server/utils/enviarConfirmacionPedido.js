import pool from "../database/db.js";
import { sendEmail } from "./sendEmail.js";
import { generateOrderConfirmationEmailTemplate } from "./generateOrderConfirmationEmailTemplate.js";
import { formatearTelefonoWhatsApp } from "./validaciones.js";

export const enviarConfirmacionPedido = async (
  pedidoId,
  chargeId,
  emailAlternativo = null
) => {
  try {
    const [pedidos] = await pool.query(
      `SELECT p.precio_total, p.impuesto, p.precio_envio,
              u.nombre, u.email,
              (u.google_id IS NOT NULL) AS tiene_google,
              ie.telefono
       FROM pedidos p
       LEFT JOIN usuarios u ON u.id = p.id_comprador
       LEFT JOIN informacion_envio ie ON ie.id_pedido = p.id
       WHERE p.id = ? LIMIT 1`,
      [pedidoId]
    );

    if (pedidos.length === 0) return;

    const pedido = pedidos[0];
    const esUsuarioGoogle = Number(pedido.tiene_google) === 1;
    const destinatario = pedido.email || emailAlternativo;

    const [items] = await pool.query(
      `SELECT titulo, cantidad, precio FROM detalles_pedido WHERE id_pedido = ?`,
      [pedidoId]
    );

    if (esUsuarioGoogle) {
      if (!destinatario) return;

      const template = generateOrderConfirmationEmailTemplate({
        nombreUsuario: pedido.nombre || "cliente",
        pedidoId,
        chargeId,
        items,
        impuesto: pedido.impuesto,
        precioEnvio: pedido.precio_envio,
        precioTotal: pedido.precio_total,
        ordersUrl: process.env.FRONTEND_URL
          ? `${process.env.FRONTEND_URL}/orders`
          : undefined,
      });

      await sendEmail({
        email: destinatario,
        subject: `Pago confirmado — Pedido #${pedidoId.slice(0, 8)}`,
        message: template.html,
        textoPlano: template.text,
      });
      console.log(`📧 Email de pago confirmado enviado a: ${destinatario}`);
    } else {
      const telefonoWsp = formatearTelefonoWhatsApp(pedido.telefono);
      console.log(
        `📱 [WhatsApp pendiente] Pago confirmado para usuario normal. ` +
        `Teléfono formateado: ${telefonoWsp || "inválido"}`
      );
    }
  } catch (error) {
    console.error(
      `Pago OK pero falló el email de confirmación del pedido ${pedidoId}:`,
      error?.message || error
    );
  }
};
