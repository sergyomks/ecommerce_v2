import pool from "../database/db.js";
import { sendEmail } from "./sendEmail.js";
import { generateOrderConfirmationEmailTemplate } from "./generateOrderConfirmationEmailTemplate.js";

export const enviarConfirmacionPedido = async (
  pedidoId,
  chargeId,
  emailAlternativo = null
) => {
  try {
    const [pedidos] = await pool.query(
      `SELECT p.precio_total, p.impuesto, p.precio_envio, u.nombre, u.email
       FROM pedidos p
       LEFT JOIN usuarios u ON u.id = p.id_comprador
       WHERE p.id = ? LIMIT 1`,
      [pedidoId]
    );

    if (pedidos.length === 0) return;

    const pedido = pedidos[0];
    const destinatario = pedido.email || emailAlternativo;
    if (!destinatario) return;

    const [items] = await pool.query(
      `SELECT titulo, cantidad, precio FROM detalles_pedido WHERE id_pedido = ?`,
      [pedidoId]
    );

    await sendEmail({
      email: destinatario,
      subject: `Pago confirmado — Pedido #${pedidoId.slice(0, 8)}`,
      message: generateOrderConfirmationEmailTemplate({
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
      }),
    });
  } catch (error) {
    console.error(
      `Pago OK pero falló el email de confirmación del pedido ${pedidoId}:`,
      error?.message || error
    );
  }
};
