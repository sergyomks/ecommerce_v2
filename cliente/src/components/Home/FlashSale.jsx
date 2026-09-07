import { Zap } from "lucide-react";
import ProductCard from "../Products/ProductCard";
import { leerPrecio } from "../../lib/precio";

const FlashSale = ({ products = [] }) => {
  const items = products.filter((p) => leerPrecio(p).enOferta).slice(0, 12);

  if (items.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <h2 className="text-2xl md:text-[28px] font-extrabold store-ink flex items-center gap-2">
          <Zap className="w-6 h-6 fill-[#ff4d6d] text-[#ff4d6d]" />
          Promoción de los productos del día
        </h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} variant="flash" />
        ))}
      </div>
    </section>
  );
};

export default FlashSale;
