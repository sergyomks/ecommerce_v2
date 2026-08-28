import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { axiosInstance } from "../../../lib/axios";
import { toast } from "react-toastify";

export const fetchAllOrders = createAsyncThunk(
  "pedidos/obtenerTodo",
  async ({ pagina = 1, estado = "Todos" } = {}, thunkAPI) => {
    try {
      const { data } = await axiosInstance.get("/pedido/admin/obtenerTodo", {
        params: {
          page: pagina,
          ...(estado && estado !== "Todos" ? { estado } : {}),
        },
      });
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Error al obtener los pedidos"
      );
    }
  }
);
export const updateOrderStatus = createAsyncThunk(
  "pedidos/actualizarEstado",
  async ({ pedidoId, status }, thunkAPI) => {
    try {
      const { data } = await axiosInstance.put(
        `/pedido/admin/actualizar/${pedidoId}`,
        { status }
      );
      toast.success(
        data.message || "Estado del pedido actualizado correctamente"
      );
      return data.updatedOrder;
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        "Error al actualizar el estado del pedido";
      toast.error(errMsg);
      return thunkAPI.rejectWithValue(errMsg);
    }
  }
);

export const deleteOrder = createAsyncThunk("pedidos/eliminar", async (pedidoId, thunkAPI) => {
  try {
    const { data } = await axiosInstance.delete(`/pedido/admin/eliminar/${pedidoId}`);
    toast.success(data.message || "Pedido eliminado correctamente");
    return pedidoId;
  } catch (error) {
    toast.error(error.response?.data?.message || "Error al eliminar el pedido");
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Error al eliminar el pedido");
  }
});
const orderSlice = createSlice({
  name: "adminOrder",
  initialState: {
    loading: false,
    orders: [],
    error: null,
    paginaActual: 1,
    totalPaginas: 1,
    totalPedidos: 0,
    requierenRevision: 0,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllOrders.pending, (state) => {
        if (state.orders.length === 0) {
          state.loading = true;
        }
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.pedidos;
        state.paginaActual = action.payload.paginaActual;
        state.totalPaginas = action.payload.totalPaginas;
        state.totalPedidos = action.payload.totalPedidos;
        state.requierenRevision = action.payload.requierenRevision;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orders.findIndex(
          (order) => order.id === action.payload.id
        );
        if (index !== -1) {
          state.orders[index] = {
            ...state.orders[index],
            ...action.payload,
            informacion_envio: state.orders[index].informacion_envio,
          };
        }
      })
      .addCase(updateOrderStatus.rejected, (state) => {
        state.loading = false;
      })
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = state.orders.filter((order) => order.id !== action.payload);
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
  },
});

export default orderSlice.reducer;
