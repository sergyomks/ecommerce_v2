import { useSelector } from "react-redux";

const STATUS_META = [
  { key: "Delivered", label: "Entregados", color: "#1aa89a" },
  { key: "Processing", label: "En proceso", color: "#d5dde0" },
  { key: "Shipped", label: "Enviados", color: "#8ec8c3" },
  { key: "Cancelled", label: "Cancelados", color: "#e8a0a0" },
];

const OrdersChart = () => {
  const { orderStatusCounts } = useSelector((state) => state.admin);
  const counts = orderStatusCounts || {};

  const segments = STATUS_META.map((item) => ({
    ...item,
    count: Number(counts[item.key] || 0),
  }));
  const total = segments.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <article className="admin-card p-6">
      <h3 className="font-semibold text-[#16343a] mb-4">Estado de los pedidos</h3>
      <div className="flex h-3.5 rounded-full overflow-hidden bg-white/70">
        {segments.map((item) => (
          <div
            key={item.key}
            style={{
              width: `${(item.count / total) * 100}%`,
              backgroundColor: item.color,
            }}
            className="h-full first:rounded-l-full last:rounded-r-full"
            title={`${item.label}: ${item.count}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        {segments.map((item) => (
          <div key={item.key} className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-[#6b8a8a] truncate">{item.label}</span>
            </div>
            <p className="text-lg font-extrabold text-[#16343a] pl-[18px]">
              {item.count}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
};

export default OrdersChart;
