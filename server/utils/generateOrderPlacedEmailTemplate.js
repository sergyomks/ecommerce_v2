import { escaparHtml, urlSegura } from "./escaparHtml.js";

export const generateOrderPlacedEmailTemplate = (data) => {
  const {
    nombreUsuario,
    pedidoId,
    items = [],
    precioTotal,
    minutosExpiracion,
    ordersUrl,
  } = data;

  const shortId = escaparHtml(pedidoId?.slice(0, 8) || "—");
  const enlacePedidos = urlSegura(ordersUrl);

  const filas = items
    .map((item) => {
      const variante = [item.talla, item.color]
        .filter((v) => v && v !== "Única" && v !== "Único")
        .join(" · ");

      return `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eceff4;">
            ${escaparHtml(item.titulo || "Producto")}
            ${variante ? `<br><span style="color:#5a6478;font-size:13px;">${escaparHtml(variante)}</span>` : ""}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eceff4;text-align:center;">
            ${escaparHtml(String(item.cantidad ?? 1))}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eceff4;text-align:right;">
            S/ ${escaparHtml(Number(item.precio || 0).toFixed(2))}
          </td>
        </tr>`;
    })
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#121722;">
    <h2 style="margin:0 0 16px;font-size:22px;">Recibimos tu pedido</h2>

    <p style="margin:0 0 12px;line-height:1.6;">
      Hola ${escaparHtml(nombreUsuario || "cliente")}, ya registramos tu pedido
      <strong>#${shortId}</strong>. Todavía no está pagado.
    </p>

    ${
      minutosExpiracion
        ? `<p style="margin:0 0 20px;padding:12px 16px;background:#fbf2e2;border-left:3px solid #8a5300;line-height:1.6;">
             Guardamos las prendas durante <strong>${escaparHtml(String(minutosExpiracion))} minutos</strong>.
             Si no completas el pago en ese plazo, el pedido se cancela y las devolvemos al catálogo.
           </p>`
        : ""
    }

    <table style="width:100%;border-collapse:collapse;margin:0 0 16px;font-size:14px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 0;border-bottom:2px solid #121722;">Prenda</th>
          <th style="text-align:center;padding:8px 0;border-bottom:2px solid #121722;">Cant.</th>
          <th style="text-align:right;padding:8px 0;border-bottom:2px solid #121722;">Precio</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>

    <p style="margin:0 0 20px;font-size:18px;text-align:right;">
      Total: <strong>S/ ${escaparHtml(Number(precioTotal || 0).toFixed(2))}</strong>
    </p>

    ${
      enlacePedidos
        ? `<p style="margin:0 0 20px;">
             <a href="${enlacePedidos}" style="display:inline-block;background:#1d4e89;color:#ffffff;
                text-decoration:none;padding:12px 22px;border-radius:5px;font-weight:bold;">
               Completar el pago
             </a>
           </p>`
        : ""
    }

    <p style="margin:0;color:#5a6478;font-size:13px;line-height:1.6;">
      Si no fuiste tú quien hizo este pedido, puedes ignorar este mensaje: sin pago,
      se cancela solo.
    </p>
  </div>`;
};
