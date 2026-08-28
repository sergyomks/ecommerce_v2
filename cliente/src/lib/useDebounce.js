import { useEffect, useState } from "react";

export const useDebounce = (valor, retrasoMs = 400) => {
  const [valorDiferido, setValorDiferido] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setValorDiferido(valor), retrasoMs);
    return () => clearTimeout(temporizador);
  }, [valor, retrasoMs]);

  return valorDiferido;
};
