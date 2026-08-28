import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const crearLimitador = ({ minutos, maximo, mensaje }) =>
  rateLimit({
    windowMs: minutos * 60 * 1000,
    limit: maximo,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { success: false, message: mensaje },
  });

export const limitadorGeneral = crearLimitador({
  minutos: 15,
  maximo: 300,
  mensaje: "Demasiadas solicitudes. Inténtalo de nuevo en unos minutos.",
});

export const limitadorAuth = crearLimitador({
  minutos: 15,
  maximo: 10,
  mensaje: "Demasiados intentos de acceso. Espera 15 minutos.",
});

export const limitadorRecuperacion = crearLimitador({
  minutos: 60,
  maximo: 5,
  mensaje: "Demasiadas solicitudes de recuperación. Espera una hora.",
});

export const limitadorFormularios = crearLimitador({
  minutos: 60,
  maximo: 10,
  mensaje: "Has enviado demasiados formularios. Espera una hora.",
});

export const limitadorIA = crearLimitador({
  minutos: 10,
  maximo: 15,
  mensaje: "Demasiadas búsquedas con IA. Espera unos minutos.",
});

const porUsuario = (req) => req.usuario?.id || ipKeyGenerator(req.ip);

export const limitadorPago = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  keyGenerator: porUsuario,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Demasiados intentos de pago. Espera unos minutos antes de reintentar.",
  },
});

export const limitadorPedidos = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 15,
  keyGenerator: porUsuario,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Has creado demasiados pedidos seguidos. Espera unos minutos.",
  },
});
