import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";
import { mensajeDeError } from "../../lib/errores";

export const fetchMyOrders = createAsyncThunk("pedido/pedidos/me", async (_, thunkAPI) => {
  try {
    const res = await axiosInstance.get("/pedido/pedidos/me");
    return res.data.pedidos;
  } catch (error) {
    return thunkAPI.rejectWithValue(mensajeDeError(error, "No se pudieron cargar tus pedidos."));
  }
});

export const placeOrder = createAsyncThunk("pedido/nuevo", async (data, thunkAPI) => {
  try {
    const res = await axiosInstance.post("/pedido/nuevo", data);
    toast.success(res.data.message);
    return res.data;
  } catch (error) {
    const mensaje = mensajeDeError(error, "No se pudo realizar; inténtalo de nuevo.");
    toast.error(mensaje);
    return thunkAPI.rejectWithValue(mensaje);
  }
});

export const processPayment = createAsyncThunk("pago/crear-cargo", async (data, thunkAPI) => {
  try {
    const res = await axiosInstance.post("/pago/crear-cargo", data);
    return res.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(mensajeDeError(error, "Error al procesar el pago."));
  }
});

const orderSlice = createSlice({
  name: "order",
  initialState: {
    myOrders: [],
    fetchingOrders: false,
    placingOrder: false,
    processingPayment: false,
    currentPedidoId: null,
    finalPrice: null,
    orderStep: 1,
  },
  reducers: {
    toggleOrderStep: (state) => {
      state.orderStep = state.orderStep === 1 ? 2 : 1;
    },
    resetOrderState: (state) => {
      state.orderStep = 1;
      state.currentPedidoId = null;
      state.finalPrice = null;
      state.processingPayment = false;
      state.placingOrder = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.pending, (state) => {
        state.fetchingOrders = true;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.fetchingOrders = false;
        state.myOrders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state) => {
        state.fetchingOrders = false;
      })
      .addCase(placeOrder.pending, (state) => {
        state.placingOrder = true;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.placingOrder = false;
        state.finalPrice = action.payload.precio_total;
        state.currentPedidoId = action.payload.pedidoId;
        state.orderStep = 2;
      })
      .addCase(placeOrder.rejected, (state) => {
        state.placingOrder = false;
      })
      .addCase(processPayment.pending, (state) => {
        state.processingPayment = true;
      })
      .addCase(processPayment.fulfilled, (state) => {
        state.processingPayment = false;
      })
      .addCase(processPayment.rejected, (state) => {
        state.processingPayment = false;
      });
  },
});

export default orderSlice.reducer;
export const { toggleOrderStep, resetOrderState } = orderSlice.actions;
