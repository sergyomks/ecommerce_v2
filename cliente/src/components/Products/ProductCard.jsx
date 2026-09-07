import React from "react";
import { Heart, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleWishlist } from "../../store/slices/wishlistSlice";
import { productImageUrl } from "../../lib/productMedia";
import { leerPrecio, formatearSoles } from "../../lib/precio";

const ProductCard = ({ product, variant = "today" }) => {
  const dispatch = useDispatch();
  const enLista = useSelector((state) => Boolean(state.wishlist.ids[product.id]));
  const stock = Number(product.stock || 0);
  const { actual, anterior, enOferta, porcentaje } = leerPrecio(product);
  const ratingRaw = product.calificaciones;
  const ratingNum = Number(
    typeof ratingRaw === "object" ? ratingRaw?.promedio : ratingRaw || 0
  );
  const totalResenas = Number(
    typeof ratingRaw === "object"
      ? ratingRaw?.total_resenas
      : product.review_count ?? 0
  ) || 0;

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleWishlist(product.id));
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block store-surface rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="relative overflow-hidden store-hero rounded-2xl">
        <img
          src={productImageUrl(product)}
          alt={product.nombre}
          className="w-full h-40 sm:h-48 xl:h-52 object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
        {enOferta && (
          <span
            className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-sm flex items-center gap-1"
            style={{ background: "#ff4d6d" }}
          >
            <Zap className="w-3 h-3 fill-white" />
            ¡En promoción! -{porcentaje}%
          </span>
        )}
        {!enOferta && stock === 0 && (
          <span className="absolute top-3 left-3 z-10 px-2 py-1 rounded-full text-[11px] font-semibold store-surface store-muted shadow-sm">
            Agotado
          </span>
        )}
        <button
          type="button"
          onClick={handleWishlist}
          className="absolute top-3 right-3 w-8 h-8 rounded-full store-surface flex items-center justify-center shadow-sm"
          aria-label="Lista de deseos"
        >
          <Heart
            className={`w-4 h-4 ${enLista ? "fill-[#ff4d6d] text-[#ff4d6d]" : "text-[#9CA3AF]"}`}
          />
        </button>
      </div>
      <div className="p-3">
        <h3 className="text-sm store-text mb-2 line-clamp-2 min-h-[2.5rem] leading-snug font-medium">
          {product.nombre}
        </h3>
        {variant === "flash" ? (
          <>
            <div className="flex items-baseline flex-wrap gap-2 mb-2">
              <span className="text-[15px] font-bold store-ink">{formatearSoles(actual)}</span>
              {anterior !== null && (
                <span className="text-xs store-muted line-through">{formatearSoles(anterior)}</span>
              )}
            </div>
            <p className="text-[11px] store-muted">
              {stock > 0 ? `${stock} disponible${stock === 1 ? "" : "s"}` : "Agotado"}
            </p>
          </>
        ) : (
          <>
            {totalResenas > 0 ? (
              <p className="text-[11px] store-muted flex items-center gap-1 mb-2">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {ratingNum.toFixed(1)} · {totalResenas} reseña{totalResenas === 1 ? "" : "s"}
              </p>
            ) : (
              <p className="text-[11px] store-muted mb-2">Sin reseñas todavía</p>
            )}
            <div className="flex items-baseline flex-wrap gap-2">
              <span className="text-[15px] font-bold store-ink">{formatearSoles(actual)}</span>
              {anterior !== null && (
                <span className="text-xs store-muted line-through">{formatearSoles(anterior)}</span>
              )}
            </div>
          </>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
