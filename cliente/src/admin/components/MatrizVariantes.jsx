import React, { useMemo, useState } from "react";
import { Plus, Trash2, Wand2 } from "lucide-react";

const TALLAS_SUGERIDAS = ["XS", "S", "M", "L", "XL", "XXL"];

const claveDe = (talla, color) => `${talla}|||${color}`;

export default function MatrizVariantes({ variantes, onChange, onEliminar }) {
  const [tallasNuevas, setTallasNuevas] = useState("");
  const [colorNuevo, setColorNuevo] = useState("");
  const [hexNuevo, setHexNuevo] = useState("#1B2A4A");

  const tallas = useMemo(() => {
    const vistas = [];
    for (const v of variantes) if (!vistas.includes(v.talla)) vistas.push(v.talla);
    return vistas.sort((a, b) => {
      const ia = TALLAS_SUGERIDAS.indexOf(a);
      const ib = TALLAS_SUGERIDAS.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      const na = Number(a);
      const nb = Number(b);
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return String(a).localeCompare(String(b), "es");
    });
  }, [variantes]);

  const colores = useMemo(() => {
    const vistos = new Map();
    for (const v of variantes) {
      if (!vistos.has(v.color)) vistos.set(v.color, v.color_hex || null);
    }
    return [...vistos.entries()].map(([color, hex]) => ({ color, hex }));
  }, [variantes]);

  const indice = useMemo(() => {
    const m = new Map();
    for (const v of variantes) m.set(claveDe(v.talla, v.color), v);
    return m;
  }, [variantes]);

  const total = variantes.reduce((s, v) => s + (Number(v.stock) || 0), 0);

  const cambiarStock = (talla, color, valor) => {

    const limpio = valor.replace(/\D/g, "");
    onChange(
      variantes.map((v) =>
        v.talla === talla && v.color === color
          ? { ...v, stock: limpio === "" ? "" : Number(limpio) }
          : v
      )
    );
  };

  const generar = () => {
    const tallasPedidas = tallasNuevas
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const color = colorNuevo.trim();

    if (tallasPedidas.length === 0 || !color) return;

    const nuevas = [...variantes];
    for (const talla of tallasPedidas) {
      if (indice.has(claveDe(talla, color))) continue;
      nuevas.push({ talla, color, color_hex: hexNuevo, sku: null, stock: 0 });
    }
    onChange(nuevas);
    setTallasNuevas("");
    setColorNuevo("");
  };

  const quitarColor = (color) => {
    const delColor = variantes.filter((v) => v.color === color);

    delColor.filter((v) => v.id).forEach((v) => onEliminar?.(v));
    onChange(variantes.filter((v) => v.color !== color));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
        <Wand2 className="mb-2 h-4 w-4 opacity-60" />
        <label className="flex flex-col gap-1 text-xs">
          <span className="opacity-70">Tallas (separadas por coma)</span>
          <input
            type="text"
            value={tallasNuevas}
            onChange={(e) => setTallasNuevas(e.target.value)}
            placeholder="S, M, L, XL"
            className="w-44 rounded border border-white/20 bg-transparent px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="opacity-70">Color</span>
          <input
            type="text"
            value={colorNuevo}
            onChange={(e) => setColorNuevo(e.target.value)}
            placeholder="Azul marino"
            maxLength={40}
            className="w-40 rounded border border-white/20 bg-transparent px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="opacity-70">Tono</span>
          <input
            type="color"
            value={hexNuevo}
            onChange={(e) => setHexNuevo(e.target.value)}
            className="h-[34px] w-12 rounded border border-white/20 bg-transparent"
          />
        </label>
        <button
          type="button"
          onClick={generar}
          disabled={!tallasNuevas.trim() || !colorNuevo.trim()}
          className="mb-[1px] flex items-center gap-1 rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Generar
        </button>
      </div>

      {variantes.length === 0 ? (
        <p className="rounded-lg border border-dashed border-white/20 p-6 text-center text-sm opacity-70">
          Añade al menos una combinación de talla y color. Si esta prenda no
          tiene tallas, usa <strong>Única</strong> como talla y{" "}
          <strong>Único</strong> como color.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="border-b border-white/10 px-3 py-2 text-left font-medium opacity-70">
                  Color
                </th>
                {tallas.map((t) => (
                  <th
                    key={t}
                    className="border-b border-white/10 px-3 py-2 text-center font-mono font-medium opacity-70"
                  >
                    {t}
                  </th>
                ))}
                <th className="border-b border-white/10 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {colores.map(({ color, hex }) => (
                <tr key={color}>
                  <td className="border-b border-white/5 px-3 py-2">
                    <span className="flex items-center gap-2">
                      {hex && (
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-black/20"
                          style={{ background: hex }}
                        />
                      )}
                      {color}
                    </span>
                  </td>
                  {tallas.map((talla) => {
                    const v = indice.get(claveDe(talla, color));
                    if (!v) {
                      return (
                        <td key={talla} className="border-b border-white/5 px-3 py-2 text-center opacity-25">
                          —
                        </td>
                      );
                    }
                    const agotada = Number(v.stock) === 0;
                    return (
                      <td key={talla} className="border-b border-white/5 px-2 py-2 text-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={v.stock}
                          onChange={(e) => cambiarStock(talla, color, e.target.value)}
                          aria-label={`Stock de ${talla} ${color}`}
                          className={`w-16 rounded border px-2 py-1 text-center font-mono text-sm
                            ${agotada ? "border-amber-500/60 bg-amber-500/10 text-amber-300" : "border-white/20 bg-transparent"}`}
                        />
                      </td>
                    );
                  })}
                  <td className="border-b border-white/5 px-2 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => quitarColor(color)}
                      title={`Quitar todas las tallas de ${color}`}
                      className="rounded p-1.5 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs opacity-70">
        Total: <strong>{total}</strong> unidades en {variantes.length}{" "}
        combinación{variantes.length === 1 ? "" : "es"}. Poner una celda en 0 la
        deja agotada sin borrarla.
      </p>
    </div>
  );
}
