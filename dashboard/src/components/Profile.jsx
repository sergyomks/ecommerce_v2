import React, { useState, useEffect } from "react";
import defaultAvatar from "../assets/avatar.jpg";
import Header from "./Header";
import { useDispatch, useSelector } from "react-redux";
import { updateAdminProfile, updateAdminPassword } from "../store/slices/authSlice";

const Profile = () => {
  const { user, loading } = useSelector((state) => state.auth);
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
    dispatch(updateAdminProfile(formData));
  };

  const updatePassword = () => {
    const data = {
      contraseñaActual: passwordData.currentPassword,
      nuevaContraseña: passwordData.newPassword,
      confirmarContraseña: passwordData.confirmPassword
    };
    setUpdatingSection("password");
    dispatch(updateAdminPassword(data));
  };

  const avatarPreview = avatar ? URL.createObjectURL(avatar) : (user?.imagen?.url || defaultAvatar);

  return <>
    <main className="p-[10px] pl-[10px] md:pl-[17rem] w-full">
      <div className="flex-1 md:p-6 mb:pb-0">
        <Header />
        <h1 className="text-2xl font-bold">Perfil</h1>
        <p className="text-sm text-gray-600 mb-6">Gestiona tu perfil.</p>
      </div>
      <div className="max-w-4xl md:px-4 py-8">
        <div className="bg-white shadow-md rounded-2xl p-6 flex-col md:flex-row items-center gap-6 mb-10">
          <img src={avatarPreview} alt={user?.nombre || "Avatar"}
            className="w-32 h-32 rounded-full object-cover border"
            loading="lazy" />
          <div>
            <p className="text-xl font-medium">Nombre: {user?.nombre}</p>
            <p className="text-md text-gray-600">Email: {user?.email}</p>
            <p className="text-md text-blue-600">Rol: {user?.rol}</p>
          </div>
        </div>
        <div className="bg-gray-100 p-6 rounded-2xl shadow-md mb-10">
          <h3 className="text-xl font-semibold mb-4">Editar perfil</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="nombre" value={editData.nombre}
              onChange={handleProfileChange} placeholder="Tu nombre" className="p-2 border rounded-md" />
            <input type="email" name="email" value={editData.email}
              onChange={handleProfileChange} placeholder="Tu email" className="p-2 border rounded-md" />
            <input type="file" name="avatar" onChange={handleAvatarChange} className="p-2 border rounded-md col-span-1 md:col-span-2" />

          </div>
          <button onClick={updateProfile} className="flex justify-center px-6 mt-4 items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold py-3 transition-all" disabled={loading}>
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
        <div className="bg-gray-100 p-6 rounded-2xl shadow-md">
          <h3 className="text-xl font-semibold mb-4">Actualizar contraseña</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange}
              placeholder="Contraseña actual"
              className="p-2 border rounded-md" />
            <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange}
              placeholder="Nueva contraseña"
              className="p-2 border rounded-md" />
            <input type="password" name="confirmPassword" value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Confirmar contraseña"
              className="p-2 border rounded-md" />
            <button onClick={updatePassword} className="flex justify-center px-6 mt-4 items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold py-3 transition-all" disabled={loading}>
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
