import { escaparHtml, urlSegura } from "./escaparHtml.js";

export const generateWelcomeEmailTemplate = ({ nombreUsuario, tiendaUrl }) => {
  const enlace = urlSegura(tiendaUrl);

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#121722;">
    <h2 style="margin:0 0 16px;font-size:22px;">Tu cuenta ya está lista</h2>

    <p style="margin:0 0 12px;line-height:1.6;">
      Hola ${escaparHtml(nombreUsuario || "")}, gracias por registrarte. Desde tu
      cuenta puedes seguir tus pedidos, guardar prendas en tu lista de deseos y
      pagar más rápido la próxima vez.
    </p>

    ${
      enlace
        ? `<p style="margin:0 0 20px;">
             <a href="${enlace}" style="display:inline-block;background:#1d4e89;color:#ffffff;
                text-decoration:none;padding:12px 22px;border-radius:5px;font-weight:bold;">
               Ir a la tienda
             </a>
           </p>`
        : ""
    }

    <p style="margin:0;color:#5a6478;font-size:13px;line-height:1.6;">
      Si no creaste esta cuenta, escríbenos respondiendo desde la tienda y la damos de baja.
    </p>
  </div>`;
};
