import { createSlice } from "@reduxjs/toolkit";

const popupSlice = createSlice({
  name: "popup",
  initialState: {
    isAuthPopupOpen: false,
    authMode: "iniciar sesion",
    isSidebarOpen: false,
    isSearchBarOpen: false,
    isCartOpen: false,
    isAIPopupOpen: false,
  },
  reducers: {
    toggleAuthPopup(state){
      state.isAuthPopupOpen = !state.isAuthPopupOpen;
    },
    openAuthPopup(state, action) {
      state.isAuthPopupOpen = true;
      state.authMode = action.payload || "iniciar sesion";
    },
    toggleSidebar(state){
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    toggleSearchBar(state){
      state.isSearchBarOpen = !state.isSearchBarOpen;
    },
    toggleCart(state){
      state.isCartOpen = !state.isCartOpen;
    },
    toggleAIModal(state){
      state.isAIPopupOpen = !state.isAIPopupOpen;
    },
  },
});

export const {
  toggleAuthPopup,
  openAuthPopup,
  toggleSidebar,
  toggleSearchBar,
  toggleCart,
  toggleAIModal,
} = popupSlice.actions;
export default popupSlice.reducer;
