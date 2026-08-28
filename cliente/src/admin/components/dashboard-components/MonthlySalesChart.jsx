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
      totalVentas: found?.totalSales || 0,
    };
  });
  return (
    <article className="admin-card p-5">
      <h3 className="font-semibold text-[#16343a] mb-3">Ventas del mes</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={filled}>
          <XAxis dataKey="month" tick={{ fill: "#6b8a8a", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#6b8a8a", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip />
          <Line type="monotone" dataKey="totalVentas" stroke="#1aa89a" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </article>
  );
};

export default MonthlySalesChart;
