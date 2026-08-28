import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import { login } from "../store/slices/authSlice";
const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    contrasena: ""
  });
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const dispatch = useDispatch();

  const handleLogin = (e) => {
    e.preventDefault();
    dispatch(login({
      email: formData.email,
      contraseña: formData.contrasena
    }));
  };

  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  if (isAuthenticated && user.rol === "Admin") {
    return <Navigate to="/" />;
  }
  return <>
    <div className="min-h-screen flex items-center justify-center  bg-gradient-to-r from-blue-100 to-purple-200 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full sm:p-10">
        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Bienvenido de nuevo</h2>
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="p-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Ingresa tu correo electrónico"
              className="w-full px-4 py-3 border border-gray-300 rounded-md " />
          </div>
          <div className="p-2">
            <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" id="contrasena" name="contrasena" value={formData.contrasena} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md" required />
          </div>
          <div className="px-2 flex justify-between items-center  text-sm text-grey-500">
            <div className="flex items-center space-x-2">
              <input type="checkbox" id="recordarme" className="w-4 h-4" />
              <label htmlFor="recordarme" >Recordarme</label>
            </div>
            <Link to={"/contrasena/reiniciar"} type="button" className="text-blue-600 hover:underline">¿Olvidaste tu contraseña?</Link>
          </div>
          <div className="px-2">
            <button type="submit"
              className="w-full flex justify-center items-center gap-2 rounded-lg bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-semibold"
              disabled={loading}
            >
              {loading ? (<>
                <div className="w-5 h-5 rounded-full border-white border-t-transparent bg-white animate-spin"></div>
                <span>Iniciar Sesión...</span>
              </>) : ("Iniciar Sesión")}
            </button>
          </div>

        </form>
      </div>
    </div>
  </>;
};

export default Login;
