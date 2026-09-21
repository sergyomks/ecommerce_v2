import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import pool from "../database/db.js";
import bcrypt from "bcryptjs";
import { sendToken, COOKIE_NAMES } from "../utils/jwtToken.js";
import crypto from "crypto";
import {
  generateEmailTemplate,
  generateGoogleAccountEmailTemplate,
} from "../utils/generateForgotPasswordEmailTemplate.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateWelcomeEmailTemplate } from "../utils/generateWelcomeEmailTemplate.js";
import { verificarTokenGoogle, googleDisponible } from "../utils/verificarTokenGoogle.js";
import { generateResetPasswordToken } from "../utils/generateResetPasswordToken.js";
import {v2 as cloudinary} from "cloudinary"
import { sanitizeUser, getAuthCookieOptions } from "../utils/userSafe.js";
import { esEmail, esNombrePersona } from "../utils/validaciones.js";
import { comoLista, validarImagenes } from "../utils/imagenes.js";
import { urlRestablecerContrasena } from "../utils/urlFrontend.js";

export const registrar = catchAsyncErrors(async (req, res, next) => {
    const { nombre, email, contraseña } = req.body;
    if (!nombre || !email || !contraseña) {
        return next(new ErrorHandler("Por favor, complete todos los campos", 400));
    }

    if (!esEmail(email)) {
        return next(new ErrorHandler("El correo electrónico no es válido", 400));
    }

    const nombreNorm = String(nombre).trim();
    if (nombreNorm.length < 3 || nombreNorm.length > 100) {
        return next(new ErrorHandler("El nombre debe tener entre 3 y 100 caracteres", 400));
    }

    if (email.trim().length > 100) {
        return next(new ErrorHandler("El correo electrónico no puede superar los 100 caracteres", 400));
    }

    if (
        contraseña.length < 8 ||
        contraseña.length > 16
    ) {
        return next(new ErrorHandler("La contraseña debe tener entre 8 y 16 caracteres", 400));
    }

    const [existRes] = await pool.query(`CALL sp_obtener_usuario_por_email(?)`, [email]);
    if ((existRes[0] || []).length > 0) {
        return next(new ErrorHandler("El correo electrónico ya está registrado", 400));
    }

    const id = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(contraseña, 10);

    const [resRol] = await pool.query(`CALL sp_obtener_rol_por_nombre(?)`, ['Usuario']);
    const rolRows = resRol[0] || [];
    const idRolUsuario = rolRows[0]?.id || 1;

    await pool.query(
        `CALL sp_registrar_usuario(?, ?, ?, ?, ?)`,
        [id, nombreNorm, email, hashedPassword, idRolUsuario]
    );

    const user = {
        id,
        nombre: nombreNorm,
        email,
        rol: "Usuario",
    };

    try {
        const welcomeTemplate = generateWelcomeEmailTemplate({
            nombreUsuario: nombreNorm,
            tiendaUrl: process.env.FRONTEND_URL,
        });
        await sendEmail({
            email,
            subject: "Tu cuenta en la tienda ya está lista",
            message: welcomeTemplate.html,
            textoPlano: welcomeTemplate.text,
        });
    } catch (error) {
        console.error(
            `Usuario ${email} registrado pero falló el correo de bienvenida:`,
            error?.message || error
        );
    }

    sendToken(user, 201, "Usuario registrado exitosamente", res, {
      cookieName: COOKIE_NAMES.store,
      scope: "store",
    });
});

const MAX_INTENTOS_FALLIDOS = 5;
const MINUTOS_BLOQUEO_CUENTA = 15;

const CREDENCIALES_INVALIDAS = "Correo electrónico o contraseña incorrectos.";

export const login = catchAsyncErrors(async (req, res, next) => {
    const { email, contraseña, destino } = req.body;
    if (!email || !contraseña) {
        return next(new ErrorHandler("Por favor, proporcione su correo electrónico y contraseña.", 400));
    }

    const destinoNorm = destino === "admin" ? "admin" : "store";

    const emailNorm = String(email).trim().toLowerCase();

    const [result] = await pool.query(`CALL sp_obtener_usuario_por_email(?)`, [emailNorm]);
    const rows = result[0] || [];

    if (rows.length === 0) {
        return next(new ErrorHandler(CREDENCIALES_INVALIDAS, 401));
    }

    const user = rows[0];

    if (destinoNorm === "admin" && user.rol !== "Admin") {
        return next(
            new ErrorHandler(
                "Acceso denegado. Este inicio de sesión es solo para administradores.",
                403
            )
        );
    }

    if (Number(user.esta_bloqueado) === 1) {
        const minutos = Math.max(1, Math.ceil(Number(user.segundos_restantes || 0) / 60));
        return next(
            new ErrorHandler(
                `Cuenta bloqueada temporalmente por demasiados intentos fallidos. ` +
                    `Vuelve a intentarlo en ${minutos} minuto${minutos === 1 ? "" : "s"}.`,
                429
            )
        );
    }

    const isPasswordMatched = await bcrypt.compare(contraseña, user.contraseña);

    if (!isPasswordMatched) {
        await pool.query(`CALL sp_registrar_intento_fallido(?, ?, ?)`, [
            emailNorm,
            MAX_INTENTOS_FALLIDOS,
            MINUTOS_BLOQUEO_CUENTA,
        ]);

        const restantes = MAX_INTENTOS_FALLIDOS - Number(user.intentos_fallidos || 0) - 1;

        if (restantes <= 0) {
            return next(
                new ErrorHandler(
                    `Cuenta bloqueada durante ${MINUTOS_BLOQUEO_CUENTA} minutos por ` +
                        `demasiados intentos fallidos.`,
                    429
                )
            );
        }

        return next(
            new ErrorHandler(
                restantes <= 2
                    ? `${CREDENCIALES_INVALIDAS} Te queda${restantes === 1 ? "" : "n"} ${restantes} intento${restantes === 1 ? "" : "s"} antes de que la cuenta se bloquee.`
                    : CREDENCIALES_INVALIDAS,
                401
            )
        );
    }

    if (Number(user.intentos_fallidos || 0) > 0 || user.bloqueado_hasta) {
        await pool.query(`CALL sp_limpiar_intentos_fallidos(?)`, [user.id]);
    }

    sendToken(user, 200, "Inicio de sesión exitoso", res, {
        cookieName: COOKIE_NAMES[destinoNorm],
        scope: destinoNorm,
    });
});
export const obtenerUsuario = catchAsyncErrors(async (req, res, next) => {
    res.status(200).json({
        success: true,
        user: sanitizeUser(req.user),
        scope: req.authScope || "store",
    });
});
export const cerrarSesion = catchAsyncErrors(async (req, res, next) => {
    const scope = req.body?.scope === "admin" ? "admin" : "store";
    const cookieName = COOKIE_NAMES[scope];

    res.status(200).cookie(cookieName, "", {
        ...getAuthCookieOptions({ expires: new Date(Date.now()) }),
    }).json({
        success: true,
        message: "sesion cerrado exitosamente",
        scope,
    })
});
const RESPUESTA_RECUPERACION = {
    success: true,
    message:
        "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
};

const enviarEnlaceRecuperacion = async (user, destino) => {
    const { hashedToken, resetPasswordExpireTime, resetToken } =
        generateResetPasswordToken();

    await pool.query(`CALL sp_actualizar_reset_token(?, ?, ?)`, [user.id, hashedToken, new Date(resetPasswordExpireTime)]);

    try {
        const resetTemplate = generateEmailTemplate(
            urlRestablecerContrasena(destino, resetToken)
        );
        await sendEmail({
            email: user.email,
            subject: "Solicitud de restablecimiento de contraseña",
            message: resetTemplate.html,
            textoPlano: resetTemplate.text,
        });
    } catch (err) {
        await pool.query(`CALL sp_limpiar_reset_token(?)`, [user.id]);
        console.error(
            "No se pudo enviar el correo de recuperación:",
            err?.message || err
        );
    }
};

export const contraseñaOlvidado = catchAsyncErrors(async (req, res, next) => {
    const { email, destino } = req.body;

    if (!esEmail(email)) {
        return next(new ErrorHandler("El correo electrónico no es válido", 400));
    }

    const [resUsuario] = await pool.query(`CALL sp_obtener_usuario_por_email(?)`, [email.trim()]);
    const rows = resUsuario[0] || [];
    const user = rows[0];

    if (!user) {
        return res.status(200).json(RESPUESTA_RECUPERACION);
    }

    if (Number(user.tiene_contrasena) === 0 && Number(user.tiene_google) === 1) {

        try {
            const googleTemplate = generateGoogleAccountEmailTemplate({
                nombreUsuario: user.nombre,
                loginUrl: process.env.FRONTEND_URL
                    ? `${process.env.FRONTEND_URL}/login`
                    : undefined,
            });
            await sendEmail({
                email: user.email,
                subject: "Tu cuenta entra con Google",
                message: googleTemplate.html,
                textoPlano: googleTemplate.text,
            });
        } catch (error) {
            console.error("Falló el aviso de cuenta de Google:", error?.message || error);
        }
        return res.status(200).json(RESPUESTA_RECUPERACION);
    }

    await enviarEnlaceRecuperacion(user, destino);

    res.status(200).json(RESPUESTA_RECUPERACION);
});

export const restaurarContraseña = catchAsyncErrors(async (req, res, next) => {
    const { token } = req.params;
    const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");

    const [resToken] = await pool.query(`CALL sp_obtener_usuario_por_reset_token(?)`, [resetPasswordToken]);
    const rows = resToken[0] || [];
    if (rows.length === 0) {
        return next(new ErrorHandler("Token de restablecimiento de contraseña inválido o expirado", 400));
    }
    if (req.body.contraseña !== req.body.confirmarContraseña) {
        return next(new ErrorHandler("Las contraseñas no coinciden", 400));
    }
    if (
        req.body.contraseña?.length < 8 ||
        req.body.contraseña?.length > 16 ||
        req.body.confirmarContraseña?.length < 8 ||
        req.body.confirmarContraseña?.length > 16
    ) {
        return next(new ErrorHandler("La contraseña debe tener entre 8 y 16 caracteres", 400));
    }
    const hashedPassword = await bcrypt.hash(req.body.contraseña, 10);
    await pool.query(`CALL sp_actualizar_contrasena(?, ?)`, [rows[0].id, hashedPassword]);
    sendToken(rows[0], 200, "Contraseña restaurada exitosamente", res);
});
export const actualizarContraseña = catchAsyncErrors(async (req, res, next) => {
    const {contraseñaActual, nuevaContraseña, confirmarContraseña } = req.body;
    if (!contraseñaActual || !nuevaContraseña || !confirmarContraseña) {
        return next(new ErrorHandler("Por favor, complete todos los campos", 400));
    }
    const isPasswordMatch=await bcrypt.compare(contraseñaActual, req.user.contraseña);
    if (!isPasswordMatch) {
        return next(new ErrorHandler("La contraseña actual es incorrecta", 400));
    }
    if (
        nuevaContraseña.length < 8 ||
        nuevaContraseña.length > 16 ||
        confirmarContraseña.length < 8 ||
        confirmarContraseña.length > 16
    ) {
        return next(new ErrorHandler("La contraseña debe tener entre 8 y 16 caracteres", 400));
    }
    if (nuevaContraseña !== confirmarContraseña) {
        return next(new ErrorHandler("Las nuevas contraseñas no coinciden", 400));
    }

    const hashedPassword = await bcrypt.hash(nuevaContraseña, 10);
    await pool.query(`CALL sp_actualizar_contrasena(?, ?)`, [req.user.id, hashedPassword]);
    res.status(200).json({
        success: true,
        message: "Contraseña actualizada exitosamente",
    });
});
export const actualizarPerfil = catchAsyncErrors(async (req, res, next) => {
    const { nombre, email } = req.body;
    if (!nombre || !email) {
        return next(new ErrorHandler("Por favor, complete todos los campos", 400));
    }
    if (nombre.trim().length === 0 || email.trim().length === 0) {
        return next(new ErrorHandler("El nombre y el correo electrónico no pueden estar vacíos", 400));
    }

    const nombreNorm = nombre.trim();
    if (nombreNorm.length < 3 || nombreNorm.length > 100) {
        return next(new ErrorHandler("El nombre debe tener entre 3 y 100 caracteres", 400));
    }

    if (email.trim().length > 100) {
        return next(new ErrorHandler("El correo electrónico no puede superar los 100 caracteres", 400));
    }

    if (!esEmail(email)) {
        return next(new ErrorHandler("El correo electrónico no es válido", 400));
    }

    const [resEmail] = await pool.query(`CALL sp_verificar_email_en_uso(?, ?)`, [email.trim(), req.user.id]);
    const emailEnUso = resEmail[0] || [];
    if (emailEnUso.length > 0) {
        return next(new ErrorHandler("El correo electrónico ya está en uso", 400));
    }

    let imagenData = null;
    if (req.files && req.files.imagen) {
        const { imagen } = req.files;
        const errorImagen = validarImagenes(comoLista(imagen));
        if (errorImagen) {
            return next(new ErrorHandler(errorImagen, 400));
        }
        if (req.user?.imagen?.public_id) {
            await cloudinary.uploader.destroy(req.user.imagen.public_id);
        }
        const newPerfilImagen = await cloudinary.uploader.upload(imagen.tempFilePath, {
            folder: "ecommerce perfiles",
            width: 150,
            crop: "scale",
        });
        imagenData = {
            public_id: newPerfilImagen.public_id,
            url: newPerfilImagen.secure_url,
        };
    }

    const [rows] = await pool.query(`CALL sp_actualizar_perfil(?, ?, ?, ?)`, [
        req.user.id,
        nombreNorm,
        email.trim(),
        imagenData ? JSON.stringify(imagenData) : null
    ]);

    res.status(200).json({
        success: true,
        message: "Perfil actualizado exitosamente",
        user: sanitizeUser(rows[0]),
    });
});

export const loginGoogle = catchAsyncErrors(async (req, res, next) => {
    if (!googleDisponible()) {
        return next(
            new ErrorHandler("El acceso con Google no está habilitado.", 503)
        );
    }

    const { credential } = req.body;
    const verificado = await verificarTokenGoogle(credential);

    if (!verificado.ok) {
        console.warn("Acceso con Google rechazado:", verificado.motivo, verificado.detalle || "");
        return next(new ErrorHandler(verificado.motivo, 401));
    }

    const { googleId, email, emailVerificado, nombre, foto } = verificado.perfil;

    const [resExistente] = await pool.query(
        `CALL sp_obtener_usuario_por_google(?, ?)`,
        [googleId, email]
    );
    const existente = resExistente[0]?.[0] || null;

    if (existente && Number(existente.coincide_google) === 1) {
        await pool.query(`CALL sp_limpiar_intentos_fallidos(?)`, [existente.id]);
        return sendToken(existente, 200, "Inicio de sesión exitoso", res);
    }

    if (existente) {
        if (!emailVerificado) {

            return next(
                new ErrorHandler(
                    "Google no confirma que este correo sea tuyo. Entra con tu contraseña.",
                    403
                )
            );
        }

        try {
            await pool.query(`CALL sp_vincular_google(?, ?)`, [existente.id, googleId]);
        } catch (error) {
            if (error?.sqlState === "45000") {
                return next(
                    new ErrorHandler(
                        "Esta cuenta ya está vinculada a otra cuenta de Google.",
                        409
                    )
                );
            }
            throw error;
        }

        await pool.query(`CALL sp_limpiar_intentos_fallidos(?)`, [existente.id]);
        return sendToken(existente, 200, "Cuenta vinculada con Google.", res);
    }

    const nombreNorm = (nombre || email.split("@")[0]).trim().slice(0, 100);

    if (!esNombrePersona(nombreNorm, { min: 3, max: 100 })) {
        return next(
            new ErrorHandler(
                "Tu nombre de Google no es utilizable. Regístrate con el formulario.",
                400
            )
        );
    }

    const [resRol] = await pool.query(`CALL sp_obtener_rol_por_nombre(?)`, ["Usuario"]);
    const idRolUsuario = resRol[0]?.[0]?.id || 1;

    const id = crypto.randomUUID();
    await pool.query(`CALL sp_registrar_usuario_google(?, ?, ?, ?, ?, ?)`, [
        id,
        nombreNorm,
        email,
        googleId,
        foto ? JSON.stringify({ url: foto, public_id: null }) : null,
        idRolUsuario,
    ]);

    const user = { id, nombre: nombreNorm, email, rol: "Usuario" };

    try {
        const welcomeTemplate = generateWelcomeEmailTemplate({
            nombreUsuario: nombreNorm,
            tiendaUrl: process.env.FRONTEND_URL,
        });
        await sendEmail({
            email,
            subject: "Tu cuenta en la tienda ya está lista",
            message: welcomeTemplate.html,
            textoPlano: welcomeTemplate.text,
        });
    } catch (error) {
        console.error(
            `Cuenta de Google ${email} creada pero falló el correo de bienvenida:`,
            error?.message || error
        );
    }

    sendToken(user, 201, "Cuenta creada con Google.", res);
});

export const configGoogle = (req, res) => {
    res.status(200).json({
        success: true,
        habilitado: googleDisponible(),
        clientId: process.env.GOOGLE_CLIENT_ID || null,
    });
};
