import { useDispatch, useSelector } from "react-redux";
import { toggleComponent } from "../../store/slices/extraSlice";
import { TrendingUp, UserPlus, ShoppingBag, BarChart3 } from "lucide-react";

const MiniSummary = () => {
  const {
    currentMonthSales,
    revenueGrowth,
    newUsersThisMonth,
    orderStatusCounts,
  } = useSelector((state) => state.admin);
  const dispatch = useDispatch();

  const totalOrders = Object.values(orderStatusCounts || {}).reduce(
    (acc, count) => acc + Number(count || 0),
    0
  );

  const growthIsPositive =
    typeof revenueGrowth === "string" && revenueGrowth.trim().startsWith("+");

  const items = [
    {
      icon: ShoppingBag,
      label: "Ventas del mes",
      value: `S/. ${Number(currentMonthSales || 0).toFixed(2)}`,
    },
    {
      icon: BarChart3,
      label: "Pedidos totales",
      value: totalOrders,
    },
    {
      icon: TrendingUp,
      label: "Crecimiento de ingresos",
      value: revenueGrowth || "0%",
      valueClass: growthIsPositive ? "text-[#5eead4]" : "text-[#fca5a5]",
    },
    {
      icon: UserPlus,
      label: "Nuevos usuarios este mes",
      value: newUsersThisMonth || 0,
    },
  ];

  return (
    <article className="admin-card p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#16343a]">Resumen</h3>
          <p className="text-sm text-[#6b8a8a]">Indicadores clave del negocio</p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(toggleComponent("Orders"))}
          className="text-sm font-medium text-[#1aa89a] hover:underline whitespace-nowrap"
        >
          Ver pedidos
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-start gap-3 p-3 rounded-xl bg-[#f6f9fa] hover:bg-[#eef4f5] transition"
            >
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0">
                <Icon className="w-4 h-4 text-[#1aa89a]" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-[#8aa0a4] truncate">
                  {item.label}
                </p>
                <p
                  className={`text-base font-extrabold text-[#16343a] truncate ${
                    item.valueClass || ""
                  }`}
                >
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
};

export default MiniSummary;
