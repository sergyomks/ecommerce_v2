import { createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios";
import { toast } from "react-toastify";

const shippingSlice = createSlice({
  name: "shipping",
  initialState: {
    tarifas: [],
    config: null,
    loading: false,
  },
  reducers: {
    request(state) {
      state.loading = true;
    },
    success(state, action) {
      state.loading = false;
      state.tarifas = action.payload.tarifas;
      state.config = action.payload.config;
    },
    failed(state) {
      state.loading = false;
    },
  },
});

export const fetchTarifasEnvio = () => async (dispatch) => {
  dispatch(shippingSlice.actions.request());
  try {
    const res = await axiosInstance.get("/envio/tarifas/admin");
    dispatch(
      shippingSlice.actions.success({
        tarifas: res.data.tarifas || [],
        config: res.data.config || null,
      })
    );
  } catch (error) {
    dispatch(shippingSlice.actions.failed());
    toast.error(error.response?.data?.message || "Error al cargar tarifas");
  }
};

export const createTarifaEnvio = (data) => async (dispatch) => {
  try {
    const res = await axiosInstance.post("/envio/tarifas/admin", data);
    toast.success(res.data.message || "Tarifa creada");
    dispatch(fetchTarifasEnvio());
  } catch (error) {
    toast.error(error.response?.data?.message || "No se pudo crear la tarifa");
  }
};

export const updateTarifaEnvio = (id, data) => async (dispatch) => {
  try {
    const res = await axiosInstance.put(`/envio/tarifas/admin/${id}`, data);
    toast.success(res.data.message || "Tarifa actualizada");
    dispatch(fetchTarifasEnvio());
  } catch (error) {
    toast.error(
      error.response?.data?.message || "No se pudo actualizar la tarifa"
    );
  }
};

export const deleteTarifaEnvio = (id) => async (dispatch) => {
  try {
    const res = await axiosInstance.delete(`/envio/tarifas/admin/${id}`);
    toast.success(res.data.message || "Tarifa eliminada");
    dispatch(fetchTarifasEnvio());
  } catch (error) {
    toast.error(
      error.response?.data?.message || "No se pudo eliminar la tarifa"
    );
  }
};

export default shippingSlice.reducer;
