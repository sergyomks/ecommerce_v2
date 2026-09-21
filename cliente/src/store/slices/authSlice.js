import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";
import { toggleAuthPopup } from "./popupSlice";
import { mensajeDeError } from "../../lib/errores";

export const registrar = createAsyncThunk("auth/registar", async (data, thunkApi) => {
  try {
    const res = await axiosInstance.post("/auth/registrar", data);
    toast.success(res.data.message);
    thunkApi.dispatch(toggleAuthPopup());
    return res.data.user;
  } catch (error) {
    const mensaje = mensajeDeError(error);
    toast.error(mensaje);
    return thunkApi.rejectWithValue(mensaje);
  }
})

export const login = createAsyncThunk("auth/login", async (data, thunkApi) => {
  try {
    const res = await axiosInstance.post("/auth/login", { ...data, destino: "store" });
    toast.success(res.data.message);
    thunkApi.dispatch(toggleAuthPopup());
    return res.data.user;
  } catch (error) {
    const mensaje = mensajeDeError(error);
    toast.error(mensaje);
    return thunkApi.rejectWithValue(mensaje);
  }
})

export const loginAdmin = createAsyncThunk("auth/loginAdmin", async (data, thunkApi) => {
  try {
    const res = await axiosInstance.post("/auth/login", { ...data, destino: "admin" });
    toast.success(res.data.message);
    return res.data.user;
  } catch (error) {
    const message = error.response?.data?.message || "Inicio de sesión fallido";
    toast.error(message);
    return thunkApi.rejectWithValue(message);
  }
})

export const obtenerUsuario = createAsyncThunk("auth/obtenerUsuario", async (_, thunkApi) => {
  try {
    const res = await axiosInstance.get("/auth/obtenerUsuario");

    return res.data.user;
  } catch (error) {

    return thunkApi.rejectWithValue(mensajeDeError(error, "No se pudo obtener el usuario"));
  }
})

export const cerrarSesion = createAsyncThunk("auth/cerrarSesion", async (options, thunkApi) => {
  try {
    const scope = options?.scope === "admin" ? "admin" : "store";
    await axiosInstance.post("/auth/cerrarSesion", { scope });
    if (!options?.skipPopup) {
      thunkApi.dispatch(toggleAuthPopup());
    }
    return null;
  } catch (error) {
    const mensaje = mensajeDeError(error, "No se pudo cerrar la sesión");
    toast.error(mensaje);
    return thunkApi.rejectWithValue(mensaje);
  }
})

export const contraseñaOlvidado = createAsyncThunk("auth/contrasena/solicitarReinicio", async (payload, thunkApi) => {
  try {
    const body =
      typeof payload === "string"
        ? { email: payload, destino: "tienda" }
        : { email: payload.email, destino: payload.destino || "tienda" };
    const res = await axiosInstance.post("/auth/contrasena/reiniciar", body);
    toast.success(res.data.message);

    return null;
  } catch (error) {
    const mensaje = mensajeDeError(error);
    toast.error(mensaje);
    return thunkApi.rejectWithValue(mensaje);
  }
})

export const restaurarContraseña = createAsyncThunk("auth/contrasena/restaurar", async ({ token, contrasena, confirmarContrasena }, thunkApi) => {
  try {
    const res = await axiosInstance.put(`/auth/contrasena/reiniciar/${token}`, { contraseña: contrasena, confirmarContraseña: confirmarContrasena });
    toast.success(res.data.message);

    return res.data.user;
  } catch (error) {
    const message = mensajeDeError(error, "Algo salió mal. Por favor, inténtalo de nuevo.")
    toast.error(message);
    return thunkApi.rejectWithValue(message);
  }
})

export const actualizarContraseña = createAsyncThunk("auth/contrasena/actualizar", async (data, thunkApi) => {
  try {
    const res = await axiosInstance.put("/auth/contrasena/actualizar", data);
    toast.success(res.data.message);

    return null;
  } catch (error) {
    const message = mensajeDeError(error);
    toast.error(message);
    return thunkApi.rejectWithValue(message);
  }
})

export const actualizarPerfil = createAsyncThunk("auth/perfil/actualizar", async (data, thunkApi) => {
  try {
    const res = await axiosInstance.put("/auth/perfil/actualizar", data);
    toast.success(res.data.message);

    return res.data.user;
  } catch (error) {
    const message = mensajeDeError(error);
    toast.error(message);
    return thunkApi.rejectWithValue(message);
  }
})

const authSlice = createSlice({
  name: "auth",
  initialState: {
    authUser: null,
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isUpdatingPassword: false,
    isRequestingForToken: false,
    isCheckingAuth: true,
  },
  reducers: {

    establecerSesion: (state, action) => {
      state.authUser = action.payload;
      state.isLoggingIn = false;
      state.isSigningUp = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(registrar.pending, (state) => {
      state.isSigningUp = true;
    })
      .addCase(registrar.fulfilled, (state, action) => {
        state.isSigningUp = false;
        state.authUser = action.payload
      })
      .addCase(registrar.rejected, (state) => {
        state.isSigningUp = false
      })

    builder.addCase(login.pending, (state) => {
      state.isLoggingIn = true;
    })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoggingIn = false;
        state.authUser = action.payload
      })
      .addCase(login.rejected, (state) => {
        state.isLoggingIn = false
      })

    builder.addCase(loginAdmin.pending, (state) => {
      state.isLoggingIn = true;
    })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.isLoggingIn = false;
        state.authUser = action.payload
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.isLoggingIn = false
        if (String(action.payload || "").includes("Acceso denegado")) {
          state.authUser = null
        }
      })

      .addCase(obtenerUsuario.pending, (state) => {
        state.isCheckingAuth = true;
        state.authUser = null
      })
      .addCase(obtenerUsuario.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        state.authUser = action.payload
      })
      .addCase(obtenerUsuario.rejected, (state) => {
        state.isCheckingAuth = false;
        state.authUser = null
      })

      .addCase(cerrarSesion.fulfilled, (state) => {

        state.authUser = null
      })
      .addCase(cerrarSesion.rejected, (state) => {

        state.authUser = null;
      })

    builder.addCase(contraseñaOlvidado.pending, (state) => {
      state.isRequestingForToken = true;
    })
      .addCase(contraseñaOlvidado.fulfilled, (state) => {
        state.isRequestingForToken = false;

      })
      .addCase(contraseñaOlvidado.rejected, (state) => {
        state.isRequestingForToken = false;
      })

    builder.addCase(restaurarContraseña.pending, (state) => {
      state.isUpdatingPassword = true;
    })
      .addCase(restaurarContraseña.fulfilled, (state, action) => {
        state.isUpdatingPassword = false;

        state.authUser = action.payload
      })
      .addCase(restaurarContraseña.rejected, (state) => {
        state.isUpdatingPassword = false;
      })

    builder.addCase(actualizarContraseña.pending, (state) => {
      state.isUpdatingPassword = true;
    })
      .addCase(actualizarContraseña.fulfilled, (state) => {
        state.isUpdatingPassword = false;

      })
      .addCase(actualizarContraseña.rejected, (state) => {
        state.isUpdatingPassword = false;
      })

    builder.addCase(actualizarPerfil.pending, (state) => {
      state.isUpdatingProfile = true;
    })
      .addCase(actualizarPerfil.fulfilled, (state, action) => {
        state.isUpdatingProfile = false;
        state.authUser = action.payload
      })
      .addCase(actualizarPerfil.rejected, (state) => {
        state.isUpdatingProfile = false;
      })
  },
});

export const { establecerSesion } = authSlice.actions;

export default authSlice.reducer;
