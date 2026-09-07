import { useSelector } from "react-redux";

const TopSellingProducts = () => {
  const { topSellingProducts } = useSelector((state) => state.admin);
  const rows = topSellingProducts?.slice(0, 6) || [];

  return (
    <article className="admin-card p-6 overflow-hidden flex-1">
      <h2 className="text-lg font-semibold text-[#16343a] mb-1">Ranking de productos</h2>
      <p className="text-sm text-[#6b8a8a] mb-4">Los más vendidos de la tienda</p>
      <div className="overflow-x-auto scrollbar-hide">
        <table className="min-w-[520px] w-full text-sm text-left">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-[#8aa0a4]">
              <th className="px-2 py-2 font-medium">#</th>
              <th className="px-2 py-2 font-medium">Producto</th>
              <th className="px-2 py-2 font-medium">Cat.</th>
              <th className="px-2 py-2 font-medium">Ventas</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((element, index) => (
                <tr key={element.id || element.nombre || index} className="border-b border-[#edf2f3] last:border-0">
                  <td className="px-2 py-3 text-[#8aa0a4] font-medium">{index + 1}</td>
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={element.imagen}
                        alt={element.nombre}
                        className="w-8 h-8 rounded-full object-cover bg-white"
                      />
                      <span className="font-medium text-[#16343a] truncate">
                        {element.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-3 text-[#6b8a8a]">{element.categoria}</td>
                  <td className="px-2 py-3 font-semibold text-[#16343a]">
                    {element.total_ventas}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-2 py-6 text-sm text-[#6b8a8a]">
                  Todavía no hay productos con ventas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
};

export default TopSellingProducts;
