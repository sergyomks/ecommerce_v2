import { createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios";
import { toast } from "react-toastify";
import { toggleCreateProductModal, toggleUpdateProductModal } from "./extraSlice";

const productSlice = createSlice({
  name: "product",
  initialState: {
    loading: false,
    fetchingProducts: false,
    products: [],
    totalProducts: 0,
  },
  reducers: {
    createProductRequest(state) {
      state.loading = true;
    },
    createProductSuccess(state, action) {
      state.loading = false;
      state.products = [action.payload, ...state.products];
    },
    createProductFailure(state) {
      state.loading = false;
    },
    fetchAllProductsRequest(state) {
      state.fetchingProducts = true;
    },
    fetchAllProductsSuccess(state, action) {
      state.fetchingProducts = false;
      state.products = action.payload.productos;
      state.totalProducts = action.payload.totalProductos;
    },
    fetchAllProductsFailure(state) {
      state.fetchingProducts = false;
    },
    updateProductRequest(state) {
      state.loading = true;
    },
    updateProductSuccess(state, action) {
      state.loading = false;
      state.products = state.products.map((product) =>
        product.id === action.payload.id ? action.payload : product
      );
    },
    updateProductFailure(state) {
      state.loading = false;
    },
    deleteProductRequest(state) {
      state.loading = true;
    },
    deleteProductSuccess(state, action) {
      state.loading = false;
      state.products = state.products.filter((product) => product.id !== action.payload);
      state.totalProducts = Math.max(0, state.totalProducts - 1);
    },
    deleteProductFailure(state) {
      state.loading = false;
    },
  },
});

export const createNewProduct = (data) => async (dispatch) => {
  dispatch(productSlice.actions.createProductRequest());
  await axiosInstance.post('/producto/admin/crear', data).then((res) => {
    dispatch(productSlice.actions.createProductSuccess(res.data.producto));
    toast.success(res.data.message || "Producto creado exitosamente");
    dispatch(toggleCreateProductModal());
  }).catch((error) => {
    dispatch(productSlice.actions.createProductFailure());
    toast.error(error.response?.data?.message || "Error al crear el producto");
  })
}

export const fetchAllProducts = (page) => async (dispatch) => {
  dispatch(productSlice.actions.fetchAllProductsRequest());
  await axiosInstance.get(`/producto?page=${page || 1}`).then((res) => {
    dispatch(productSlice.actions.fetchAllProductsSuccess(res.data));
  }).catch((error) => {
    dispatch(productSlice.actions.fetchAllProductsFailure());
  })
}
export const updateProduct = (id, data) => async (dispatch) => {
  dispatch(productSlice.actions.updateProductRequest());
  await axiosInstance.put(`/producto/admin/actualizar/${id}`, data).then((res) => {
    dispatch(productSlice.actions.updateProductSuccess(res.data.producto));
    toast.success(res.data.message || "Producto actualizado exitosamente");
    dispatch(toggleUpdateProductModal());
  }).catch((error) => {
    dispatch(productSlice.actions.updateProductFailure());
    toast.error(error.response?.data?.message || "Error al actualizar el producto");
  })
}
export const deleteProduct = (id, page) => async (dispatch, getState) => {
  dispatch(productSlice.actions.deleteProductRequest());
  await axiosInstance.delete(`/producto/admin/eliminar/${id}`).then((res) => {
    dispatch(productSlice.actions.deleteProductSuccess(id));
    toast.success(res.data.message || "Producto eliminado exitosamente");
    const state = getState();
    const updateTotal = state.product.totalProducts;
    const updateMaxPage = Math.ceil(updateTotal / 10) || 1;
    const validPage = Math.min(updateMaxPage, page);
    dispatch(fetchAllProducts(validPage));
  }).catch((error) => {
    dispatch(productSlice.actions.deleteProductFailure());
    toast.error(error.response?.data?.message || "Error al eliminar el producto");
  })
}

export default productSlice.reducer;
