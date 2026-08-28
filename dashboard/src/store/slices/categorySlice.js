import { createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios";
import { toast } from "react-toastify";

const categorySlice = createSlice({
  name: "category",
  initialState: {
    categorias: [],
    loading: false,
  },
  reducers: {
    request(state) {
      state.loading = true;
    },
    success(state, action) {
      state.loading = false;
      state.categorias = action.payload;
    },
    failed(state) {
      state.loading = false;
    },
  },
});

export const fetchCategoriasAdmin = () => async (dispatch) => {
  dispatch(categorySlice.actions.request());
  try {
    const res = await axiosInstance.get("/categoria/admin/todas");
    dispatch(categorySlice.actions.success(res.data.categorias || []));
  } catch (error) {
    dispatch(categorySlice.actions.failed());
    toast.error(error.response?.data?.message || "Error al cargar categorías");
  }
};

export const fetchCategoriasActivas = () => async (dispatch) => {
  dispatch(categorySlice.actions.request());
  try {
    const res = await axiosInstance.get("/categoria");
    dispatch(categorySlice.actions.success(res.data.categorias || []));
  } catch (error) {
    dispatch(categorySlice.actions.failed());
    toast.error(error.response?.data?.message || "Error al cargar categorías");
  }
};

export const createCategoria = (formData) => async (dispatch) => {
  try {
    const res = await axiosInstance.post("/categoria/admin", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success(res.data.message || "Categoría creada");
    dispatch(fetchCategoriasAdmin());
  } catch (error) {
    toast.error(error.response?.data?.message || "No se pudo crear la categoría");
  }
};

export const updateCategoria = (id, formData) => async (dispatch) => {
  try {
    const res = await axiosInstance.put(`/categoria/admin/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    toast.success(res.data.message || "Categoría actualizada");
    dispatch(fetchCategoriasAdmin());
  } catch (error) {
    toast.error(
      error.response?.data?.message || "No se pudo actualizar la categoría"
    );
  }
};

export const deleteCategoria = (id) => async (dispatch) => {
  try {
    const res = await axiosInstance.delete(`/categoria/admin/${id}`);
    toast.success(res.data.message || "Categoría eliminada");
    dispatch(fetchCategoriasAdmin());
  } catch (error) {
    toast.error(
      error.response?.data?.message || "No se pudo eliminar la categoría"
    );
  }
};

export default categorySlice.reducer;
