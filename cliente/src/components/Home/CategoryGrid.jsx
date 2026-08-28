import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategorias } from "../../store/slices/categorySlice";

const CategoryGrid = () => {
  const dispatch = useDispatch();
  const { categorias, loading } = useSelector((state) => state.category);

  useEffect(() => {
    dispatch(fetchCategorias());
  }, [dispatch]);

  return (
    <section className="py-10">
      {loading && categorias.length === 0 ? (
        <p className="text-center text-[#6B7280]">Cargando categorías...</p>
      ) : (
        <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide justify-start lg:justify-between pb-2">
          {categorias.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${encodeURIComponent(category.nombre)}`}
              className="shrink-0 flex flex-col items-center w-[80px] group"
            >
              <div className="w-[72px] h-[72px] rounded-full store-surface shadow-sm border overflow-hidden flex items-center justify-center mb-2 group-hover:shadow-md transition-shadow" style={{ borderColor: "var(--store-border)" }}>
                <img
                  src={category.imagen?.url || "/placeholder.svg"}
                  alt={category.nombre}
                  className="w-10 h-10 object-contain"
                />
              </div>
              <span className="text-xs text-center store-text font-medium leading-tight">
                {category.nombre}
              </span>
            </Link>
          ))}
          <Link to="/products" className="shrink-0 flex flex-col items-center w-[80px] group">
            <div className="w-[72px] h-[72px] rounded-full store-surface shadow-sm border flex items-center justify-center mb-2 group-hover:shadow-md transition-shadow" style={{ borderColor: "var(--store-border)" }}>
              <LayoutGrid className="w-7 h-7 store-text" />
            </div>
            <span className="text-xs text-center store-text font-medium leading-tight">
              Todas
            </span>
          </Link>
        </div>
      )}
    </section>
  );
};

export default CategoryGrid;
