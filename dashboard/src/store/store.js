import { configureStore } from "@reduxjs/toolkit";
import extraReducer from "./slices/extraSlice";
import authReducer from "./slices/authSlice";
import adminReducer from "./slices/adminSlice";
import productReducer from "./slices/productsSlice";
import orderReducer from "./slices/orderSlice";
import categoryReducer from "./slices/categorySlice";
import couponReducer from "./slices/couponSlice";
import shippingReducer from "./slices/shippingSlice";

export const store = configureStore({
  reducer: {
    extra: extraReducer,
    auth: authReducer,
    admin: adminReducer,
    product: productReducer,
    order: orderReducer,
    category: categoryReducer,
    coupon: couponReducer,
    shipping: shippingReducer,
  },
});
