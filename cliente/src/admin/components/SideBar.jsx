import { FileSpreadsheet, LayoutDashboard, ListOrdered, LogOut, MessageSquare, MoveLeft, Package, Tags, TicketPercent, Truck, User, Users } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { cerrarSesion } from "../../store/slices/authSlice";
import { toggleNavbar, toggleComponent } from "../store/slices/extraSlice";

const SideBar = () => {
  const links = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      component: "Dashboard",
    },
    {
      title: "Pedidos",
      icon: ListOrdered,
      component: "Orders",
    },
    {
      title: "Productos",
      icon: Package,
      component: "Products",
    },
    {
      title: "Categorías",
      icon: Tags,
      component: "Categories",
    },
    {
      title: "Cupones",
      icon: TicketPercent,
      component: "Coupons",
    },
    {
      title: "Envíos",
      icon: Truck,
      component: "ShippingRates",
    },
    {
      title: "Usuarios",
      icon: Users,
      component: "Users",
    },
    {
      title: "Reportes",
      icon: FileSpreadsheet,
      component: "Reportes",
    },
    {
      title: "Mensajes",
      icon: MessageSquare,
      component: "ContactMessages",
    },
    {
      title: "Perfil",
      icon: User,
      component: "Profile",
    },
  ];

  const { isNavbarOpened, openedComponent } = useSelector((state) => state.extra);
  const { authUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleLogout = () => {
    dispatch(cerrarSesion({ skipPopup: true })).finally(() => {
      navigate("/admin/login", { replace: true });
    });
  };
  if (!authUser || authUser.rol !== "Admin") {
    return <Navigate to="/admin/login" replace />;
  }

  const activeLink = links.findIndex((item) => item.component === openedComponent);

  return (
    <>
      {isNavbarOpened && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-20 bg-[#16343a]/20 backdrop-blur-[2px] md:hidden"
          onClick={() => dispatch(toggleNavbar())}
        />
      )}
      <aside
        className={`${
          isNavbarOpened ? "left-3" : "-left-[19rem]"
        } fixed md:static z-30 top-3 bottom-3 md:top-0 md:bottom-0 md:left-0 w-[16.25rem] md:h-auto flex flex-col justify-between p-5 transition-all duration-300 bg-white/90 md:bg-transparent backdrop-blur-xl md:backdrop-blur-none rounded-[28px] md:rounded-none shadow-xl md:shadow-none md:border-r md:border-white/40`}
      >
        <nav className="space-y-1.5">
          <div className="flex items-center justify-between px-2 pb-6 pt-1">
            <h2 className="text-[22px] font-extrabold tracking-tight text-[#16343a]">
              C.P.N.T SAC
            </h2>
            <MoveLeft
              className="block md:hidden w-5 h-5 text-[#3d5c62] cursor-pointer"
              onClick={() => dispatch(toggleNavbar())}
            />
          </div>
          {links.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeLink === index;
            return (
              <button
                key={item.component}
                type="button"
                onClick={() => {
                  dispatch(toggleComponent(item.component));
                  if (isNavbarOpened) dispatch(toggleNavbar());
                }}
                className={`${
                  isActive
                    ? "admin-nav-active text-white"
                    : "text-[#3d5c62] hover:bg-white/55"
                } w-full transition-all rounded-2xl duration-300 cursor-pointer px-3.5 py-2.5 flex items-center gap-3 text-[15px] font-medium`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                {item.title}
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 rounded-2xl cursor-pointer px-3.5 py-2.5 flex items-center gap-3 text-[15px] font-medium text-[#c45c5c] hover:bg-white/55 transition-all"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={1.8} />
          Cerrar sesión
        </button>
      </aside>
    </>
  );
};

export default SideBar;
