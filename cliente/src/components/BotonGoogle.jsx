import React, { useEffect, useRef, useState } from "react";
import { axiosInstance } from "../lib/axios";

const SCRIPT_ID = "google-identity-services";

function cargarScriptGoogle() {
  return new Promise((resolver, rechazar) => {
    if (window.google?.accounts?.id) return resolver();

    const existente = document.getElementById(SCRIPT_ID);
    if (existente) {
      existente.addEventListener("load", () => resolver());
      existente.addEventListener("error", () => rechazar(new Error("script")));
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolver();
    script.onerror = () => rechazar(new Error("No se pudo cargar Google."));
    document.head.appendChild(script);
  });
}

export default function BotonGoogle({ onExito, texto = "signin_with" }) {
  const contenedor = useRef(null);
  const [clientId, setClientId] = useState(null);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vivo = true;
    axiosInstance
      .get("/auth/google/config")
      .then(({ data }) => {
        if (vivo && data.habilitado && data.clientId) setClientId(data.clientId);
      })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    if (!clientId || !contenedor.current) return;
    let vivo = true;

    const manejarCredencial = async ({ credential }) => {
      setEnviando(true);
      setError(null);
      try {
        const { data } = await axiosInstance.post("/auth/google", { credential });
        onExito?.(data);
      } catch (e) {
        setError(
          e.response?.data?.message || "No pudimos completar el acceso con Google."
        );
      } finally {
        if (vivo) setEnviando(false);
      }
    };

    cargarScriptGoogle()
      .then(() => {
        if (!vivo || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: manejarCredencial,
        });
        window.google.accounts.id.renderButton(contenedor.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: texto,
          locale: "es",
        });
      })
      .catch(() => {
        if (vivo) setError("No se pudo cargar el acceso con Google.");
      });

    return () => { vivo = false; };
  }, [clientId, texto, onExito]);

  if (!clientId) return null;

  return (
    <div className="flex flex-col items-center gap-3 my-4">
      <div className="flex items-center gap-3 w-full">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">o</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div ref={contenedor} aria-busy={enviando} />

      {enviando && (
        <span className="text-sm text-muted-foreground">Entrando…</span>
      )}
      {error && <span className="text-sm text-red-400 text-center">{error}</span>}
    </div>
  );
}
