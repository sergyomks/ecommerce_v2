import { useDispatch, useSelector } from "react-redux";
import { toggleComponent } from "../../store/slices/extraSlice";
import { AlertTriangle, PackageCheck } from "lucide-react";

const FeaturedDuel = () => {
  const { lowStockProducts } = useSelector((state) => state.admin);
  const dispatch = useDispatch();

  const items = Array.isArray(lowStockProducts) ? lowStockProducts : [];
  const hasAlerts = items.length > 0;
  const preview = items.slice(0, 3);

  return (
    <article className="admin-card p-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${
              hasAlerts
                ? "bg-gradient-to-br from-[#fca5a5] to-[#ef4444] text-white"
                : "bg-gradient-to-br from-[#86efac] to-[#22c55e] text-white"
            }`}
          >
            {hasAlerts ? (
              <AlertTriangle className="w-5 h-5" strokeWidth={2} />
            ) : (
              <PackageCheck className="w-5 h-5" strokeWidth={2} />
            )}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#8aa0a4]">
              Alerta de inventario
            </p>
            <h3 className="text-lg font-semibold text-[#16343a] leading-tight">
              {hasAlerts
                ? `${items.length} producto${items.length === 1 ? "" : "s"} con stock bajo`
                : "Inventario saludable"}
            </h3>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dispatch(toggleComponent("Products"))}
          className="text-sm font-medium text-[#1aa89a] hover:underline whitespace-nowrap"
        >
          Ver productos
        </button>
      </div>

      {hasAlerts ? (
        <ul className="divide-y divide-[#edf2f3]">
          {preview.map((item, index) => (
            <li
              key={`${item.nombre}-${index}`}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold ${
                    Number(item.stock) === 0
                      ? "bg-[#fee2e2] text-[#b91c1c]"
                      : "bg-[#fef3c7] text-[#b45309]"
                  }`}
                >
                  {Number(item.stock) || 0}
                </span>
                <span className="font-medium text-[#16343a] truncate">
                  {item.nombre}
                </span>
              </div>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                  Number(item.stock) === 0
                    ? "bg-[#fee2e2] text-[#b91c1c]"
                    : "bg-[#fef3c7] text-[#b45309]"
                }`}
              >
                {Number(item.stock) === 0 ? "Sin stock" : "Stock bajo"}
              </span>
            </li>
          ))}
          {items.length > preview.length && (
            <li className="pt-3 text-xs text-[#6b8a8a]">
              y {items.length - preview.length} más...
            </li>
          )}
        </ul>
      ) : (
        <p className="text-sm text-[#6b8a8a]">
          Todos los productos tienen stock suficiente (más de 5 unidades).
        </p>
      )}
    </article>
  );
};

export default FeaturedDuel;
