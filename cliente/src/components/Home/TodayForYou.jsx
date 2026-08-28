import { useMemo, useState } from "react";
import ProductCard from "../Products/ProductCard";

const TABS = [
  { id: "best", label: "Mas vendidos" },
  { id: "new", label: "Estilo nuevo" },
  { id: "discount", label: "Descuento especial" },
  { id: "store", label: "Tec System Store" },
  { id: "brand", label: "Productos top" },
];

const TodayForYou = ({ products = [], newProducts = [], topRated = [] }) => {
  const [tab, setTab] = useState("best");
  const catalog = products.length ? products : [...newProducts, ...topRated];

  const list = useMemo(() => {
    const source = catalog;
    if (tab === "new") return (newProducts.length ? newProducts : source).slice(0, 12);
    if (tab === "discount") {
      return [...source].sort((a, b) => Number(a.precio) - Number(b.precio)).slice(0, 12);
    }
    if (tab === "store") return source.filter((p) => Number(p.stock) > 0).slice(0, 12);
    if (tab === "brand") return (topRated.length ? topRated : source).slice(0, 12);
    return (topRated.length ? topRated : source).slice(0, 12);
  }, [tab, catalog, newProducts, topRated]);

  if (catalog.length === 0) return null;

  return (
    <section className="py-8">
      <h2 className="text-2xl md:text-[28px] font-extrabold store-ink mb-5">
        Hoy para ti!
      </h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium border transition ${
              tab === item.id
                ? "text-white border-transparent"
                : "store-surface store-text hover:opacity-90"
            }`}
            style={
              tab === item.id
                ? { background: "var(--store-ink)", borderColor: "var(--store-ink)" }
                : { borderColor: "var(--store-border)" }
            }
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4">
        {list.map((product) => (
          <ProductCard key={product.id} product={product} variant="today" />
        ))}
      </div>
    </section>
  );
};

export default TodayForYou;
