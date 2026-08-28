import React from "react";
import {
  Wallet,
  PackageCheck,
  TrendingUp,
  AlertTriangle,
  BarChart4,
  UserPlus,
} from "lucide-react";
import { useSelector } from "react-redux";

const MiniSummary = () => {
  const { topSellingProducts, lowStockProducts, revenueGrowth, newUsersThisMonth, currentMonthSales, orderStatusCounts } = useSelector((state) => state.admin);
  let totalOrders = 0;
  totalOrders = Object.values(orderStatusCounts).reduce((acc, count) => acc + count, 0);

  const resumen = [
    {
      text: "Venta total del mes",
      subText: `Las ventas de este mes: S/. ${currentMonthSales.toFixed(2)}`,
      icon: <Wallet className="text-green-600" />,
    },
    {
      text: "Total de pedidos realizados",
      subText: `Total de pedidos realizados con exito: ${totalOrders}`,
      icon: <PackageCheck className="text-blue-600" />,
    },
    {
      text: "Top ventas de productos",
      subText: `la mejor venta: ${topSellingProducts[0]?.nombre}(${topSellingProducts[0]?.total_ventas})con exito`,
      icon: <TrendingUp className="text-emerald-600" />,
    },
    {
      text: "Alerta de productos con poco stock",
      subText: `Productos con bajo stock: ${lowStockProducts}`,
      icon: <AlertTriangle className="text-red-600" />,
    },
    {
      text: "tasa de crecimiento de los ingresos",
      subText: `ingreso: ${revenueGrowth.includes("+") ? "arriba" : "abajo"} para ${revenueGrowth} en comparación con el mes pasado`,
      icon: <BarChart4 className="text-purple-600" />,
    },
    {
      text: "Nuevos usuarios este mes",
      subText: `Nuevos usuarios este mes: ${newUsersThisMonth}`,
      icon: <UserPlus className="text-yellow-600" />,
    }
  ]
  return <>
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-lg font-semibold mb-2">Resumen</h2>

      <p className="text-sm text-gray-500 mb-4">Resumen de todos los aspectos mas relevantes</p>
      <div>
        {
          resumen.map((item, index) => {
            return (
              <div key={index} className="flex items-center space-x-3">
                {item.icon}
                <div >
                  <p className="text-sm">{item.text}</p>
                  <p className="text-gray-500 text-sm">{item.subText}</p>
                </div>
              </div>
            )
          })
        }
      </div>
    </div>
  </>;
};

export default MiniSummary;
