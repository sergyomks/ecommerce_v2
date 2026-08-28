class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const traducirError = (err) => {
  if (err.code === "ER_DUP_ENTRY" || err.code === 11000) {
    return new ErrorHandler("El valor ya está registrado.", 400);
  }
  if (err.code === "ER_DATA_TOO_LONG") {
    return new ErrorHandler("Uno de los campos supera la longitud permitida.", 400);
  }
  if (err.name === "JsonWebTokenError") {
    return new ErrorHandler("JSON Web Token no válido", 401);
  }
  if (err.name === "TokenExpiredError") {
    return new ErrorHandler("JSON Web Token ha expirado", 401);
  }

  if (err.sqlState === "45000") {
    const MENSAJES = {
      OFERTA_FECHAS_INVALIDAS: [
        "La fecha de fin de la promoción no puede ser anterior a la de inicio.",
        400,
      ],
      OFERTA_NO_APLICABLE: [
        "El precio de oferta debe ser mayor que cero y menor que el precio normal del producto.",
        409,
      ],
      STOCK_INSUFICIENTE: ["No hay stock suficiente para completar la operación.", 409],
    };
    const [mensaje, codigo] = MENSAJES[err.sqlMessage] || [
      "La operación no cumple una regla de negocio.",
      409,
    ];
    return new ErrorHandler(mensaje, codigo);
  }

  if (err.type === "entity.parse.failed") {
    return new ErrorHandler("El cuerpo de la solicitud no es JSON válido.", 400);
  }
  if (err.type === "entity.too.large") {
    return new ErrorHandler("La solicitud supera el tamaño permitido.", 413);
  }
  return err;
};

export const errorMiddleware = (err, req, res, next) => {
  const error = traducirError(err);
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error("Error no controlado:", err);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor. Inténtalo de nuevo más tarde.",
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: error.message || "Solicitud inválida.",
  });
};

export default ErrorHandler;
