import { createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    items: [],
    loading: false,
    ids: {},
  },
  reducers: {
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setItems(state, action) {
      state.items = action.payload;
      state.ids = {};
      for (const item of action.payload) {
        state.ids[item.producto.id] = true;
      }
    },
    markInWishlist(state, action) {
      state.ids[action.payload] = true;
    },
    unmarkWishlist(state, action) {
      delete state.ids[action.payload];
      state.items = state.items.filter(
        (item) => item.producto.id !== action.payload
      );
    },
  },
});

export const fetchWishlist = () => async (dispatch) => {
  dispatch(wishlistSlice.actions.setLoading(true));
  try {
    const res = await axiosInstance.get("/wishlist");
    dispatch(wishlistSlice.actions.setItems(res.data.items || []));
  } catch {
    dispatch(wishlistSlice.actions.setItems([]));
  } finally {
    dispatch(wishlistSlice.actions.setLoading(false));
  }
};

export const toggleWishlist = (productoId) => async (dispatch, getState) => {
  const { authUser } = getState().auth;
  if (!authUser) {
    toast.info("Inicia sesión para usar la lista de deseos.");
    return;
  }

  const enLista = Boolean(getState().wishlist.ids[productoId]);
  try {
    if (enLista) {
      await axiosInstance.delete(`/wishlist/${productoId}`);
      dispatch(wishlistSlice.actions.unmarkWishlist(productoId));
      toast.success("Eliminado de la lista de deseos.");
    } else {
      await axiosInstance.post(`/wishlist/${productoId}`);
      dispatch(wishlistSlice.actions.markInWishlist(productoId));
      toast.success("Agregado a la lista de deseos.");
      dispatch(fetchWishlist());
    }
  } catch (error) {
    toast.error(
      error.response?.data?.message || "No se pudo actualizar la lista de deseos."
    );
  }
};

export const checkWishlistItem = (productoId) => async (dispatch, getState) => {
  if (!getState().auth.authUser) return;
  try {
    const res = await axiosInstance.get(`/wishlist/${productoId}/existe`);
    if (res.data.enWishlist) {
      dispatch(wishlistSlice.actions.markInWishlist(productoId));
    } else {
      dispatch(wishlistSlice.actions.unmarkWishlist(productoId));
    }
  } catch {

  }
};

export default wishlistSlice.reducer;
