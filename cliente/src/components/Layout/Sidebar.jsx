import React from "react";
import {
  X,
  Home,
  Package,
  Info,
  HelpCircle,
  ShoppingCart,
  List,
  Phone,
  LogIn,
  UserPlus,
  LogOut,

} from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleSidebar, openAuthPopup } from "../../store/slices/popupSlice";
import { cerrarSesion } from "../../store/slices/authSlice";

const Sidebar = () => {
  const {authUser}=useSelector(state=>state.auth);
  const dispatch=useDispatch();
  const menuItems=[
    {nombre: "Inicio", icon: Home, path:"/"},
    {nombre: "Productos", icon: Package, path:"/products"},
    {nombre: "Acerca de", icon: Info, path:"/about"},
    {nombre: "Preguntas Frecuentes", icon: HelpCircle, path:"/faq"},
    {nombre: "Contactos", icon: Phone, path:"/contact"},
    {nombre: "Cart", icon: ShoppingCart, path:"/cart"},
    authUser && {nombre:"mis pedidos", icon: List, path:"/orders"}
  ];
  const {isSidebarOpen}=useSelector((state)=>state.popup);
  if(!isSidebarOpen)return null;

  const handleOpenAuth = (mode) => {
    dispatch(openAuthPopup(mode));
    dispatch(toggleSidebar());
  };

  const handleLogout = () => {
    dispatch(cerrarSesion());
    dispatch(toggleSidebar());
  };

  return <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={()=>dispatch(toggleSidebar())}>
    </div>

    <div className="fixed left-0 top-0 h-full w-[85vw] max-w-80 z-50 store-surface shadow-xl animate-slide-in-left overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: "var(--store-border)" }}>
        <h2 className="text-xl font-semibold store-text">Menú</h2>
        <button onClick={()=>dispatch(toggleSidebar())} className="p-2 rounded-lg store-hover">
          <X className="w-5 h-5 text-primary"></X>
        </button>
      </div>
      <nav className="p-6">
        <ul className="space-y-2">
            {menuItems.filter(Boolean).map((item)=>{
              return(
                <li key={item.nombre}>
                    <Link to={item.path} onClick={()=>dispatch(toggleSidebar())}
                    className="flex items-center space-x-3 p-3 rounded-xl store-hover store-text group">
                      <item.icon className="w-5 h-5 group-hover:text-primary"/>
                      <span className="font-medium">{item.nombre}</span>
                    </Link>
                </li>
              )
            })}
        </ul>

        {!authUser ? (
          <div className="mt-6 pt-4 border-t space-y-2" style={{ borderColor: "var(--store-border)" }}>
            <button
              onClick={() => handleOpenAuth("iniciar sesion")}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl font-semibold text-white"
              style={{ background: "var(--store-primary, #1d4e89)" }}
            >
              <LogIn className="w-5 h-5" />
              Iniciar sesión
            </button>
            <button
              onClick={() => handleOpenAuth("registrar")}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl font-semibold border"
              style={{ borderColor: "var(--store-border)", color: "var(--store-text)" }}
            >
              <UserPlus className="w-5 h-5" />
              Regístrate
            </button>
          </div>
        ) : (
          <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--store-border)" }}>
            <div className="px-3 py-2 mb-2">
              <p className="text-sm store-muted">Sesión iniciada como</p>
              <p className="font-semibold store-text truncate">{authUser.nombre}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl font-semibold border"
              style={{ borderColor: "var(--store-border)", color: "var(--store-text)" }}
            >
              <LogOut className="w-5 h-5" />
              Cerrar sesión
            </button>
          </div>
        )}
      </nav>
    </div>

  </>;
};

export default Sidebar;
