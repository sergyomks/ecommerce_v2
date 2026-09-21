import dotenv from "dotenv";
dotenv.config({ path: "./config/config.env" });

import pool from "../database/db.js";
import {
  formatearTelefonoWhatsApp,
  normalizarTelefono,
} from "../utils/validaciones.js";

(async () => {
  try {
    console.log("\n🧪 Test 1: Función formatearTelefonoWhatsApp\n");

    const pruebas = [
      "+51 987 654 321",
      "987654321",
      "+51987654321",
      "51 987 654 321",
      "(01) 234-5678",
      "987-654-321",
      "",
      null,
    ];

    pruebas.forEach((tel) => {
      const normalizado = normalizarTelefono(tel);
      const whatsapp = formatearTelefonoWhatsApp(tel);
      console.log(
        `  Input: "${tel}" → Normalizado: "${normalizado}" → WhatsApp: "${whatsapp || "inválido"}"`
      );
    });

    console.log("\n🧪 Test 2: SP sp_obtener_usuario_email_nombre\n");

    const [usuarios] = await pool.query(
      `SELECT id, nombre, email,
              (google_id IS NOT NULL) AS tiene_google
       FROM usuarios
       LIMIT 5`
    );

    console.log(`Encontrados ${usuarios.length} usuarios:\n`);
    usuarios.forEach((u, i) => {
      console.log(`${i + 1}. ${u.nombre} (${u.email})`);
      console.log(`   tiene_google: ${u.tiene_google ? "✅ SÍ" : "❌ NO"}`);
    });

    console.log("\n🧪 Test 3: Llamada al SP actualizado\n");

    for (const u of usuarios) {
      const [res] = await pool.query(
        `CALL sp_obtener_usuario_email_nombre(?)`,
        [u.id]
      );
      const resultado = res[0]?.[0];
      console.log(`\n  Usuario: ${u.nombre}`);
      console.log(`  Resultado SP:`, resultado);

      if (resultado && "tiene_google" in resultado) {
        console.log(`  ✅ El SP retorna tiene_google: ${resultado.tiene_google}`);
      } else {
        console.log(`  ❌ El SP NO retorna tiene_google`);
      }
    }

    console.log("\n🧪 Test 4: Simulación de flujo de pedido\n");

    for (const u of usuarios) {
      const [res] = await pool.query(
        `CALL sp_obtener_usuario_email_nombre(?)`,
        [u.id]
      );
      const usuario = res[0]?.[0];
      const esGoogle = Number(usuario?.tiene_google) === 1;

      console.log(`\n  Usuario: ${u.nombre} (${u.email})`);
      console.log(`  Tipo: ${esGoogle ? "🔵 Google" : "🟢 Normal"}`);

      if (esGoogle) {
        console.log(`  → Acción: 📧 Enviar EMAIL a ${usuario.email}`);
      } else {
        const telefonoEjemplo = "987654321";
        const wsp = formatearTelefonoWhatsApp(telefonoEjemplo);
        console.log(`  → Acción: 📱 Enviar WHATSAPP a ${wsp}`);
      }
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
})();
