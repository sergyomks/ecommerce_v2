import { useEffect, useState } from "react";
import { Zap } from "lucide-react";
import ProductCard from "../Products/ProductCard";

const pad = (n) => String(n).padStart(2, "0");

const nextMidnight = () => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return end;
};

const FlashSale = ({ products = [] }) => {
  const [remain, setRemain] = useState({ h: "00", m: "00", s: "00" });
  const items = products.slice(0, 12);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, nextMidnight() - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemain({ h: pad(h), m: pad(m), s: pad(s) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="py-8">
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl md:text-[28px] font-extrabold store-ink flex items-center gap-2">
            <Zap className="w-6 h-6 fill-[#ff4d6d] text-[#ff4d6d]" />
            Promoción de los productos del día
          </h2>
          <div className="flex items-center gap-1.5 text-white font-bold text-sm">
            <span className="bg-[#ff4d6d] rounded-md w-9 h-9 inline-flex items-center justify-center">
              {remain.h}
            </span>
            <span className="store-ink font-extrabold">:</span>
            <span className="bg-[#ff4d6d] rounded-md w-9 h-9 inline-flex items-center justify-center">
              {remain.m}
            </span>
            <span className="store-ink font-extrabold">:</span>
            <span className="bg-[#ff4d6d] rounded-md w-9 h-9 inline-flex items-center justify-center">
              {remain.s}
            </span>
          </div>
        </div>
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
