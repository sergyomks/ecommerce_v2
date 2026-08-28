import React from "react";
import {
  Bell,
  LayoutDashboard,
  ListOrdered,
  Package,
  Users,
  Menu,
  User,
  LogOut,
  MoveLeft,
  MessageSquare,
  Tags,
  TicketPercent,
  Truck,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { logout } from "../store/slices/authSlice";
import { toggleNavbar, toggleComponent } from "../store/slices/extraSlice";

const SideBar = () => {
  const links = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard />,
      component: "Dashboard",
    },
    {
      title: "Pedidos",
      icon: <ListOrdered />,
      component: "Orders",
    },
    {
      title: "Productos",
      icon: <Package />,
      component: "Products",
    },
    {
      title: "Categorías",
      icon: <Tags />,
      component: "Categories",
    },
    {
      title: "Cupones",
      icon: <TicketPercent />,
      component: "Coupons",
    },
    {
      title: "Envíos",
      icon: <Truck />,
      component: "ShippingRates",
    },
    {
      title: "Usuarios",
      icon: <Users />,
      component: "Users",
    },
    {
      title: "Mensajes",
      icon: <MessageSquare />,
      component: "ContactMessages",
    },
    {
      title: "Perfil",
      icon: <User />,
      component: "Profile",
    },
  ];

  const { isNavbarOpened, openedComponent } = useSelector((state) => state.extra);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const handleLogout = () => {
    dispatch(logout());
  };
  if (!isAuthenticated) return <Navigate to="/login" />;

  const activeLink = links.findIndex((item) => item.component === openedComponent);

  return <>
    <aside className={` ${isNavbarOpened ? "left-[10px]" : "-left-full"} fixed  h-[97.5%] w-64 bg-white shadow-2xl rounded-xl z-10 mt-[10px] transition-all duration-300 shadow-lg p-4 space-y-4 flex-col  justify-between md:left-[10px] `}>
      <nav className="space-y-2">
        <div className="flex flex-col gap-2 py-2">
          <h2 className="flex items-center justify-between text-xl font-bold">
            <span>Panel de Admin</span>
            <MoveLeft className="block md:hidden" onClick={() => dispatch(toggleNavbar())} />
          </h2>
          <hr />
        </div>
        {
          links.map((item, index) => {
            return (
              <button key={index} onClick={() => {
                dispatch(toggleComponent(item.component));
                dispatch(toggleNavbar());
              }}
                className={` ${activeLink === index ? "bg-dark-grandient text-white" : "hover:bg-gray-200 text-gray-700"} w-full  transition-all rounded-md duration-300 cursor-pointer px-3 py-2 flex items-center gap-2`}>
                {item.icon}
                {item.title}
              </button>
            )
          })
        }
      </nav>
      <button onClick={handleLogout}
        className="rounded-md cursor-pointer px-3 py-2 flex bg-red-gradient text-white  items-center gap-2">
        <LogOut />
        Cerrar sesión
      </button>
    </aside>
  </>;
};

export default SideBar;
