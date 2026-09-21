import nodemailer from "nodemailer";

const htmlATextoPlano = (html) => {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, " | ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export const sendEmail = async ({ email, subject, message, textoPlano }) => {
  const usuario = process.env.SMTP_MAIL || process.env.SMTP_EMAIL;
  const clave = process.env.SMTP_PASSWORD;

  if (!usuario || !clave) {
    throw new Error(
      "Correo no configurado: faltan SMTP_MAIL o SMTP_PASSWORD en config.env."
    );
  }
  if (!email) {
    throw new Error("sendEmail necesita un destinatario.");
  }

  const servicio = (process.env.SMTP_SERVICE || "").trim();
  const puerto = Number(process.env.SMTP_PORT) || 465;

  const transporter = nodemailer.createTransport(
    servicio
      ? { service: servicio, auth: { user: usuario, pass: clave } }
      : {
          host: process.env.SMTP_HOST,
          port: puerto,
          secure: puerto === 465,
          auth: { user: usuario, pass: clave },
        }
  );

  const nombreTienda = process.env.STORE_NAME?.trim() || "Tienda";
  const from = `"${nombreTienda}" <${usuario}>`;
  const replyTo = process.env.STORE_EMAIL || usuario;
  const unsubscribeUrl = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL}/unsubscribe`
    : `mailto:${usuario}?subject=unsubscribe`;

  const textVersion = textoPlano || htmlATextoPlano(message);

  const mailOptions = {
    from,
    to: email,
    replyTo,
    subject,
    html: message,
    text: textVersion,
    headers: {
      "X-Mailer": `${nombreTienda} Mailer`,
      "X-Priority": "3",
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
    envelope: {
      from: usuario,
      to: email,
    },
  };

  await transporter.sendMail(mailOptions);
};
