import React, { useState } from "react";
import { Download, LoaderCircle, FileSpreadsheet } from "lucide-react";
import { toast } from "react-toastify";
import { axiosInstance } from "../../lib/axios";

const aISO = (fecha) => {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const hoy = new Date();
const primerDiaDelMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

const ATAJOS = [
  {
    etiqueta: "Este mes",
    rango: () => [aISO(primerDiaDelMes), aISO(hoy)],
  },
  {
    etiqueta: "Mes pasado",
    rango: () => {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
      const fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
      return [aISO(inicio), aISO(fin)];
    },
  },
  {
    etiqueta: "Últimos 90 días",
    rango: () => {
      const inicio = new Date(hoy);
      inicio.setDate(inicio.getDate() - 90);
      return [aISO(inicio), aISO(hoy)];
    },
  },
  {
    etiqueta: "Este año",
    rango: () => [aISO(new Date(hoy.getFullYear(), 0, 1)), aISO(hoy)],
  },
];

export default function Reportes() {
  const [desde, setDesde] = useState(aISO(primerDiaDelMes));
  const [hasta, setHasta] = useState(aISO(hoy));
  const [descargando, setDescargando] = useState(false);

  const rangoInvalido = Boolean(desde && hasta && desde > hasta);

  const descargar = async () => {
    if (rangoInvalido) return;
    setDescargando(true);

    try {
      const respuesta = await axiosInstance.get("/admin/reportes/ventas", {
        params: { desde, hasta },
        responseType: "blob",
      });

      const cabecera = respuesta.headers["content-disposition"] || "";
      const coincidencia = cabecera.match(/filename="?([^"]+)"?/);
      const nombre = coincidencia?.[1] || `ventas_${desde}_a_${hasta}.xlsx`;

      const url = URL.createObjectURL(new Blob([respuesta.data]));
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombre;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);

      toast.success("Reporte descargado.");
    } catch (error) {

      let mensaje = "No se pudo generar el reporte.";
      try {
        const texto = await error.response?.data?.text?.();
        if (texto) mensaje = JSON.parse(texto).message || mensaje;
      } catch {

      }
      toast.error(mensaje);
    } finally {
      setDescargando(false);
    }
  };

  const aplicarAtajo = (atajo) => {
    const [d, h] = atajo.rango();
    setDesde(d);
    setHasta(h);
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-1">Reportes</h1>
      <p className="text-sm opacity-70 mb-6">
        Descarga la información de la tienda en Excel, con formato listo para
        imprimir o pasar a contabilidad.
      </p>

      <div className="rounded-lg border border-white/10 bg-white/5 p-5 max-w-2xl">
        <div className="flex items-start gap-3 mb-5">
          <FileSpreadsheet className="h-8 w-8 text-green-500 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold">Ventas por periodo</h2>
            <p className="text-sm opacity-70">
              Un pedido pagado por fila, con cliente, destino, subtotal,
              descuento, envío, total e IGV incluido. Lleva fila de totales.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {ATAJOS.map((a) => (
            <button
              key={a.etiqueta}
              type="button"
              onClick={() => aplicarAtajo(a)}
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:border-blue-400 transition"
            >
              {a.etiqueta}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs">
            <span className="opacity-70">Desde</span>
            <input
              type="date"
              value={desde}
              max={hasta || undefined}
              onChange={(e) => setDesde(e.target.value)}
              className="rounded border border-white/20 bg-transparent px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs">
            <span className="opacity-70">Hasta</span>
            <input
              type="date"
              value={hasta}
              min={desde || undefined}
              onChange={(e) => setHasta(e.target.value)}
              className="rounded border border-white/20 bg-transparent px-3 py-2 text-sm"
            />
          </label>

          <button
            type="button"
            onClick={descargar}
            disabled={descargando || rangoInvalido}
            className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white
                       disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition"
          >
            {descargando ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Generando…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar Excel
              </>
            )}
          </button>
        </div>

        {rangoInvalido && (
          <p className="mt-3 text-sm text-red-400">
            La fecha inicial no puede ser posterior a la final.
          </p>
        )}
      </div>
    </div>
  );
}
