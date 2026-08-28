import { useState, useEffect } from "react";
import BotonGoogle from "../BotonGoogle";
import { toast } from "react-toastify";
import { X, Mail, Lock, User } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { toggleAuthPopup } from "../../store/slices/popupSlice";
import { contraseñaOlvidado, establecerSesion, login, registrar, restaurarContraseña } from "../../store/slices/authSlice";

const LoginModal = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const { authUser, isSigningUp, isLoggingIn, isRequestingForToken, isUpdatingPassword } = useSelector(state => state.auth);
  const { isAuthPopupOpen, authMode } = useSelector(state => state.popup);
  const [mode, setMode] = useState("registrar");
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    contrasena: "",
    confirmarContrasena: ""
  })

  useEffect(() => {
    if (location.pathname.startsWith("/contrasena/reiniciar/")) {
      setMode("restablecer")
      dispatch(toggleAuthPopup());
    }
  }, [location.pathname, dispatch]);

  useEffect(() => {
    if (isAuthPopupOpen && authMode) setMode(authMode);
  }, [isAuthPopupOpen, authMode]);

  const handleModeChange = (newMode) => {
    setFormData({ nombre: "", email: "", contrasena: "", confirmarContrasena: "" });
    setMode(newMode);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === "contrasena olvida") {
      dispatch(contraseñaOlvidado({ email: formData.email }))
        .unwrap()
        .then(() => {
          dispatch(toggleAuthPopup());
          setMode("iniciar sesion");
        });
      return;
    }

    if (mode === "restablecer") {
      const token = location.pathname.split("/").pop();
      dispatch(restaurarContraseña({ token, contrasena: formData.contrasena, confirmarContrasena: formData.confirmarContrasena }));
      return;
    }

    if (mode === "registrar") {
      dispatch(registrar({
        nombre: formData.nombre,
        email: formData.email,
        contraseña: formData.contrasena
      }));
    } else {
      dispatch(login({
        email: formData.email,
        contraseña: formData.contrasena
      }));
    }

  }
  if (!isAuthPopupOpen || authUser) return null;
  let isLoading = isSigningUp || isLoggingIn || isRequestingForToken || isUpdatingPassword;

  return <>
    <div className="fixed inset-0 flex items-center justify-center z-50" >
      <div className="absolute inset-0 backdrop-blur-md bg-[hsla(var(--glass-bg))]"></div>
      <div className=" relative z-10 store-surface rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold store-text">
            {
              mode === "iniciar sesion"
                ? "Iniciar Sesión" : mode === "registrar"
                  ? "Registrarse" : mode === "restablecer"
                    ? "Restablecer Contraseña" : mode === "contrasena olvida"
                      ? "Recuperar Contraseña" : ""
            }
          </h2>
          <button className="p-2 rounded-lg store-hover" onClick={() => dispatch(toggleAuthPopup())}>
            <X className="w-5 h-5 text-primary"></X>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {
            mode === "registrar" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="text" placeholder="Nombre completo" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="store-input pl-10" required />
              </div>
            )
          }
          {
            mode !== "restablecer" && (
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="email" placeholder="Ingrese su email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="store-input pl-10" required />
              </div>
            )
          }
          {
            ["iniciar sesion", "registrar", "restablecer"].includes(mode) && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder={mode === "restablecer" ? "Nueva contraseña" : "Ingrese su contraseña"}
                  value={formData.contrasena}
                  onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                  className="store-input pl-10"
                  required
                />
              </div>
            )
          }
          {
            mode === "restablecer" && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="password" placeholder="Confirmar contraseña" value={formData.confirmarContrasena} onChange={(e) => setFormData({ ...formData, confirmarContrasena: e.target.value })} className="store-input pl-10" required />
              </div>
            )
          }
          {
            mode === "iniciar sesion" && (
              <div className="text-right text-sm">
                <button type="button" onClick={() => handleModeChange("contrasena olvida")} className=" text-primary hover:text-accent animate-smooth">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )
          }
          <button type="submit" disabled={isLoading} className={`w-full store-btn ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}>
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>
                  {mode === "restablecer"
                    ? "Restableciendo contraseña..."
                    : mode === "registrar"
                      ? "Registrando..."
                      : mode === "contrasena olvida"
                        ? "Enviando correo..."
                        : "Iniciando sesión..."}
                </span>
              </>
            ) : mode === "restablecer" ? (
              "Restablecer Contraseña"
            ) : mode === "registrar" ? (
              "Crear Cuenta"
            ) : mode === "contrasena olvida" ? (
              "Enviar Correo de Recuperación"
            ) : (
              "Iniciar Sesión"
            )}
          </button>

        </form>

        { }
        {["iniciar sesion", "registrar"].includes(mode) && (
          <BotonGoogle
            texto={mode === "registrar" ? "signup_with" : "signin_with"}
            onExito={(data) => {
              dispatch(establecerSesion(data.user));
              toast.success(data.message);
              dispatch(toggleAuthPopup());
            }}
          />
        )}

        {
          ["iniciar sesion", "registrar", "contrasena olvida", "restablecer"].includes(mode) && (
            <div className="mt-4 text-center">
              <p className="text-muted-foreground">
                {mode === "iniciar sesion" ? "¿No tienes una cuenta?" : mode === "registrar" ? "¿Ya tienes una cuenta?" : mode === "contrasena olvida" ? "¿Ya tienes una cuenta?" : ""}
                {" "}
                <button onClick={() => handleModeChange(mode === "iniciar sesion" ? "registrar" : mode === "registrar" ? "iniciar sesion" : mode === "contrasena olvida" ? "iniciar sesion" : "")} className="text-primary hover:text-accent animate-smooth">
                  {mode === "iniciar sesion" ? "Regístrate" : mode === "registrar" ? "Inicia Sesión" : mode === "contrasena olvida" ? "Inicia Sesión" : ""}
                </button>
              </p>
            </div>
          )
        }
      </div>
    </div>

  </>;
};

export default LoginModal;
