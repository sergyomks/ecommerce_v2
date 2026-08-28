const BASE_POR_DEFECTO = "http://localhost:5173";

const normalizar = (url) =>
  String(url || BASE_POR_DEFECTO).trim().replace(/\/+$/, "");

export const urlRestablecerContrasena = (destino, token) => {
  const base = normalizar(process.env.FRONTEND_URL);
  const raiz = destino === "admin" ? `${base}/admin` : base;
  return `${raiz}/contrasena/reiniciar/${token}`;
};
