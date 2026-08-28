import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import { productImageUrl, normCat } from "../../lib/productMedia";

const BestSellingStore = ({ categorias = [], products = [] }) => {
  const uniqueCats = categorias.length
    ? categorias
    : [...new Set(products.map((p) => p.categoria).filter(Boolean))].map((nombre, i) => ({
        id: `cat-${i}`,
        nombre,
      }));

  const stores = uniqueCats.slice(0, 4).map((cat, index) => {
    const byCategory = products
      .filter((p) => normCat(p.categoria) === normCat(cat.nombre))
      .slice(0, 3);
    const fallback = products.slice(index * 3, index * 3 + 3);
    return {
      ...cat,
      items: byCategory.length ? byCategory : fallback,
    };
  });

  if (stores.length === 0) return null;

  return (
    <section className="py-8">
      <h2 className="text-2xl md:text-[28px] font-extrabold store-ink mb-5">
        Las categorías más vendidas
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.4fr] gap-4">
        <Link
          to="/products"
          className="relative min-h-[280px] lg:min-h-full overflow-hidden rounded-2xl bg-[#1A1A1A] text-white"
        >
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80"
            alt="Tec System Mall"
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="relative z-10 h-full min-h-[280px] flex flex-col justify-end p-8">
            <p className="text-3xl font-extrabold mb-2">Tec System Mall</p>
            <p className="text-white/85 max-w-xs text-sm">
              La selección oficial de la tienda. Calidad verificada y envíos a todo el Perú.
            </p>
          </div>
        </Link>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stores.map((store) => (
            <Link
              key={store.id}
              to={`/products?category=${encodeURIComponent(store.nombre)}`}
              className="store-surface rounded-2xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold store-ink">{store.nombre}</span>
                <BadgeCheck className="w-4 h-4 text-[#3B82F6] fill-[#3B82F6]" />
              </div>
              <p className="text-xs store-muted mb-3">Productos destacados de esta categoría</p>
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((slot) => {
                  const item = store.items[slot];
                  return (
                    <div key={item?.id || `${store.id}-${slot}`} className="text-center">
                      <div className="store-hero rounded-lg aspect-square overflow-hidden mb-1">
                        {item ? (
                          <img
                            src={productImageUrl(item)}
                            alt={item.nombre}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : null}
                      </div>
                      <p className="text-[11px] font-semibold store-ink">
                        {item ? `S/. ${Number(item.precio || 0).toFixed(0)}` : "—"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BestSellingStore;
