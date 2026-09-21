import { X, Plus, Minus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { removeFromCart, updateCart } from "../../store/slices/cartSlice";
import { toggleCart } from "../../store/slices/popupSlice";
import { toast } from "react-toastify";
import { formatearSoles, precioLinea, etiquetaVariante } from "../../lib/precio";

const CartSidebar = () => {
  const dispatch = useDispatch();
  const { isCartOpen } = useSelector((state) => state.popup);
  const { cart } = useSelector((state) => state.cart);
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
    total = cart.reduce((sum, item) => sum + precioLinea(item) * item.cantidad, 0);
  }
  if (!isCartOpen) return null;

  return <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => dispatch(toggleCart())}>
    </div>
    <div className="fixed right-0 top-0 h-full w-full sm:w-96 z-50 store-surface shadow-xl animate-slide-in-right overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--store-border)" }}>
        <h2 className="text-xl font-semibold store-text">Carrito de compras</h2>
        <button onClick={() => dispatch(toggleCart())} className="p-2 rounded-lg store-hover">
          <X className="w-5 h-5 text-primary"></X>
        </button>
      </div>
      <div className="p-6">
        {
          cart && cart.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">El carrito esta vacio</p>
              <Link to="/products" onClick={() => dispatch(toggleCart())}
                className="mt-4 inline-block store-btn"
              >
                ver productos
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cart && cart.map((item) => {
                  return (
                    <div key={item.variante?.id ?? item.producto.id} className="store-card p-4">
                      <div className="flex items-start space-x-4">
                        <Link to={`/product/${item.producto.id}`} onClick={() => dispatch(toggleCart())} className="flex-shrink-0">
                          <img src={item.producto.imagenes?.[0]?.url || item.producto.imagenes?.[0] || "/placeholder.svg"} alt={item.producto.nombre} className="w-16 h-16 object-cover rounded-lg hover:opacity-80 transition-opacity" />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link to={`/product/${item.producto.id}`} onClick={() => dispatch(toggleCart())} className="hover:text-primary transition-colors">
                            <h3 className="font-semibold text-foreground truncate">{item.producto.nombre}</h3>
                          </Link>
                          {etiquetaVariante(item.variante) && (
                            <p className="text-xs text-muted-foreground">{etiquetaVariante(item.variante)}</p>
                          )}
                          <p className="text-muted-foreground">{formatearSoles(precioLinea(item))}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <button disabled={item.cantidad === 1} onClick={() => updateQuantity(item.variante?.id, item.cantidad - 1)} className="p-1 rounded-md glass-card hover:glow-on-hover animate-smooth">
                              <Minus className="w-4 h-4 " />
                            </button>
                            <span className="w-8 text-center font-semibold">{item.cantidad}</span>
                            <button onClick={() => updateQuantity(item.variante?.id, item.cantidad + 1)} className="p-1 rounded-md glass-card hover:glow-on-hover animate-smooth">
                              <Plus className="w-4 h-4" />
                            </button>
                            <button onClick={() => dispatch(removeFromCart({ id: item.variante?.id }))} className="p-1 rounded-md glass-card hover:glow-on-hover animate-smooth ml-2 text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  )
                })}
              </div>

              <div className="border-t border-[hsla(var(--glass-border))] pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Total: </span>
                  <span className="text-xl font-bold text-primary">S/.{total.toFixed(2)}</span>
                </div>

                <Link to="/cart" onClick={() => dispatch(toggleCart())}
                  className="w-full py-3 text-center block store-btn"
                >
                  ver carrito y finalizar compra
                </Link>

              </div>
            </>
          )
        }

      </div>
    </div>
  </>;
};

export default CartSidebar;
