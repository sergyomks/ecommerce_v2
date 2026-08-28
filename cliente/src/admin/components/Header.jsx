import { useDispatch, useSelector } from "react-redux";
import avatar from "../assets/avatar.jpg";
import { Bell, Menu, Search } from "lucide-react";
import { toggleNavbar, toggleComponent } from "../store/slices/extraSlice";

const PAGE_TITLES = {
  Dashboard: "Dashboard",
  Orders: "Pedidos",
  Products: "Productos",
  Categories: "Categorías",
  Coupons: "Cupones",
  ShippingRates: "Envíos",
  Users: "Usuarios",
  ContactMessages: "Mensajes",
  Profile: "Perfil",
};

const Header = () => {
  const { authUser: user } = useSelector((state) => state.auth);
  const { openedComponent } = useSelector((state) => state.extra);
  const dispatch = useDispatch();
  const firstName = user?.nombre?.split(" ")[0] || "Admin";
  const title = PAGE_TITLES[openedComponent] || openedComponent;

  return (
    <header className="flex justify-between items-start gap-4 mb-6">
      <div>
        <p className="text-sm font-medium text-[#2a9d8f] mb-1">
          Bienvenido de nuevo, {firstName} 👋
        </p>
        <h1 className="text-[28px] md:text-[32px] leading-none font-extrabold text-[#16343a] tracking-tight">
          {title}
        </h1>
      </div>
      <div className="flex gap-2 sm:gap-3 items-center">
        <Menu
          className="block md:hidden w-6 h-6 text-[#16343a] cursor-pointer"
          onClick={() => dispatch(toggleNavbar())}
        />
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-white/70 border border-white/80 shadow-sm flex items-center justify-center text-[#3d5c62] hover:bg-white transition"
          aria-label="Buscar"
        >
          <Search className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => dispatch(toggleComponent("ContactMessages"))}
          className="w-10 h-10 rounded-full bg-white/70 border border-white/80 shadow-sm flex items-center justify-center text-[#3d5c62] hover:bg-white transition"
          aria-label="Notificaciones"
        >
          <Bell className="w-[18px] h-[18px]" strokeWidth={1.8} />
        </button>
        <button
          type="button"
          onClick={() => dispatch(toggleComponent("Profile"))}
          className="flex gap-2 items-center pl-1"
        >
          <img
            src={user?.imagen?.url || avatar}
            alt={user?.nombre || "Admin"}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/80"
          />
          <span className="hidden sm:block text-sm font-semibold text-[#16343a]">
            {user?.nombre || "Admin"}
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;
