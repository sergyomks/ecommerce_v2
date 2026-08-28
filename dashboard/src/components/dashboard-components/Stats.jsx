import React, { useEffect, useState } from "react";
import { formatNumber } from "../../lib/helper";
import { useSelector } from "react-redux";

const Stats = () => {
  const [revenueChange, setRevenueChange] = useState("");
  const { totalRevenueAllTime, todayRevenue, yesterdayRevenue, totalUsersCount } = useSelector((state) => state.admin);

  useEffect(() => {
    if (!yesterdayRevenue) {
      setRevenueChange("");
      return;
    }
    const change = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    setRevenueChange(`${change > 0 ? "+" : ""}${change.toFixed(2)}% de ayer`);
  }, [todayRevenue, yesterdayRevenue]);
  const stats = [
    {
      title: "Ingresos de hoy",
      value: formatNumber(todayRevenue),
      change: revenueChange,
    },
    {
      title: "Total de usuarios",
      value: totalUsersCount || 0,
      change: null
    },
    {
      title: "Ingresos totales acumulados",
      value: formatNumber(totalRevenueAllTime),
      change: null,
    }
  ]
  return <>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

      {
        stats.map((stat, index) => {
          return (
            <div key={index} className={`bg-white p-4 rounded-xl shadow-md ${index !== 1 && "flex gap-2 flex-col"}`}>
              <div className="text-sm text-gray-500">{stat.title}</div>
              <div className={`font-semibold text-xl ${index !== 1 && "text-[30px] overflow-y-hidden"}`}>
                {stat.value}
              </div>
              {stat.change && (
                <div className={`text-sm ${stat.change.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                  {stat.change} que en el periodo</div>
              )}
            </div>
          )
        })
      }
    </div>
  </>;
};

export default Stats;
