import dotenv from "dotenv";
dotenv.config({ path: "./config/config.env" });

import pool from "../database/db.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateOrderPlacedEmailTemplate } from "../utils/generateOrderPlacedEmailTemplate.js";

(async () => {
  try {
    console.log("\n🔍 Buscando usuarios de Google en la BD...\n");

    const [googleUsers] = await pool.query(
      `SELECT id, nombre, email, google_id, contraseña IS NOT NULL AS tiene_contrasena
       FROM usuarios
       WHERE google_id IS NOT NULL
       LIMIT 5`
    );

    if (googleUsers.length === 0) {
      console.log("❌ No hay usuarios de Google en la BD");
      console.log("💡 Haz un login con Google primero para crear uno");
    } else {
      console.log(`✅ Encontrados ${googleUsers.length} usuarios de Google:\n`);
      googleUsers.forEach((u, i) => {
        console.log(`${i + 1}. ID: ${u.id}`);
        console.log(`   Nombre: ${u.nombre}`);
        console.log(`   Email: ${u.email}`);
        console.log(`   Google ID: ${u.google_id}`);
        console.log(`   Tiene contraseña: ${u.tiene_contrasena ? "Sí" : "No"}`);
        console.log("");
      });

      const testUser = googleUsers[0];
      console.log(`\n🧪 Probando flujo de pedido con usuario: ${testUser.email}\n`);

      const [resUsuario] = await pool.query(
        `CALL sp_obtener_usuario_email_nombre(?)`,
        [testUser.id]
      );
      const usuario = resUsuario[0]?.[0];

      console.log("📋 Resultado de sp_obtener_usuario_email_nombre:");
      console.log(usuario);

      if (usuario?.email) {
        console.log(`\n📧 Enviando email de prueba a: ${usuario.email}...`);
        const template = generateOrderPlacedEmailTemplate({
          nombreUsuario: usuario.nombre,
          pedidoId: "test-pedido-id-12345678",
          items: [
            { titulo: "Producto de prueba", cantidad: 1, precio: 99.99, talla: "M", color: "Azul" }
          ],
          precioTotal: 99.99,
          minutosExpiracion: 30,
          ordersUrl: "http://localhost:5173/orders",
        });
        await sendEmail({
          email: usuario.email,
          subject: `PRUEBA: Pedido simulado para usuario Google`,
          message: template.html,
          textoPlano: template.text,
        });
        console.log("✅ Email enviado correctamente");
      } else {
        console.log("❌ El SP no devolvió email");
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();
