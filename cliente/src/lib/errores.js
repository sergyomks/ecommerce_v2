const SIN_CONEXION = "No se pudo conectar con el servidor. Revisa tu conexión.";

export const mensajeDeError = (
  error,
  respaldo = "Algo salió mal. Inténtalo de nuevo."
) => {
  if (error?.code === "ERR_NETWORK" || error?.code === "ECONNABORTED") {
    return SIN_CONEXION;
  }
  if (!error?.response) {
    return respaldo;
  }
  return error.response.data?.message || respaldo;
};
