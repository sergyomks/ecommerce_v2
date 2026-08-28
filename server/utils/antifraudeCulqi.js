const PAIS_POR_DEFECTO = "PE";

const limpiar = (valor, maximo = 100) => {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;
  return texto.slice(0, maximo);
};

const separarNombre = (nombreCompleto) => {
  const partes = String(nombreCompleto || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return { first_name: null, last_name: null };
  if (partes.length === 1) return { first_name: partes[0], last_name: null };
  return {
    first_name: partes[0],
    last_name: partes.slice(1).join(" "),
  };
};

export const construirAntifraude = ({ envio, nombreRespaldo, deviceFingerPrintId }) => {
  const { first_name, last_name } = separarNombre(
    envio?.nombre_completo || nombreRespaldo
  );

  const campos = {
    first_name: limpiar(first_name, 50),
    last_name: limpiar(last_name, 50),
    address: limpiar(envio?.direccion, 100),
    address_city: limpiar(envio?.provincia || envio?.distrito, 50),
    country_code: limpiar(envio?.country_code || PAIS_POR_DEFECTO, 2),
    phone_number: limpiar(envio?.telefono, 15),
    device_finger_print_id: limpiar(deviceFingerPrintId, 255),
  };

  return Object.fromEntries(
    Object.entries(campos).filter(([, valor]) => valor !== null)
  );
};
