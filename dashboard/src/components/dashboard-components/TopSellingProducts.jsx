import React from "react";
import { useSelector } from "react-redux";

const TopSellingProducts = () => {
  const { topSellingProducts } = useSelector((state) => state.admin);

  return <>
    <div className="bg-white rounded-xl p-6 shadow-md overflow-x-auto xl:col-span-2 max-h-[400px] scrollbar-hide">
      <h2 className="text-lg font-semibold mb-2">Top Productos </h2>
      <p className="text-sm text-gray-500 mb-4">Producto con mayores ventas</p>
      <table className="min-w-[600px] w-full text-sm text-left">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-4 py-2">Imagen</th>
            <th className="px-4 py-2">Nombre</th>
            <th className="px-4 py-2">Categoria</th>
            <th className="px-4 py-2">Total de ventas</th>
            <th className="px-4 py-2">Calificacion</th>
          </tr>
        </thead>
        <tbody>
          {
            topSellingProducts.length > 0 && topSellingProducts.map((element, index) => {
              return (
                <tr key={index} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <img src={element.imagen} alt={element.nombre} className="w-12 h-12 rounded-md object-cover" />
                  </td>
                  <td className="px-4 py-3 font-medium">{element.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{element.categoria}</td>
                  <td className="px-4 py-3 font-semibold">{element.total_ventas}</td>
                  <td className="px-4 py-2 text-yellow-500 font-semibold">{element.calificacion}</td>
                </tr>
              )
            })
          }
        </tbody>
      </table>
    </div>
  </>;
};

export default TopSellingProducts;
