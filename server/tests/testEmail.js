import dotenv from "dotenv";
dotenv.config({ path: "./config/config.env" });

import { sendEmail } from "../utils/sendEmail.js";

const testEmails = [
  "sergychocce@gmail.com",
  "i2321578@continental.edu.pe",
];

(async () => {
  for (const email of testEmails) {
    try {
      console.log(`\n📧 Enviando a: ${email}...`);
      await sendEmail({
        email,
        subject: "PRUEBA: Diagnóstico de email",
        message: `
          <h1>Prueba de diagnóstico</h1>
          <p>Si ves este email, el SMTP funciona correctamente.</p>
          <p>Enviado desde: ${process.env.SMTP_MAIL}</p>
          <p>Fecha: ${new Date().toISOString()}</p>
        `,
      });
      console.log(`✅ Email enviado a ${email}`);
    } catch (error) {
      console.error(`❌ Error enviando a ${email}:`, error.message);
    }
  }
  process.exit(0);
})();
