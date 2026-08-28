import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Plus,
  Minus,
  Loader,
  HandCoins,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { obtenerDetallesProducto } from "../store/slices/productSlice.js";
import { addToCart } from "../store/slices/cartSlice";
import SelectorVariante from "../components/Products/SelectorVariante";
import { axiosInstance } from "../lib/axios";
import { leerPrecio, formatearSoles } from "../lib/precio";
import {
  toggleWishlist,
  checkWishlistItem,
} from "../store/slices/wishlistSlice";
import { toast } from "react-toastify";
import ReviewsContainer from "../components/Products/ReviewsContainer";

const ProductDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  const producto = useSelector((state) => state.product?.productDetails);
  const { loading } = useSelector((state) => state.product);
  const { authUser } = useSelector((state) => state.auth);
  const enWishlist = useSelector((state) => Boolean(state.wishlist.ids[id]));
  const [selectedImage, setSelectedImage] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [activeTab, setActiveTab] = useState("Descripcion");
  const [variantes, setVariantes] = useState([]);
  const [variante, setVariante] = useState(null);

  const stockDisponible = Number(variante?.stock ?? 0);
  const precios = producto ? leerPrecio(producto) : null;

  const paraCarrito = () => ({
    id: producto.id,
    nombre: producto.nombre,
    precio: producto.precio,
    precio_efectivo: producto.precio_efectivo,
    en_oferta: producto.en_oferta,
    imagenes: producto.imagenes,
  });

  const varianteParaCarrito = () => ({
    id: variante.id,
    talla: variante.talla,
    color: variante.color,
    color_hex: variante.color_hex ?? null,
    stock: Number(variante.stock),
  });

  const handleAddToCart = () => {
    if (!variante) return;
    dispatch(addToCart({ producto: paraCarrito(), variante: varianteParaCarrito(), cantidad }));
  }

  const handleCopyURL = () => {
    const currentURL = window.location.href;

    navigator.clipboard.writeText(currentURL).then(() => {
      toast.success("URL copiado al portapapeles", currentURL);
    })
      .catch((error) => {
        toast.error("Error al copiar URL", error);
      });
  }

  const navigateTo = useNavigate();
  const handleComprarAhora = () => {
    if (!variante) return;
    dispatch(addToCart({ producto: paraCarrito(), variante: varianteParaCarrito(), cantidad }));
    navigateTo("/payment");
  }

  useEffect(() => {
    dispatch(obtenerDetallesProducto(id));
  }, [dispatch, id]);

  useEffect(() => {
    let cancelado = false;
    axiosInstance
      .get(`/producto/${id}/variantes`)
      .then(({ data }) => {
        if (!cancelado) setVariantes(data.variantes || []);
      })
      .catch(() => {
        if (!cancelado) setVariantes([]);
      });
    return () => { cancelado = true; };
  }, [id]);

  useEffect(() => {
    setCantidad((c) => Math.max(1, Math.min(c, Number(variante?.stock ?? 1))));
  }, [variante]);

  useEffect(() => {
    if (authUser && id) {
      dispatch(checkWishlistItem(id));
    }
  }, [authUser, id, dispatch]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  if (!producto?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Producto no encontrado</h1>
          <p className="text-muted-foreground">El producto que buscas no existe o ha sido eliminado.</p>

        </div>
      </div>
    );
  }
  return <>
    <div className="min-h-screen">
      <div className="store-wrap py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.95fr] xl:grid-cols-[1.35fr_0.9fr] gap-8 xl:gap-12 mb-16">
          <div>
            <div className="store-surface rounded-2xl p-3 sm:p-5 mb-4">
              {producto.imagenes && producto.imagenes.length > 0 ? (
                <img
                  src={producto.imagenes[selectedImage]?.url}
                  alt={producto.nombre}
                  className="w-full h-[420px] sm:h-[500px] lg:h-[560px] xl:h-[640px] object-contain rounded-xl store-hero"
                />
              ) : (
                <div className="h-[420px] sm:h-[500px] lg:h-[560px] xl:h-[640px] animate-pulse rounded-xl store-hero" />
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide">
              {producto.imagenes && producto.imagenes.length > 0 && producto.imagenes.map((imagen, index) => {
                return (
                  <button key={index} onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden rounded-xl border-2 store-surface transition-all ${selectedImage === index ? 'border-primary' : 'border-transparent'}`}
                  >
                    <img
                      src={imagen?.url}
                      alt={`${producto.nombre} ${index + 1}`}
                      className="w-full h-full object-contain p-1"
                    />
                  </button>
                )
              }
              )}
            </div>
          </div>
          <div>
            <div className="mb-4 ">
              <div className="flex space-x-2 mb-4">
                {new Date() - new Date(producto.fechas?.creacion) <
                  30 * 24 * 60 * 60 * 1000 && (
                    <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded">
                      Nuevo
                    </span>
                  )}
                {parseFloat(producto.calificaciones?.promedio || 0) > 4.5 && (
                  <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-rose-500 text-white bg-primary  text-primary-foreground text-xs font-semibold rounded">
                    Top Calificación
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{producto.nombre}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => {
                    return (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < Math.floor(producto.calificaciones?.promedio || 0) ? "fill-current text-yellow-400 " : "text-gray-300"}`}
                      />
                    )

                  })}
                </div>
                <span className="text-foreground font-medium">{producto.calificaciones?.promedio?.toFixed(1) || "0.0"}</span>
                <span className="text-muted-foreground">({producto.calificaciones?.total_resenas || 0} opiniones)</span>
              </div>
              <div className="flex items-baseline flex-wrap gap-3 mb-6">
                <span className="text-2xl font-bold text-primary">
                  {formatearSoles(precios?.actual)}
                </span>
                {precios?.anterior !== null && precios?.anterior !== undefined && (
                  <>
                    <span className="text-base line-through opacity-60">
                      {formatearSoles(precios.anterior)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white bg-[#ff4d6d]">
                      -{precios.porcentaje}%
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-muted-foreground">Categoria: {producto.categoria}</span>
                <span className={`px-3 py-1 rounded text-sm ${stockDisponible > 5 ? "bg-green-500/20 text-green-400" : stockDisponible > 0 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                  {stockDisponible > 5 ? "En Stock" : stockDisponible > 0 ? "Pocas Unidades" : "Agotado"}
                </span>
              </div>
            </div>

            <div className="store-card p-6 mb-6">
              <div className="mb-6">
                <SelectorVariante variantes={variantes} onCambio={setVariante} />
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <span className="text-lg font-medium">Cantidad:</span>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="p-2 glass-card hover:glow-on-hover animate-smooth"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-semibold text-lg">
                    {cantidad}
                  </span>
                  <button
                    onClick={() =>
                      setCantidad(Math.min(stockDisponible || 1, cantidad + 1))
                    }
                    disabled={cantidad >= stockDisponible}
                    className="p-2 glass-card hover:glow-on-hover animate-smooth disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!variante || stockDisponible === 0}
                  className="store-btn disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Agregar al carrito</span>
                </button>
                <button
                  disabled={!variante || stockDisponible === 0}
                  className="py-3 bg-secondary text-foreground border border-border rounded-lg hover:bg-accent animate-smooth font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleComprarAhora}
                >

                  <span>Comprar Ahora</span>
                </button>
              </div>
              <div className="flex items-center space-x-4 mt-4">
                <button
                  type="button"
                  onClick={() => dispatch(toggleWishlist(producto.id))}
                  className={`flex items-center space-x-2 animate-smooth ${
                    enWishlist
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${enWishlist ? "fill-current" : ""}`}
                  />
                  <span>
                    {enWishlist
                      ? "En la lista de deseos"
                      : "Agregar a la lista de deseos"}
                  </span>
                </button>
                <button onClick={handleCopyURL} className="flex items-center space-x-2 text-muted-foreground hover:text-primary animate-smooth">
                  <Share2 className="w-5 h-5" />
                  <span>Compartir</span>
                </button>
              </div>
            </div>
          </div>

        </div>
        <div className="glass-panel">
          <div className="flex border-b border-[hsla(var(--glass-border))] mb-6">
            {["Descripcion", "Opiniones"].map((tab) => {
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`py-4 px-6 font-medium capitalize transition-all ${activeTab === tab ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  {tab}
                </button>
              )
            })}

          </div>
          <div className="p-6">
            {
              activeTab === "Descripcion" && (
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">Descripcion de Producto</h3>
                  <p className="text-muted-foreground leading-relaxed">{producto.descripcion}</p>
                </div>
              )
            }
            {activeTab === "Opiniones" && (
              <>
                <ReviewsContainer producto={producto} productReviews={producto.resenas} />
              </>
            )
            }
          </div>
        </div>
      </div>
    </div>
  </>;
};

export default ProductDetail;
