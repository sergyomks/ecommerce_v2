import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";
import { toggleAIModal } from "./popupSlice";
import { normalizeProduct } from "../../lib/productMedia";

export const buscarTodosProductos = createAsyncThunk(
  "product/buscarTodosProductos",
  async ({
    disponible = "", precio = "0-20000",
    categoria = "", calificaciones = "", buscar = "",
    pagina = 1, limite = ""
  } = {}, thunkAPI) => {
    try {
      const params = new URLSearchParams();
      if (disponible) params.append("disponibilidad", disponible);
      if (precio) params.append("precio", precio);
      if (categoria) params.append("categoria", categoria);
      if (calificaciones) params.append("calificaciones", calificaciones);
      if (buscar) params.append("buscar", buscar);
      if (pagina) params.append("pagina", pagina);
      if (limite) params.append("limite", limite);

      const res = await axiosInstance.get(`/producto?${params.toString()}`, {
        signal: thunkAPI.signal,
      });
      return res.data;

    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Error al buscar productos");
    }
  }

);

export const obtenerDetallesProducto = createAsyncThunk(
  "product/obtenerProducto",
  async (id, thunkAPI) => {

    try {
      const res = await axiosInstance.get(`/producto/${id}`);
      return res.data.producto;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Error al obtener detalles del producto");
    }
  }
);

export const publicarResenaProducto = createAsyncThunk(
  "product/publicar-resena/resena",
  async ({ productoId, resena }, thunkAPI) => {
    const state = thunkAPI.getState();
    const authUser = state.auth.authUser;
    try {
      const res = await axiosInstance.put(`/producto/publicar-resena/${productoId}`, resena);
      toast.success(res.data.message);
      return {
        review: res.data.resena,
        authUser
      };
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al publicar reseña");
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Error al publicar reseña.....");
    }
  }
);

export const eliminarResenaProducto = createAsyncThunk(
  "product/eliminar/resena",
  async ({ productoId, resenaId }, thunkAPI) => {
    try {
      const res = await axiosInstance.delete(`/producto/eliminar/resena/${productoId}`);
      toast.success(res.data.message);
      return resenaId;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al eliminar reseña");
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Error al eliminar reseña.....");
    }
  }
);

export const buscarIAFiltrarProducto = createAsyncThunk(
  "product/buscar-ia",
  async (mensajeUsuario, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/producto/buscar_ia", { mensajeUsuario });
      thunkAPI.dispatch(toggleAIModal());
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al buscar productos");
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Error al buscar productos.....");
    }
  }
);

const productSlice = createSlice({
  name: "product",
  initialState: {
    loading: false,
    products: [],
    productDetails: {},
    totalProducts: 0,
    topRatedProducts: [],
    newProducts: [],
    aiSearching: false,
    isReviewDeleting: false,
    isPostingReview: false,
    productReviews: [],
  },
  extraReducers: (builder) => {
    builder
      .addCase(buscarTodosProductos.pending, (state) => {
        state.loading = true;
      })
      .addCase(buscarTodosProductos.fulfilled, (state, action) => {
        state.loading = false;
        state.products = (action.payload.productos || []).map(normalizeProduct);
        state.totalProducts = action.payload.totalProductos;
        state.topRatedProducts = (action.payload.topCalificacion || []).map(normalizeProduct);
        state.newProducts = (action.payload.nuevoProductos || []).map(normalizeProduct);
      })
      .addCase(buscarTodosProductos.rejected, (state, action) => {
        if (action.meta.aborted) return;
        state.loading = false;
      })

      .addCase(obtenerDetallesProducto.pending, (state) => {
        state.loading = true;
        state.productDetails = {};
        state.productReviews = [];
      })
      .addCase(obtenerDetallesProducto.fulfilled, (state, action) => {
        state.loading = false;
        state.productDetails = action.payload;
        state.productReviews = action.payload.resenas || [];
      })
      .addCase(obtenerDetallesProducto.rejected, (state) => {
        state.loading = false;
        state.productDetails = {};
        state.productReviews = [];
      })

      .addCase(publicarResenaProducto.pending, (state) => {
        state.isPostingReview = true;
      })
      .addCase(publicarResenaProducto.fulfilled, (state, action) => {
        state.isPostingReview = false;

        const nuevaResena = action.payload?.review;
        if (!nuevaResena) return;

        const autor = action.payload.authUser;
        const resenaConAutor = {
          ...nuevaResena,
          usuario_nombre: autor?.nombre || nuevaResena.usuario_nombre,
          usuario: { avatar: autor?.imagen || null },
        };

        const resenas = state.productDetails.resenas || [];
        const indice = resenas.findIndex((resena) => resena.id === nuevaResena.id);

        if (indice > -1) {
          resenas[indice] = { ...resenas[indice], ...resenaConAutor };
        } else {
          resenas.unshift(resenaConAutor);
        }

        state.productDetails.resenas = resenas;
        state.productReviews = resenas;
      })
      .addCase(publicarResenaProducto.rejected, (state) => {
        state.isPostingReview = false;
      })

      .addCase(eliminarResenaProducto.pending, (state) => {
        state.isReviewDeleting = true;
      })
      .addCase(eliminarResenaProducto.fulfilled, (state, action) => {
        state.isReviewDeleting = false;
        const resenas = (state.productDetails.resenas || []).filter(
          (resena) => resena.id !== action.payload
        );
        state.productDetails.resenas = resenas;
        state.productReviews = resenas;
      })
      .addCase(eliminarResenaProducto.rejected, (state) => {
        state.isReviewDeleting = false;
      })

      .addCase(buscarIAFiltrarProducto.pending, (state) => {
        state.aiSearching = true;
      })
      .addCase(buscarIAFiltrarProducto.fulfilled, (state, action) => {
        state.aiSearching = false;
        state.products = action.payload.productos || [];
        state.totalProducts = (action.payload.productos || []).length;
      })
      .addCase(buscarIAFiltrarProducto.rejected, (state) => {
        state.aiSearching = false;
      })

  },
});

export default productSlice.reducer;
