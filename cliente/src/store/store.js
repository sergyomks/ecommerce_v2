import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import popupReducer from "./slices/popupSlice";
import cartReducer from "./slices/cartSlice";
import productReducer from "./slices/productSlice";
import orderReducer from "./slices/orderSlice";
import categoryReducer from "./slices/categorySlice";
import wishlistReducer from "./slices/wishlistSlice";
import extraReducer from "../admin/store/slices/extraSlice";
import adminReducer from "../admin/store/slices/adminSlice";
import adminProductReducer from "../admin/store/slices/productsSlice";
import adminOrderReducer from "../admin/store/slices/orderSlice";
import adminCategoryReducer from "../admin/store/slices/categorySlice";
import couponReducer from "../admin/store/slices/couponSlice";
import shippingReducer from "../admin/store/slices/shippingSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    popup: popupReducer,
    cart: cartReducer,
    product: productReducer,
    order: orderReducer,
    category: categoryReducer,
    wishlist: wishlistReducer,
    extra: extraReducer,
    admin: adminReducer,
    adminProduct: adminProductReducer,
    adminOrder: adminOrderReducer,
    adminCategory: adminCategoryReducer,
    coupon: couponReducer,
    shipping: shippingReducer,
  },
});
