import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useParams } from "react-router-dom";
import { Loader } from "lucide-react";
import { restaurarContraseña } from "../../store/slices/authSlice";

const ResetPassword = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    contrasena: "",
    confirmarContrasena: "",
  });
  const { authUser, isCheckingAuth, isUpdatingPassword } = useSelector(
    (state) => state.auth
  );

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(
      restaurarContraseña({
        token,
        contrasena: formData.contrasena,
        confirmarContrasena: formData.confirmarContrasena,
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
        <h2 className="text-2xl font-extrabold text-center mb-6 text-[#16343a]">
          Restablecer contraseña
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="contrasena" className="admin-label">
              Nueva Contraseña
            </label>
            <input
              type="password"
              id="contrasena"
              name="contrasena"
              value={formData.contrasena}
              onChange={handleChange}
              className="admin-input"
              required
            />
          </div>
          <div>
            <label htmlFor="confirmarContrasena" className="admin-label">
              Confirmar contraseña
            </label>
            <input
              type="password"
              id="confirmarContrasena"
              name="confirmarContrasena"
              value={formData.confirmarContrasena}
              onChange={handleChange}
              className="admin-input"
              required
            />
          </div>
          <button
            type="submit"
            className="admin-btn w-full"
            disabled={isUpdatingPassword}
          >
            {isUpdatingPassword ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Restableciendo contraseña...</span>
              </>
            ) : (
              "Restablecer contraseña"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
