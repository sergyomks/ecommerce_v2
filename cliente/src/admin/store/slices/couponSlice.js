import { createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../../lib/axios";
import { toast } from "react-toastify";

const couponSlice = createSlice({
  name: "coupon",
  initialState: {
    cupones: [],
    loading: false,
  },
  reducers: {
    request(state) {
      state.loading = true;
    },
    success(state, action) {
      state.loading = false;
      state.cupones = action.payload;
    },
    failed(state) {
      state.loading = false;
    },
  },
});

export const fetchCupones = () => async (dispatch) => {
  dispatch(couponSlice.actions.request());
  try {
    const res = await axiosInstance.get("/cupon/admin");
    dispatch(couponSlice.actions.success(res.data.cupones || []));
  } catch (error) {
    dispatch(couponSlice.actions.failed());
    toast.error(error.response?.data?.message || "Error al cargar cupones");
  }
};

export const createCupon = (data) => async (dispatch) => {
  try {
    const res = await axiosInstance.post("/cupon/admin", data);
    toast.success(res.data.message || "Cupón creado");
    dispatch(fetchCupones());
  } catch (error) {
    toast.error(error.response?.data?.message || "No se pudo crear el cupón");
  }
};

export const updateCupon = (id, data) => async (dispatch) => {
  try {
    const res = await axiosInstance.put(`/cupon/admin/${id}`, data);
    toast.success(res.data.message || "Cupón actualizado");
    dispatch(fetchCupones());
  } catch (error) {
    toast.error(
      error.response?.data?.message || "No se pudo actualizar el cupón"
    );
  }
};

export const deleteCupon = (id) => async (dispatch) => {
  try {
    const res = await axiosInstance.delete(`/cupon/admin/${id}`);
    toast.success(res.data.message || "Cupón eliminado");
    dispatch(fetchCupones());
  } catch (error) {
    toast.error(error.response?.data?.message || "No se pudo eliminar el cupón");
  }
};

export default couponSlice.reducer;
