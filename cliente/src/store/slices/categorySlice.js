import { createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";

const categorySlice = createSlice({
  name: "category",
  initialState: {
    categorias: [],
    loading: false,
    error: null,
  },
  reducers: {
    fetchCategoriasRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchCategoriasSuccess(state, action) {
      state.loading = false;
      state.categorias = action.payload;
    },
    fetchCategoriasFailed(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const fetchCategorias = () => async (dispatch) => {
  dispatch(categorySlice.actions.fetchCategoriasRequest());
  try {
    const res = await axiosInstance.get("/categoria");
    dispatch(
      categorySlice.actions.fetchCategoriasSuccess(res.data.categorias || [])
    );
  } catch (error) {
    dispatch(
      categorySlice.actions.fetchCategoriasFailed(
        error.response?.data?.message || "Error al cargar categorías"
      )
    );
  }
};

export default categorySlice.reducer;
