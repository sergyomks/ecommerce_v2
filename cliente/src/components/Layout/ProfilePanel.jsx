import { useEffect, useState } from "react";
import { X, LogOut, Upload, Eye, EyeOff, Heart } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";

import { toggleAuthPopup } from "../../store/slices/popupSlice";
import { cerrarSesion, actualizarPerfil, actualizarContraseña } from "../../store/slices/authSlice";

const ProfilePanel = () => {
  const dispatch = useDispatch();
  const { isAuthPopupOpen } = useSelector(state => state.popup);
  const { authUser, isUpdatingProfile, isUpdatingPassword } = useSelector(state => state.auth);
  const [nombre, setNombre] = useState(authUser?.nombre || "");
  const [email, setEmail] = useState(authUser?.email || "");
  const [imagen, setImagen] = useState(authUser?.imagen || "");
  useEffect(() => {
    if (authUser) {
      setNombre(authUser.nombre);
      setEmail(authUser.email);
    }
  }, [authUser]);

  const [showPassword, setShowPassword] = useState(false);
  const [contrasenaActual, setContrasenaActual] = useState("");
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");

  const handleLogout = () => {
    dispatch(cerrarSesion());
  };

  const handleUpdateProfile = () => {
    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("email", email);
    if (imagen) formData.append("imagen", imagen);
    dispatch(actualizarPerfil(formData));
  };

  const handleUpdatePassword = () => {
    dispatch(actualizarContraseña({
      contraseñaActual: contrasenaActual,
      nuevaContraseña: nuevaContrasena,
      confirmarContraseña: confirmarContrasena
    }));
  };
  if (!isAuthPopupOpen || !authUser) return null;

  return <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => dispatch(toggleAuthPopup())}>
    </div>

    { }
    <div className="fixed right-0 top-0 h-full w-full sm:w-96 z-50 store-surface shadow-xl animate-slide-in-right overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--store-border)" }}>
        <h2 className="text-xl font-semibold store-text">Perfil</h2>
        <button className="p-2 rounded-lg store-hover" onClick={() => dispatch(toggleAuthPopup())}>
          <X className="w-5 h-5 text-primary"></X>
        </button>
      </div>
      <div className="p-6">
        <div className="text-center mb-6">
          <img src={authUser?.imagen?.url || "/perfil-defecto.png"} alt={authUser?.nombre} className="w-32 h-32 rounded-full mx-auto mb-4 border-2 border-primary object-cover " />
          <h3 className="text-lg font-semibold text-foreground">{authUser?.nombre}</h3>
          <p className="text-muted-foreground">{authUser?.email}</p>
          <Link
            to="/wishlist"
            onClick={() => dispatch(toggleAuthPopup())}
            className="inline-flex items-center gap-2 mt-3 text-primary hover:underline"
          >
            <Heart className="w-4 h-4" />
            Ver lista de deseos
          </Link>
        </div>
        {
          authUser && (
            <div className="space-y-4 mb-8">
              <h3 className="text-lg font-semibold text-foreground">Actualizar Perfil</h3>
              <input type="text" placeholder="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} className="store-input" />
              <input type="text" placeholder="ingresa tu email" value={email} onChange={(e) => setEmail(e.target.value)} className="store-input" />
              <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground" >
                <Upload className="w-4 h-4 text-primary" />
                <span >cargar imagen</span>
                <input type="file" accept="image/*" onChange={(e) => setImagen(e.target.files[0])} className="hidden" />
              </label>
              <button onClick={handleUpdateProfile} className="store-btn w-full">
                {
                  isUpdatingProfile ? (
                    <>
                      <div className={`h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin`}>
                      </div>
                      <span>Actualizando perfil</span>
                    </>
                  ) : (
                    "guardar cambios"
                  )
                }
              </button>

            </div>
          )
        }
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Cambiar Contraseña</h3>
          <input type={showPassword ? "text" : "password"} placeholder="Contraseña actual" value={contrasenaActual} onChange={(e) => setContrasenaActual(e.target.value)} className="store-input" />
          <input type={showPassword ? "text" : "password"} placeholder="Nueva contraseña" value={nuevaContrasena} onChange={(e) => setNuevaContrasena(e.target.value)} className="store-input" />
          <input type={showPassword ? "text" : "password"} placeholder="Confirmar contraseña" value={confirmarContrasena} onChange={(e) => setConfirmarContrasena(e.target.value)} className="store-input" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-xs text-muted-foreground flex items-center gap-1"
          >
            {showPassword ? (<EyeOff className="w-4 h-4 text-primary" />) : (<Eye className="w-4 h-4 text-primary" />)}
            {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          </button>
          <button onClick={handleUpdatePassword} className="store-btn w-full">
            {
              isUpdatingPassword ? (
                <>
                  <div className={`h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin`}>
                  </div>
                  <span>Actualizando contraseña</span>
                </>
              ) : (
                "guardar contraseña"
              )
            }
          </button>
        </div>
        <button onClick={handleLogout} className="my-6 flex items-center space-x-3 p-2 rounded-lg glass-card hover:glow-on-hover text-destructive hover:text-destructive-foreground group w-full">
          <LogOut className="w-5 h-5" />
          <span>cerrar sesion</span>
        </button>
      </div>
    </div>

  </>;
};

export default ProfilePanel;
