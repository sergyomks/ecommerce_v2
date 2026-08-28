import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import { forgotPassword } from "../store/slices/authSlice";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(forgotPassword(email));
    setEmail("");
  };
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  if (isAuthenticated && user.rol === "Admin") {
    return <Navigate to="/" />
  }
  return <>
    <div className="min-h-screen flex items-center justify-center  bg-gradient-to-r from-blue-100 to-purple-200 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full sm:p-10">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Olvidaste tu contraseña</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input type="email" id="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Ingresa tu correo electrónico"
              className="w-full px-4 py-3 border border-gray-300 rounded-md " required />
          </div>
          <div className="px-2 flex justify-end items-center  text-sm text-grey-500">
            <Link to="/login" type="button" className="text-blue-600 hover:underline">¿Recordar contraseña?</Link>
          </div>
          <div className="px-2">
            <button type="submit"
              className="w-full flex justify-center items-center gap-2 rounded-lg bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-semibold"
              disabled={loading}
            >
              {loading ? (<>
                <div className="w-5 h-5 rounded-full border-white border-t-transparent bg-white animate-spin"></div>
                <span>Solicitando por email...</span>
              </>) : ("Enviar enlace de restablecimiento")}
            </button>
          </div>
          <div className="px-2">
            <Link to="/login" className="text-blue-600 hover:underline block text-center rounded-lg bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-semibold">Volver al inicio</Link>
          </div>
        </form>
      </div>
    </div>
  </>;
};

export default ForgotPassword;
