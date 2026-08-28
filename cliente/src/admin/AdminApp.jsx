import { useEffect } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Loader } from "lucide-react";
import SideBar from "./components/SideBar";
import Dashboard from "./components/Dashboard";
import Products from "./components/Products";
import Orders from "./components/Orders";
import Profile from "./components/Profile";
import Users from "./components/Users";
import ContactMessages from "./components/ContactMessages";
import Categories from "./components/Categories";
import Coupons from "./components/Coupons";
import ShippingRates from "./components/ShippingRates";
import Reportes from "./components/Reportes";
import { getDashboardStats, fetchAllUsers } from "./store/slices/adminSlice";
import { fetchAllProducts } from "./store/slices/productsSlice";
import { fetchCategoriasActivas } from "./store/slices/categorySlice";

export const AdminLayout = () => {
  return (
    <div className="admin-shell">
      <Outlet />
    </div>
  );
};

export const AdminShell = () => {
  const { openedComponent } = useSelector((state) => state.extra);
  const { authUser, isCheckingAuth } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (authUser?.rol === "Admin") {
      dispatch(getDashboardStats());
      dispatch(fetchAllProducts());
      dispatch(fetchCategoriasActivas());
      dispatch(fetchAllUsers());
    }
  }, [authUser, dispatch]);

  if (isCheckingAuth && !authUser) {
    return (
      <div className="admin-shell flex items-center justify-center !p-0">
        <Loader className="size-10 animate-spin text-[#1aa89a]" />
      </div>
    );
  }

  if (!authUser || authUser.rol !== "Admin") {
    return <Navigate to="/admin/login" replace />;
  }

  const renderDashboardContent = () => {
    switch (openedComponent) {
      case "Dashboard":
        return <Dashboard />;
      case "Users":
        return <Users />;
      case "Products":
        return <Products />;
      case "Orders":
        return <Orders />;
      case "Categories":
        return <Categories />;
      case "Coupons":
        return <Coupons />;
      case "ShippingRates":
        return <ShippingRates />;
      case "Reportes":
        return <Reportes />;
      case "ContactMessages":
        return <ContactMessages />;
      case "Profile":
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="admin-panel">
      <SideBar />
      {renderDashboardContent()}
    </div>
  );
};
