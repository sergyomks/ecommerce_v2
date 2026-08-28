import { createSlice, current } from "@reduxjs/toolkit";

const CART_STORAGE_KEY = "ecommerce_cart";

const loadCartFromStorage = () => {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const validos = parsed.filter(
      (item) =>
        item?.producto?.id &&
        item?.variante?.id &&
        typeof item.cantidad === "number" &&
        item.cantidad > 0
    );

    if (validos.length !== parsed.length) {
      console.info(
        "Se descartaron líneas del carrito guardadas antes de que existieran las tallas."
      );
    }

    return validos;
  } catch {
    console.warn("No se pudo leer el carrito desde localStorage.");
    return [];
  }
};

const persistCart = (cart) => {
  if (typeof window === "undefined") return;

  try {
    if (!cart.length) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn("No se pudo guardar el carrito en localStorage:", error);
  }
};

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: loadCartFromStorage(),
  },
  reducers: {

    addToCart: (state, action) => {
      const { producto, variante, cantidad } = action.payload;
      if (!variante?.id) {
        console.warn("addToCart sin variante: la línea se ignora.");
        return;
      }

      const existente = state.cart.find(
        (item) => item.variante?.id === variante.id
      );

      const tope = Number(variante.stock ?? Infinity);

      if (existente) {
        existente.cantidad = Math.min(existente.cantidad + cantidad, tope);
      } else {
        state.cart.push({ producto, variante, cantidad: Math.min(cantidad, tope) });
      }
      persistCart(current(state).cart);
    },
    removeFromCart: (state, action) => {
      const idVariante = action.payload?.id || action.payload;
      state.cart = state.cart.filter((item) => item.variante?.id !== idVariante);
      persistCart(current(state).cart);
    },
    updateCart: (state, action) => {
      const { id, cantidad } = action.payload;
      const existente = state.cart.find((item) => item.variante?.id === id);
      if (existente) {
        const tope = Number(existente.variante?.stock ?? Infinity);
        existente.cantidad = Math.max(1, Math.min(cantidad, tope));
      }
      persistCart(current(state).cart);
    },
    clearCart: (state) => {
      state.cart = [];
      persistCart([]);
    },
  },
});

export const { addToCart, removeFromCart, updateCart, clearCart } =
  cartSlice.actions;

export default cartSlice.reducer;
