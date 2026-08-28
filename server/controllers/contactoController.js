import crypto from "crypto";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import pool from "../database/db.js";
import { sendEmail } from "../utils/sendEmail.js";
import { escaparHtml } from "../utils/escaparHtml.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const obtenerInfoContacto = catchAsyncErrors(async (req, res) => {
  res.status(200).json({
    success: true,
    email: process.env.STORE_EMAIL || process.env.SMTP_MAIL || "",
    telefono: process.env.STORE_PHONE || "",
    direccion: process.env.STORE_ADDRESS || "",
  });
});

export const enviarMensajeContacto = catchAsyncErrors(async (req, res, next) => {
  const { nombre, email, asunto, mensaje, website } = req.body;

  if (website) {
    return res.status(200).json({
      success: true,
      message: "Mensaje enviado correctamente.",
    });
  }

  if (!nombre || !email || !asunto || !mensaje) {
    return next(
      new ErrorHandler("Nombre, email, asunto y mensaje son obligatorios.", 400)
    );
  }

  if (!emailRegex.test(email)) {
    return next(new ErrorHandler("Email inválido.", 400));
  }

  if (nombre.trim().length < 2 || mensaje.trim().length < 10) {
    return next(
      new ErrorHandler(
        "El nombre debe tener al menos 2 caracteres y el mensaje al menos 10.",
        400
      )
    );
  }

  const id = crypto.randomUUID();
  await pool.query(`CALL sp_crear_mensaje_contacto(?, ?, ?, ?, ?)`,
    [id, nombre.trim(), email.trim().toLowerCase(), asunto.trim(), mensaje.trim()]
  );

  const adminEmail = process.env.SMTP_MAIL || process.env.SMTP_EMAIL;
  if (adminEmail) {
    try {
      await sendEmail({
        email: adminEmail,
        subject: `[Contacto SYSTEC] ${asunto.trim()}`,
        message: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Nuevo mensaje de contacto</h2>
            <p><strong>Nombre:</strong> ${escaparHtml(nombre.trim())}</p>
            <p><strong>Email:</strong> ${escaparHtml(email.trim())}</p>
            <p><strong>Asunto:</strong> ${escaparHtml(asunto.trim())}</p>
            <p><strong>Mensaje:</strong></p>
            <p style="white-space: pre-wrap;">${escaparHtml(mensaje.trim())}</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Contacto guardado pero falló el email al admin:", err?.message);
    }
  }

  res.status(201).json({
    success: true,
    message: "Mensaje enviado correctamente. Te responderemos pronto.",
  });
});

export const listarMensajesContacto = catchAsyncErrors(async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = 10;
  const offset = (page - 1) * limit;

  const [resCount] = await pool.query(`CALL sp_contar_mensajes_contacto()`);
  const countRows = resCount[0] || [];

  const [resMensajes] = await pool.query(`CALL sp_listar_mensajes_contacto(?, ?)`, [limit, offset]);
  const mensajes = resMensajes[0] || [];

  res.status(200).json({
    success: true,
    mensajes,
    total: countRows[0].total,
    page,
  });
});

export const marcarMensajeLeido = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const [resUpdate] = await pool.query(`CALL sp_marcar_mensaje_leido(?)`, [id]);
  const affectedRows = resUpdate[0]?.[0]?.affected || 0;

  if (affectedRows === 0) {
    return next(new ErrorHandler("Mensaje no encontrado.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Mensaje marcado como leído.",
  });
});

export const eliminarMensajeContacto = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const [resDelete] = await pool.query(`CALL sp_eliminar_mensaje_contacto(?)`, [id]);
  const affectedRows = resDelete[0]?.[0]?.affected || 0;

  if (affectedRows === 0) {
    return next(new ErrorHandler("Mensaje no encontrado.", 404));
  }

  res.status(200).json({
    success: true,
    message: "Mensaje eliminado.",
  });
});
