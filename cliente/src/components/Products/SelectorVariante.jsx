import React, { useMemo, useState, useEffect } from "react";

const ORDEN_TALLAS = ["XS", "S", "M", "L", "XL", "XXL"];

const ordenarTallas = (tallas) =>
  [...tallas].sort((a, b) => {
    const ia = ORDEN_TALLAS.indexOf(a);
    const ib = ORDEN_TALLAS.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;

    const na = Number(a);
    const nb = Number(b);
    if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
    return String(a).localeCompare(String(b), "es");
  });

export default function SelectorVariante({ variantes = [], onCambio }) {
  const activas = useMemo(
    () => variantes.filter((v) => v.activo !== false),
    [variantes]
  );

  const esUnica =
    activas.length === 1 &&
    activas[0].talla === "Única" &&
    activas[0].color === "Único";

  const colores = useMemo(() => {
    const vistos = new Map();
    for (const v of activas) {
      if (!vistos.has(v.color)) {
        vistos.set(v.color, {
          color: v.color,
          hex: v.color_hex || null,

          agotado: activas
            .filter((x) => x.color === v.color)
            .every((x) => Number(x.stock) === 0),
        });
      }
    }
    return [...vistos.values()];
  }, [activas]);

  const [color, setColor] = useState(null);
  const [talla, setTalla] = useState(null);

  useEffect(() => {
    if (color || colores.length === 0) return;
    setColor((colores.find((c) => !c.agotado) || colores[0]).color);
  }, [colores, color]);

  const tallasDelColor = useMemo(() => {
    if (!color) return [];
    const delColor = activas.filter((v) => v.color === color);
    return ordenarTallas(delColor.map((v) => v.talla)).map((t) => {
      const v = delColor.find((x) => x.talla === t);
      return { talla: t, stock: Number(v?.stock ?? 0), id: v?.id };
    });
  }, [activas, color]);

  useEffect(() => {
    if (!color) return;
    const sigueValiendo = tallasDelColor.some(
      (t) => t.talla === talla && t.stock > 0
    );
    if (!sigueValiendo) {
      setTalla(tallasDelColor.find((t) => t.stock > 0)?.talla ?? null);
    }
  }, [color, tallasDelColor, talla]);

  const seleccionada = useMemo(
    () => activas.find((v) => v.color === color && v.talla === talla) || null,
    [activas, color, talla]
  );

  useEffect(() => {
    onCambio?.(esUnica ? activas[0] || null : seleccionada);
  }, [seleccionada, esUnica, activas, onCambio]);

  if (activas.length === 0) {
    return (
      <p className="text-sm text-red-400">
        Este producto no tiene tallas configuradas.
      </p>
    );
  }

  if (esUnica) return null;

  return (
    <div className="flex flex-col gap-4">
      {colores.length > 1 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">
            Color: <span className="font-normal opacity-70">{color}</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {colores.map((c) => {
              const activo = c.color === color;
              return (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setColor(c.color)}
                  disabled={c.agotado}
                  aria-pressed={activo}
                  title={c.agotado ? `${c.color} · agotado` : c.color}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition
                    ${activo ? "border-blue-500 bg-blue-500/10 font-semibold" : "border-white/20"}
                    ${c.agotado ? "opacity-40 cursor-not-allowed line-through" : "hover:border-blue-400"}`}
                >
                  {c.hex && (
                    <span
                      className="h-4 w-4 rounded-full border border-black/20"
                      style={{ background: c.hex }}
                    />
                  )}
                  {c.color}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">Talla</span>
        <div className="flex flex-wrap gap-2">
          {tallasDelColor.map((t) => {
            const activo = t.talla === talla;
            const agotada = t.stock === 0;
            return (
              <button
                key={t.talla}
                type="button"
                onClick={() => setTalla(t.talla)}
                disabled={agotada}
                aria-pressed={activo}
                title={agotada ? `Talla ${t.talla} · agotada` : `Talla ${t.talla}`}
                className={`min-w-[3rem] rounded border px-3 py-2 text-sm font-mono transition
                  ${activo ? "border-blue-500 bg-blue-500/10 font-semibold" : "border-white/20"}
                  ${agotada ? "opacity-40 cursor-not-allowed line-through" : "hover:border-blue-400"}`}
              >
                {t.talla}
              </button>
            );
          })}
        </div>

        {seleccionada && seleccionada.stock > 0 && seleccionada.stock <= 5 && (
          <span className="text-xs text-amber-400">
            {seleccionada.stock === 1
              ? "Queda 1 unidad de esta combinación"
              : `Quedan ${seleccionada.stock} unidades de esta combinación`}
          </span>
        )}
        {!seleccionada && (
          <span className="text-xs opacity-70">
            Elige una talla disponible para continuar.
          </span>
        )}
      </div>
    </div>
  );
}
