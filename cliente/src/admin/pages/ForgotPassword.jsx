import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { contraseñaOlvidado } from "../../store/slices/authSlice";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const dispatch = useDispatch();
  const { authUser, isCheckingAuth, isRequestingForToken } = useSelector(
    (state) => state.auth
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(
      contraseñaOlvidado({
        email,
        destino: "admin",
      })
    );
    setEmail("");
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
        <h2 className="text-2xl font-extrabold text-center mb-6 text-[#16343a]">
          Olvidaste tu contraseña
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="admin-label">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingresa tu correo electrónico"
              className="admin-input"
              required
            />
          </div>
          <button
            type="submit"
            className="admin-btn w-full"
            disabled={isRequestingForToken}
          >
            {isRequestingForToken ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Solicitando por email...</span>
              </>
            ) : (
              "Enviar enlace de restablecimiento"
            )}
          </button>
          <Link to="/admin/login" className="admin-btn-ghost w-full">
            Volver al login
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
