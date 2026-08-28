import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios";
import { toast } from "react-toastify";

export const fetchAllOrders = createAsyncThunk("pedidos/obtenerTodo", async (_, thunkAPI) => {
  try {
    const { data } = await axiosInstance.get("/pedido/admin/obtenerTodo");
    return data.pedidos;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || "Error al obtener los pedidos");
  }
});
export const updateOrderStatus = createAsyncThunk(
  "pedidos/actualizarEstado",
  async (
    { pedidoId, status, carrier, codigo_seguimiento, url_tracking },
    thunkAPI
  ) => {
    try {
      const { data } = await axiosInstance.put(
        `/pedido/admin/actualizar/${pedidoId}`,
        { status, carrier, codigo_seguimiento, url_tracking }
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
  name: "order",
  initialState: {
    loading: false,
    orders: [],
    error: null,
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
        state.orders = action.payload;
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
            informacion_envio: {
              ...(state.orders[index].informacion_envio || {}),
              ...(action.payload.informacion_envio || {}),
            },
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
