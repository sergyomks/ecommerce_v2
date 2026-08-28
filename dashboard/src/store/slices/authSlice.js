import { createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../lib/axios";
import { toast } from "react-toastify";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    loading: false,
    user: null,
    isAuthenticated: false,
  },
  reducers: {
    loginRequest: (state) => {
      state.loading = true;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    loginFailed: (state) => {
      state.loading = false;
    },
    getUserRequest: (state) => {
      state.loading = true;
    },
    getUserSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    getUserFailed: (state) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
    },
    logoutRequest: (state) => {
      state.loading = false;

    },
    logoutSuccess: (state) => {
      state.loading = false;
      state.user = null;
      state.isAuthenticated = false;
    },
    logoutFailed: (state) => {
      state.loading = false;
    },
    forgotPasswordRequest: (state) => {
      state.loading = true;
    },
    forgotPasswordSuccess: (state) => {
      state.loading = false;
    },
    forgotPasswordFailed: (state) => {
      state.loading = false;
    },
    resetPasswordRequest: (state) => {
      state.loading = true;
    },
    resetPasswordSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    resetPasswordFailed: (state) => {
      state.loading = false;
    },
    updateProfileRequest: (state) => {
      state.loading = true;
    },
    updateProfileSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload;
    },
    updateProfileFailed: (state) => {
      state.loading = false;
    },
    updatePasswordRequest: (state) => {
      state.loading = true;
    },
    updatePasswordSuccess: (state) => {
      state.loading = false;
    },
    updatePasswordFailed: (state) => {
      state.loading = false;
    },
    resetAuthSlice: (state) => {
      state.loading = false;
      state.user = state.user;
      state.isAuthenticated = state.isAuthenticated;
    }
  },
});

export const login = (data) => async (dispatch) => {
  dispatch(authSlice.actions.loginRequest());
  try {
    await axiosInstance.post('/auth/login', data).then((res) => {
      if (res.data.user.rol === "Admin") {
        dispatch(authSlice.actions.loginSuccess(res.data.user));
        toast.success(res.data.message)
      }
      else {
        dispatch(authSlice.actions.loginFailed());
        toast.error("Acceso denegado. No tiene permisos de administrador.");
      }
    })
  } catch (error) {
    dispatch(authSlice.actions.loginFailed());
    toast.error(error.response.data.message || "inicio de sesion fallido")
  }
}
export const getUser = () => async (dispatch) => {
  dispatch(authSlice.actions.getUserRequest());
  try {
    await axiosInstance.get('/auth/obtenerUsuario').then((res) => {
      dispatch(authSlice.actions.getUserSuccess(res.data.user));
    })
  } catch (error) {
    dispatch(authSlice.actions.getUserFailed());
  }
}
export const logout = () => async (dispatch) => {
  dispatch(authSlice.actions.logoutRequest());
  try {
    await axiosInstance.post('/auth/cerrarSesion').then((res) => {
      dispatch(authSlice.actions.logoutSuccess());
      toast.success(res.data.message);
      dispatch(authSlice.actions.resetAuthSlice());
    })
  } catch (error) {
    dispatch(authSlice.actions.getUserFailed());
    toast.error(error.response.data.message || "cierre de sesion fallido");
    dispatch(authSlice.actions.resetAuthSlice());
  }
}
export const forgotPassword = (email) => async (dispatch) => {
  dispatch(authSlice.actions.forgotPasswordRequest());
  try {
    await axiosInstance.post(`/auth/contrasena/reiniciar?frontendUrl=${window.location.origin}`, { email }).then((res) => {
      dispatch(authSlice.actions.forgotPasswordSuccess());
      toast.success(res.data.message);
    })
  } catch (error) {
    dispatch(authSlice.actions.forgotPasswordFailed());
    toast.error(error.response.data.message || "No es posible solicitar el restablecimiento de la contraseña.");
  }
}
export const resetPassword = (token, newData) => async (dispatch) => {
  dispatch(authSlice.actions.resetPasswordRequest());
  try {
    await axiosInstance.put(`/auth/contrasena/reiniciar/${token}`, newData).then((res) => {
      dispatch(authSlice.actions.resetPasswordSuccess(res.data.user));
      toast.success(res.data.message);
    })
  } catch (error) {
    dispatch(authSlice.actions.resetPasswordFailed());
    toast.error(error.response.data.message || "No es posible restablecer la contraseña.");
  }
}
export const updateAdminProfile = (data) => async (dispatch) => {
  dispatch(authSlice.actions.updateProfileRequest());
  try {
    await axiosInstance.put('/auth/perfil/actualizar', data).then((res) => {
      dispatch(authSlice.actions.updateProfileSuccess(res.data.user));
      toast.success(res.data.message);
    })
  } catch (error) {
    dispatch(authSlice.actions.updateProfileFailed());
    toast.error(error.response.data.message || "No es posible actualizar el perfil.");
  }
}
export const updateAdminPassword = (data) => async (dispatch) => {
  dispatch(authSlice.actions.updatePasswordRequest());
  try {
    await axiosInstance.put('/auth/contrasena/actualizar', data).then((res) => {
      dispatch(authSlice.actions.updatePasswordSuccess());
      toast.success(res.data.message);
    })
  } catch (error) {
    dispatch(authSlice.actions.updatePasswordFailed());
    toast.error(error.response.data.message || "actualizacion de contraseña fallida");
  }
}
export const resetAuthSlice = () => (dispatch) => {
  dispatch(authSlice.actions.resetAuthSlice());
}
export default authSlice.reducer;
