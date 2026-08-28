import React, { useState, useEffect } from "react";
import defaultAvatar from "../assets/avatar.jpg";
import Header from "./Header";
import { useDispatch, useSelector } from "react-redux";
import {
  actualizarPerfil,
  actualizarContraseña,
} from "../../store/slices/authSlice";

const Profile = () => {
  const { authUser: user, isUpdatingProfile, isUpdatingPassword } = useSelector(
    (state) => state.auth
  );
  const loading = isUpdatingProfile || isUpdatingPassword;
  const [editData, setEditData] = useState({ nombre: user?.nombre || "", email: user?.email || "" });
  const [avatar, setAvatar] = useState(null);
  const [updatingSection, setUpdatingSection] = useState("");
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    if (user) {
      setEditData({ nombre: user.nombre || "", email: user.email || "" });
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);
  };
  const handleProfileChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };
  const dispatch = useDispatch();

  const updateProfile = () => {
    const formData = new FormData();
    formData.append("nombre", editData.nombre);
    formData.append("email", editData.email);
    if (avatar) {
      formData.append("imagen", avatar);
    }
    setUpdatingSection("profile");
    dispatch(actualizarPerfil(formData));
  };

  const updatePassword = () => {
    const data = {
      contraseñaActual: passwordData.currentPassword,
      nuevaContraseña: passwordData.newPassword,
      confirmarContraseña: passwordData.confirmPassword
    };
    setUpdatingSection("password");
    dispatch(actualizarContraseña(data));
  };

  const avatarPreview = avatar ? URL.createObjectURL(avatar) : (user?.imagen?.url || defaultAvatar);

  return <>
    <main className="admin-page">
      <Header />
      <p className="text-sm text-[#6b8a8a] -mt-3 mb-6">Gestiona tu perfil.</p>
      <div className="max-w-4xl md:px-4 py-8">
        <div className="admin-card p-6 flex-col md:flex-row items-center gap-6 mb-10">
          <img src={avatarPreview} alt={user?.nombre || "Avatar"}
            className="w-32 h-32 rounded-full object-cover border"
            loading="lazy" />
          <div>
            <p className="text-xl font-medium">Nombre: {user?.nombre}</p>
            <p className="text-md text-[#6b8a8a]">Email: {user?.email}</p>
            <p className="text-md text-[#1aa89a]">Rol: {user?.rol}</p>
          </div>
        </div>
        <div className="admin-card p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4 text-[#16343a]">Editar perfil</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="nombre" value={editData.nombre}
              onChange={handleProfileChange} placeholder="Tu nombre" className="admin-input" />
            <input type="email" name="email" value={editData.email}
              onChange={handleProfileChange} placeholder="Tu email" className="admin-input" />
            <input type="file" name="avatar" onChange={handleAvatarChange} className="admin-input col-span-1 md:col-span-2" />
          </div>
          <button onClick={updateProfile} className="admin-btn mt-4" disabled={loading}>
            {loading && updatingSection === "profile" ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Actualizando perfil...</span>
              </>
            ) : (
              "Actualizar Perfil"
            )}
          </button>
        </div>
        <div className="admin-card p-6">
          <h3 className="text-xl font-semibold mb-4 text-[#16343a]">Actualizar contraseña</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange}
              placeholder="Contraseña actual"
              className="admin-input" />
            <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange}
              placeholder="Nueva contraseña"
              className="admin-input" />
            <input type="password" name="confirmPassword" value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Confirmar contraseña"
              className="admin-input" />
            <button onClick={updatePassword} className="admin-btn" disabled={loading}>
              {loading && updatingSection === "password" ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Actualizando contraseña...</span>
                </>
              ) : (
                "Actualizar Contraseña"
              )}
            </button>
          </div>
        </div>

      </div>
    </main>
  </>;
};

export default Profile;
