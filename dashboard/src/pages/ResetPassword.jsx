import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useParams } from "react-router-dom";
import { resetPassword } from "../store/slices/authSlice";

const ResetPassword = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    contrasena: "",
    confirmarContrasena: ""
  });
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(resetPassword(token, {
      contraseña: formData.contrasena,
      confirmarContraseña: formData.confirmarContrasena
    }));
  };
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  if (isAuthenticated && user.rol === "Admin") {
    return <Navigate to="/" />
  }
  return <>
    <div className="min-h-screen flex items-center justify-center  bg-gradient-to-r from-blue-100 to-purple-200 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full sm:p-10">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Restablecer contraseña</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-2">
            <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
            <input type="password" id="contrasena" name="contrasena" value={formData.contrasena} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md " required />
          </div>
          <div className="p-2">
            <label htmlFor="confirmarContrasena" className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
            <input type="password" id="confirmarContrasena" name="confirmarContrasena" value={formData.confirmarContrasena} onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md " required />
          </div>
          <div className="px-2">
            <button type="submit"
              className="w-full flex justify-center items-center gap-2 rounded-lg bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-semibold"
              disabled={loading}
            >
              {loading ? (<>
                <div className="w-5 h-5 rounded-full border-white border-t-transparent bg-white animate-spin"></div>
                <span>Restableciendo contraseña...</span>
              </>) : ("Restablecer contraseña")}
            </button>
          </div>
        </form>
      </div>
    </div>
  </>;
};

export default ResetPassword;
