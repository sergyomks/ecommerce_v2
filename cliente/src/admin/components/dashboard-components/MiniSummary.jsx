import { useDispatch, useSelector } from "react-redux";
import { toggleComponent } from "../../store/slices/extraSlice";

const MiniSummary = () => {
  const { lowStockProducts } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const stock = Number(lowStockProducts || 0);

  return (
    <article className="relative overflow-hidden rounded-[24px] bg-admin-cta text-white p-6 min-h-[168px] shadow-[0_12px_32px_rgba(15,76,92,0.28)]">
      <p className="text-[11px] tracking-[0.18em] font-semibold text-white/70 mb-2">
        NO OLVIDES
      </p>
      <h3 className="text-[22px] font-extrabold leading-tight max-w-[220px]">
        {stock > 0
          ? `Revisar ${stock} producto${stock === 1 ? "" : "s"} con poco stock`
          : "Preparar el catálogo para la próxima semana"}
      </h3>
      <button
        type="button"
        onClick={() => dispatch(toggleComponent("Products"))}
        className="mt-5 inline-flex items-center bg-white text-[#0f4c5c] text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-white/90 transition"
      >
        Ir a productos
      </button>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-36 h-36">
        <div className="absolute right-6 top-4 w-16 h-16 rounded-2xl rotate-12 bg-gradient-to-br from-white/35 to-cyan-200/20 shadow-lg" />
        <div className="absolute right-2 top-0 w-11 h-11 rounded-full bg-gradient-to-br from-white/50 to-teal-300/30" />
        <div className="absolute right-10 bottom-4 w-12 h-12 rounded-full border-[5px] border-white/35" />
        <div className="absolute right-0 bottom-10 w-8 h-8 rounded-lg -rotate-12 bg-white/20" />
      </div>
    </article>
  );
};

export default MiniSummary;
