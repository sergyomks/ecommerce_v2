import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { loginAdmin } from "../../store/slices/authSlice";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    contrasena: "",
  });
  const dispatch = useDispatch();
  const { authUser, isCheckingAuth, isLoggingIn } = useSelector(
    (state) => state.auth
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(
      loginAdmin({
        email: formData.email,
        contraseña: formData.contrasena,
      })
    );
  };

  if (isCheckingAuth && !authUser) {
    return (
      <div className="min-h-[calc(100vh-28px)] flex items-center justify-center">
        <Loader className="size-10 animate-spin text-[#1aa89a]" />
      </div>
    );
  }

  if (authUser?.rol === "Admin") {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-[calc(100vh-28px)] flex items-center justify-center px-4">
      <div className="admin-card p-8 max-w-md w-full sm:p-10">
        <h2 className="text-3xl font-extrabold text-center mb-2 text-[#16343a]">
          Compañia Peruana Nacional Textil SAC
        </h2>
        <p className="text-center text-sm text-[#6b8a8a] mb-6">
          Inicia sesión con una cuenta Admin
        </p>
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="p-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#3d5c62] mb-1"
            >
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Ingresa tu correo electrónico"
              className="w-full px-4 py-3 border border-white/80 bg-white/70 rounded-2xl text-[#16343a] outline-none focus:ring-2 focus:ring-[#1aa89a]/40"
            />
          </div>
          <div className="p-2">
            <label
              htmlFor="contrasena"
              className="block text-sm font-medium text-[#3d5c62] mb-1"
            >
              Contraseña
            </label>
            <input
              type="password"
              id="contrasena"
              name="contrasena"
              value={formData.contrasena}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-white/80 bg-white/70 rounded-2xl text-[#16343a] outline-none focus:ring-2 focus:ring-[#1aa89a]/40"
              required
            />
          </div>
          <div className="px-2 flex justify-end items-center text-sm">
            <Link
              to="/admin/contrasena/reiniciar"
              className="text-[#1aa89a] hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="px-2">
            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 admin-nav-active text-white py-3 rounded-2xl hover:opacity-90 transition font-semibold"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Iniciar Sesión...</span>
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
