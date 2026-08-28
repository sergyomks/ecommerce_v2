import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchWishlist,
  toggleWishlist,
} from "../store/slices/wishlistSlice";
import { addToCart } from "../store/slices/cartSlice";
import { toast } from "react-toastify";

const Wishlist = () => {
  const dispatch = useDispatch();
  const { authUser } = useSelector((state) => state.auth);
  const { items, loading } = useSelector((state) => state.wishlist);

  useEffect(() => {
    if (authUser) dispatch(fetchWishlist());
  }, [authUser, dispatch]);

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-panel max-w-md p-8">
          <Heart className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Lista de deseos</h1>
          <p className="text-muted-foreground mb-4">
            Inicia sesión para ver y guardar tus productos favoritos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="store-wrap py-8">
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Mi lista de deseos
        </h1>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : items.length === 0 ? (
          <div className="glass-panel text-center p-10">
            <p className="text-muted-foreground mb-4">
              Todavía no tienes productos en tu lista.
            </p>
            <Link
              to="/products"
              className="inline-block px-6 py-3 gradient-primary text-primary-foreground rounded-lg font-semibold"
            >
              Explorar productos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(({ producto }) => (
              <div key={producto.id} className="glass-card p-4">
                <Link to={`/product/${producto.id}`}>
                  <img
                    src={producto.imagenes?.[0]?.url || "/placeholder.svg"}
                    alt={producto.nombre}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="font-semibold text-foreground mb-1">
                    {producto.nombre}
                  </h3>
                </Link>
                <p className="text-primary font-bold mb-4">
                  S/ {Number(producto.precio).toFixed(2)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      dispatch(addToCart({ producto, cantidad: 1 }));
                      toast.success("Agregado al carrito");
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 gradient-primary text-primary-foreground rounded-lg"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Carrito
                  </button>
                  <button
                    onClick={() => dispatch(toggleWishlist(producto.id))}
                    className="px-3 py-2 bg-secondary rounded-lg hover:bg-accent"
                    title="Quitar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
