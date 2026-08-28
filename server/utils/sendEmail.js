import nodemailer from "nodemailer";

export const sendEmail = async ({ email, subject, message }) => {
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

  const from = process.env.STORE_NAME
    ? `"${process.env.STORE_NAME}" <${usuario}>`
    : usuario;

  const mailOptions = {
    from,
    to: email,

    replyTo: process.env.STORE_EMAIL || usuario,
    subject,
    html: message,
  };

  await transporter.sendMail(mailOptions);
};
