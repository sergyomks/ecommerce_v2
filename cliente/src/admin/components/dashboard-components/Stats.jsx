import { useEffect, useState } from "react";
import { formatNumber } from "../../lib/helper";
import { useSelector } from "react-redux";
import { DollarSign, Wallet, TrendingUp, UserPlus, AlertTriangle } from "lucide-react";

const Stats = () => {
  const [revenueChange, setRevenueChange] = useState("");
  const {
    totalRevenueAllTime,
    todayRevenue,
    yesterdayRevenue,
    totalUsersCount,
    currentMonthSales,
    revenueGrowth,
    newUsersThisMonth,
    lowStockProducts,
  } = useSelector((state) => state.admin);

  useEffect(() => {
    if (!yesterdayRevenue) {
      setRevenueChange("");
      return;
    }
    const change = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    setRevenueChange(`${change > 0 ? "+" : ""}${change.toFixed(1)}%`);
  }, [todayRevenue, yesterdayRevenue]);

  const lowStockCount = Array.isArray(lowStockProducts) ? lowStockProducts.length : 0;

  const stats = [
    {
      title: "Ingresos de hoy",
      value: `S/. ${formatNumber(todayRevenue || 0)}`,
      change: revenueChange,
      changeLabel: "vs ayer",
      icon: DollarSign,
      iconClass: "from-[#a78bfa] to-[#7c3aed]",
    },
    {
      title: "Ingresos totales",
      value: `S/. ${formatNumber(totalRevenueAllTime || 0)}`,
      icon: Wallet,
      iconClass: "from-[#f9a8d4] to-[#ec4899]",
    },
    {
      title: "Ventas del mes",
      value: `S/. ${formatNumber(currentMonthSales || 0)}`,
      change: revenueGrowth && revenueGrowth !== "0%" ? revenueGrowth : null,
      changeLabel: "vs mes anterior",
      icon: TrendingUp,
      iconClass: "from-[#fdba74] to-[#f59e0b]",
    },
    {
      title: "Nuevos usuarios este mes",
      value: newUsersThisMonth || 0,
      hint: `${totalUsersCount || 0} usuarios totales`,
      icon: UserPlus,
      iconClass: "from-[#5eead4] to-[#0d9488]",
    },
    {
      title: "Alerta de stock bajo",
      value: lowStockCount,
      hint: lowStockCount > 0 ? "Productos requieren reposición" : "Inventario saludable",
      icon: AlertTriangle,
      iconClass: lowStockCount > 0 ? "from-[#fca5a5] to-[#ef4444]" : "from-[#86efac] to-[#22c55e]",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.title} className="admin-card p-4 sm:p-5">
            <div
              className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${stat.iconClass} text-white flex items-center justify-center mb-4 shadow-sm`}
            >
              <Icon className="w-5 h-5" strokeWidth={2} />
            </div>
            <p className="text-[13px] text-[#6b8a8a] mb-1">{stat.title}</p>
            <p className="text-[22px] font-extrabold text-[#16343a] leading-none">
              {stat.value}
            </p>
            {stat.change && (
              <p
                className={`text-xs mt-2 font-medium ${
                  stat.change.startsWith("+") ? "text-[#1aa89a]" : "text-[#e07a7a]"
                }`}
              >
                {stat.change} {stat.changeLabel || ""}
              </p>
            )}
            {stat.hint && (
              <p className="text-xs mt-2 text-[#6b8a8a]">{stat.hint}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Stats;
