import { useSelector } from "react-redux";
import {
  XAxis,
  YAxis,
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getLastNMonths } from "../../lib/helper";

const MonthlySalesChart = () => {
  const { monthlySales } = useSelector((state) => state.admin);
  const months = getLastNMonths(4).map((m) => m.month);
  const filled = months.map((m) => {
    const found = monthlySales?.find((item) => item.month === m);
    return {
      month: m,
      totalVentas: found?.totalSales|| 0
    }
  });
  return <>
    <div className="bg-white p-4 rouded-xl shadow-md">
      <h3 className="font-semibold mb-2"> Ventas del mes</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={filled}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="totalVentas"
            stroke="#10b981"

          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </>;
};

export default MonthlySalesChart;
