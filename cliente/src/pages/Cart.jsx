import { useEffect, useState } from "react";
import { Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { removeFromCart, updateCart } from "../store/slices/cartSlice";
import { toast } from "react-toastify";
import { axiosInstance } from "../lib/axios";
import { extraerIgv } from "../lib/igv";
import { formatearSoles, precioLinea, etiquetaVariante } from "../lib/precio";

const Cart = () => {
  const dispatch = useDispatch();
  const { cart } = useSelector((state) => state.cart);
  const { authUser } = useSelector((state) => state.auth);
  const [umbralGratis, setUmbralGratis] = useState(50);
  const [precioDefault, setPrecioDefault] = useState(2);

  useEffect(() => {
    axiosInstance
      .get("/envio/config")
      .then((res) => {
        setUmbralGratis(Number(res.data.umbral_gratis) || 50);
        setPrecioDefault(Number(res.data.precio_default) || 2);
      })
      .catch(() => {});
  }, []);

  const updateQuantity = (id, cantidad) => {
    if (cantidad <= 0) {
      dispatch(removeFromCart({ id }));
      return;
    }
    const item = cart.find((linea) => linea.variante?.id === id);
    const disponible = Number(item?.producto?.stock);
    if (Number.isFinite(disponible) && cantidad > disponible) {
      toast.warning(`Solo quedan ${disponible} unidades disponibles.`);
      return;
    }
    dispatch(updateCart({ id, cantidad }));
  };
  let total = 0;
  if (cart) {
    total = cart.reduce(
      (sum, item) => sum + precioLinea(item) * item.cantidad,
      0
    );
  }
  let cartItemCount = 0;
  if (cart) {
    cartItemCount = cart.reduce((acc, item) => acc + item.cantidad, 0);
  }

  const igv = extraerIgv(total);
  const precioEnvio = total >= umbralGratis ? 0 : precioDefault;
  const totalFinal = Math.round((total + precioEnvio) * 100) / 100;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-panel max-w-md p-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            El carrito esta vacio
          </h1>
          <p className="text-muted-foreground mb-6">
            Parece que no has agregado ningun producto
          </p>
          <Link
            to="/products"
            className=" inline-flex items-center space-x-2 px-6 py-3 gradient-primary text-primary-foreground rounded-lg hover:glow-on-hover animate-smooth font-semibold"
          >
            <span>Continuar comprando</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen">
        <div className="store-wrap py-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Tu carrito de compras
            </h1>
            <p className="text-muted-foreground">
              {cartItemCount} Producto{cartItemCount !== 1 ? "s" : ""} en tu
              carrito
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => {
                return (
                  <div key={item.variante?.id ?? item.producto.id} className="glass-card p-6">
                    <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                      <Link
                        to={`/product/${item.producto.id}`}
                        className="flex-shrink-0 w-24 h-24"
                      >
                        <img
                          src={
                            item.producto.imagenes?.[0]?.url ||
                            item.producto.imagenes?.[0] ||
                            "/placeholder.svg"
                          }
                          alt={item.producto.nombre}
                          className="w-24 h-24 object-cover rounded-lg hover:scale-105 transition-transform"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/product/${item.producto.id}`}
                          className="block hover:text-primary transition-colors"
                        >
                          <h3 className="text-lg font-semibold text-foreground mb-1">
                            {item.producto.nombre}
                          </h3>
                        </Link>
                        <p className="text-muted-foreground text-sm mb-2">
                          Categoria: {item.producto.categoria}
                        </p>
                        {etiquetaVariante(item.variante) && (
                          <p className="text-sm mb-2 flex items-center gap-2">
                            {item.variante?.color_hex && (
                              <span
                                className="inline-block h-3.5 w-3.5 rounded-full border border-black/20"
                                style={{ background: item.variante.color_hex }}
                              />
                            )}
                            <span className="font-medium">{etiquetaVariante(item.variante)}</span>
                          </p>
                        )}
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-primary">
                            {formatearSoles(precioLinea(item))}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            disabled={item.cantidad === 1}
                            onClick={() =>
                              updateQuantity(
                                item.variante?.id,
                                item.cantidad - 1
                              )
                            }
                            className="p-2 glass-card hover:glow-on-hover animate-smooth"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center font-semibold text-lg">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.variante?.id,
                                item.cantidad + 1
                              )
                            }
                            className="p-2 glass-card hover:glow-on-hover animate-smooth"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() =>
                            dispatch(removeFromCart(item.producto.id))
                          }
                          className="p-2 glass-card text-destructive hover:glow-on-hover animate-smooth"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-foreground">
                          S/.
                          {(item.producto.precio * item.cantidad).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="lg:col-span-1">
              <div className="glass-panel sticky top-24">
                <h2 className="text-xl font-semibold text-foreground mb-6">
                  Resumen del pedido
                </h2>
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Subtotal({cartItemCount} productos):
                    </span>
                    <span className="text-foreground font-semibold">
                      S/.{total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Envio:</span>
                    <span className="text-green-500 font-semibold">
                      {precioEnvio === 0
                        ? `Gratis (≥ S/${umbralGratis})`
                        : `S/.${precioEnvio.toFixed(2)}*`}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    *Estimado. El costo final depende del departamento en el
                    checkout.
                  </p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      IGV (18% incluido)
                    </span>
                    <span className="font-semibold">S/.{igv.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-[hsla(var(--glass-border))] pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold">Total: </span>
                      <span>S/.{totalFinal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                {authUser ? (
                  <Link
                    to="/payment"
                    className="w-full flex items-center justify-center space-x-2 px-6 py-3 gradient-primary text-primary-foreground rounded-lg hover:glow-on-hover animate-smooth font-semibold"
                  >
                    <span>Proceder al pago</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    Inicia sesión para continuar al pago
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Cart;
