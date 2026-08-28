import { useDispatch, useSelector } from "react-redux";
import { toggleComponent } from "../../store/slices/extraSlice";

const FeaturedDuel = () => {
  const { topSellingProducts } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const first = topSellingProducts?.[0];
  const second = topSellingProducts?.[1];

  return (
    <article className="admin-card p-6">
      <div className="flex items-start justify-between gap-3 mb-6">
        <p className="text-sm text-[#6b8a8a]">
          Top ventas · los dos productos más vendidos
        </p>
        <button
          type="button"
          onClick={() => dispatch(toggleComponent("Products"))}
          className="text-sm font-medium text-[#1aa89a] hover:underline whitespace-nowrap"
        >
          Ver productos
        </button>
      </div>
      <div className="flex items-center justify-between gap-3 sm:gap-6 px-2 sm:px-8 py-2">
        <ProductSide product={first} fallback="Producto 1" />
        <div className="shrink-0 w-11 h-11 rounded-full bg-[#e07a7a] text-white text-xs font-bold uppercase flex items-center justify-center shadow-md">
          vs
        </div>
        <ProductSide product={second} fallback="Producto 2" />
      </div>
    </article>
  );
};

const ProductSide = ({ product, fallback }) => (
  <div className="flex-1 flex flex-col items-center text-center min-w-0">
    <div className="w-[88px] h-[88px] sm:w-28 sm:h-28 rounded-full bg-white/80 border border-white shadow-inner overflow-hidden mb-3">
      {product?.imagen ? (
        <img
          src={product.imagen}
          alt={product.nombre}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-[#e8eef0]" />
      )}
    </div>
    <p className="font-semibold text-[#16343a] truncate w-full">
      {product?.nombre || fallback}
    </p>
    <p className="text-xs text-[#6b8a8a] mt-0.5">
      {product ? `${product.total_ventas} ventas` : "Sin datos"}
    </p>
  </div>
);

export default FeaturedDuel;
