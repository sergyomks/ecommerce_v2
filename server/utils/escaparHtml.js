const ENTIDADES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const PROTOCOLOS_PERMITIDOS = ["http:", "https:"];

export const escaparHtml = (valor) =>
  String(valor ?? "").replace(/[&<>"']/g, (caracter) => ENTIDADES[caracter]);

export const urlSegura = (valor) => {
  if (!valor) return null;
  try {
    const url = new URL(String(valor).trim());
    return PROTOCOLOS_PERMITIDOS.includes(url.protocol)
      ? escaparHtml(url.href)
      : null;
  } catch {
    return null;
  }
};
