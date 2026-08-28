import { escaparHtml, urlSegura } from "./escaparHtml.js";

export const generateEmailTemplate = (resetPasswordUrl) =>{
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #000; color: #fff;">
          <h2 style="color: #fff; text-align: center;">Restablecer su contraseña</h2>
          <p style="font-size: 16px; color: #ccc;">Estimado usuario,</p>
          <p style="font-size: 16px; color: #ccc;">Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo para continuar:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetPasswordUrl}"
               style="display: inline-block; font-size: 16px; font-weight: bold; color: #000; text-decoration: none; padding: 12px 20px; border: 1px solid #fff; border-radius: 5px; background-color: #fff;">
              Restablecer contraseña
            </a>
          </div>
          <p style="font-size: 16px; color: #ccc;">Si no solicitaste esto, ignora este correo electrónico. El enlace caducará en 15 minutos.</p>
          <p style="font-size: 16px; color: #ccc;">Si el botón de arriba no funciona, copie y pegue la siguiente URL en su navegador:</p>
          <p style="font-size: 16px; color: #fff; word-wrap: break-word;">${resetPasswordUrl}</p>
          <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #666;">
            <p>Gracias,<br>Ecommerce </p>
            <p style="font-size: 12px; color: #444;">Este es un mensaje automático. Por favor, no responda a este correo electrónico.</p>
          </footer>
        </div>
      `
}

export const generateGoogleAccountEmailTemplate = ({ nombreUsuario, loginUrl }) => {
  const enlace = urlSegura(loginUrl);

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#121722;">
    <h2 style="margin:0 0 16px;font-size:22px;">Tu cuenta entra con Google</h2>

    <p style="margin:0 0 12px;line-height:1.6;">
      Hola ${escaparHtml(nombreUsuario || "")}, pediste restablecer tu contraseña,
      pero esta cuenta no tiene ninguna: la creaste con Google.
    </p>

    <p style="margin:0 0 20px;line-height:1.6;">
      Usa el botón <strong>Continuar con Google</strong> en la pantalla de acceso
      y entrarás directamente.
    </p>

    ${
      enlace
        ? `<p style="margin:0 0 20px;">
             <a href="${enlace}" style="display:inline-block;background:#1d4e89;color:#ffffff;
                text-decoration:none;padding:12px 22px;border-radius:5px;font-weight:bold;">
               Ir a iniciar sesión
             </a>
           </p>`
        : ""
    }

    <p style="margin:0;color:#5a6478;font-size:13px;line-height:1.6;">
      Si no fuiste tú quien lo pidió, puedes ignorar este mensaje: no se cambió nada.
    </p>
  </div>`;
};
