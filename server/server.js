
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, 'config', 'config.env') });

import app from "./app.js";
import { v2 as cloudinary } from 'cloudinary';
import pool from './database/db.js';
import { crearTablas } from './utils/crearTabla.js';
import { validarEntorno } from './utils/validarEntorno.js';
import { iniciarExpiracionPedidos } from './utils/expirarPedidos.js';

const MARGEN_APAGADO_MS = 10000;

try {
    validarEntorno();
} catch (error) {
    console.error("Configuración inválida:", error.message);
    process.exit(1);
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
    api_key: process.env.CLOUDINARY_CLIENT_API,
    api_secret: process.env.CLOUDINARY_CLIENT_SECRET
});

try {
    await crearTablas();
} catch (error) {
    console.error(
        "No se pudo preparar la base de datos, el servidor no arrancará:",
        error.message
    );
    process.exit(1);
}

const servidor = app.listen(process.env.PORT, () => {
    console.log(`El servidor se está ejecutando en el puerto ${process.env.PORT}`);
});

const temporizadorExpiracion = iniciarExpiracionPedidos();

let apagando = false;

const apagar = async (senal) => {
    if (apagando) return;
    apagando = true;

    console.log(`${senal} recibida: cerrando el servidor ordenadamente.`);

    const forzar = setTimeout(() => {
        console.error("El apagado ordenado excedió el margen; forzando salida.");
        process.exit(1);
    }, MARGEN_APAGADO_MS);
    forzar.unref();

    if (temporizadorExpiracion) {
        clearInterval(temporizadorExpiracion);
    }

    await new Promise((resolver) => servidor.close(resolver));

    try {
        await pool.end();
    } catch (error) {
        console.error("Error al cerrar el pool de MySQL:", error.message);
    }

    clearTimeout(forzar);
    console.log("Servidor cerrado.");
};

process.on("SIGTERM", () => apagar("SIGTERM"));
process.on("SIGINT", () => apagar("SIGINT"));
