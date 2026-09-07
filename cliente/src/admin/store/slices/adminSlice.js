import { createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../../lib/axios";
import { toast } from "react-toastify";

export const adminSlice = createSlice({
  name: "admin",
  initialState: {
    loading: false,
    totalUsers: 0,
    users: [],
    totalRevenueAllTime: 0,
    todayRevenue: 0,
    yesterdayRevenue: 0,
    totalUsersCount: 0,
    monthlySales: [],
    orderStatusCounts: {},
    topSellingProducts: [],
    lowStockProducts: [],
    revenueGrowth: "",
    newUsersThisMonth: 0,
    currentMonthSales: 0,
    mensajes: [],
    totalMensajes: 0,
    mensajesLoading: false,
  },
  reducers: {
    getAllUsersRequest(state) {
      state.loading = true;
    },
    getAllUsersSuccess(state, action) {
      state.loading = false;
      state.users = action.payload.usuarios;
      state.totalUsers = action.payload.totalUsuarios;
    },
    getAllUsersFailed(state) {
      state.loading = false;
    },
    deleteUserRequest(state) {
      state.loading = true;
    },
    deleteUserSuccess(state, action) {
      state.loading = false;
      state.users = state.users.filter((user) => user.id !== action.payload);
      state.totalUsers = Math.max(0, state.totalUsers - 1);
      state.totalUsersCount = Math.max(0, state.totalUsersCount - 1);
    },
    deleteUserFailed(state) {
      state.loading = false;
    },
    getStatsRequest(state) {
      state.loading = true;
    },
    getStatsSuccess(state, action) {
      state.loading = false;
      state.totalRevenueAllTime = action.payload.totalRevenueAllTime;
      state.todayRevenue = action.payload.todayRevenue;
      state.yesterdayRevenue = action.payload.yesterdayRevenue;
      state.totalUsersCount = action.payload.totalUsersCount;
      state.monthlySales = action.payload.monthlySales;
      state.orderStatusCounts = action.payload.orderStatusCounts;
      state.topSellingProducts = action.payload.topSellingProducts;
      state.lowStockProducts = action.payload.lowStockProducts || [];
      state.revenueGrowth = action.payload.revenueGrowth;
      state.newUsersThisMonth = action.payload.newUsersThisMonth;
      state.currentMonthSales = action.payload.currentMonthSales;
    },
    getStatsFailed(state) {
      state.loading = false;
    },
    getMensajesRequest(state) {
      state.mensajesLoading = true;
    },
    getMensajesSuccess(state, action) {
      state.mensajesLoading = false;
      state.mensajes = action.payload.mensajes;
      state.totalMensajes = action.payload.total;
    },
    getMensajesFailed(state) {
      state.mensajesLoading = false;
    },
  },
});

export const fetchAllUsers = (page = 1) => async (dispatch) => {
  dispatch(adminSlice.actions.getAllUsersRequest());
  await axiosInstance.get(`/admin/obtenertodosusuarios?page=${page || 1}`)
    .then((res) => {
      dispatch(adminSlice.actions.getAllUsersSuccess(res.data));
    })
    .catch((error) => {
      dispatch(adminSlice.actions.getAllUsersFailed(error));
    });
};

export const deleteUser = (id, page) => async (dispatch, getState) => {
  dispatch(adminSlice.actions.deleteUserRequest());
  await axiosInstance.delete(`/admin/eliminar/${id}`)
    .then((res) => {
      dispatch(adminSlice.actions.deleteUserSuccess(id));
      toast.success(res.data.message || "Usuario eliminado correctamente");
      const state = getState();
      const updatedTotal = state.admin.totalUsers;
      const updateMaxPage = Math.ceil(updatedTotal / 10) || 1;
      const validPage = Math.min(page, updateMaxPage);
      dispatch(fetchAllUsers(validPage));

    })
    .catch((error) => {
      dispatch(adminSlice.actions.deleteUserFailed(error));
      toast.error(error.response?.data?.message || "Error al eliminar usuario");
    });
};

export const getDashboardStats = () => async (dispatch) => {
  dispatch(adminSlice.actions.getStatsRequest());
  await axiosInstance.get("/admin/buscar/dashboard-panel")
    .then((res) => {
      dispatch(adminSlice.actions.getStatsSuccess(res.data));
    })
    .catch((error) => {
      dispatch(adminSlice.actions.getStatsFailed(error));
    });
};

export const fetchMensajesContacto = (page = 1) => async (dispatch) => {
  dispatch(adminSlice.actions.getMensajesRequest());
  try {
    const res = await axiosInstance.get(`/contacto/admin?page=${page}`);
    dispatch(adminSlice.actions.getMensajesSuccess(res.data));
  } catch (error) {
    dispatch(adminSlice.actions.getMensajesFailed());
    toast.error(error.response?.data?.message || "Error al cargar mensajes");
  }
};

export const marcarMensajeLeido = (id, page = 1) => async (dispatch) => {
  try {
    await axiosInstance.put(`/contacto/admin/${id}/leido`);
    toast.success("Mensaje marcado como leído");
    dispatch(fetchMensajesContacto(page));
  } catch (error) {
    toast.error(error.response?.data?.message || "No se pudo marcar el mensaje");
  }
};

export const eliminarMensajeContacto = (id, page = 1) => async (dispatch) => {
  try {
    const res = await axiosInstance.delete(`/contacto/admin/${id}`);
    toast.success(res.data.message || "Mensaje eliminado");
    dispatch(fetchMensajesContacto(page));
  } catch (error) {
    toast.error(error.response?.data?.message || "No se pudo eliminar el mensaje");
  }
};

export default adminSlice.reducer;
