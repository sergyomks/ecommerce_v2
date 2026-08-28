import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SideBar from "./components/SideBar";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import Dashboard from "./components/Dashboard";
import Products from "./components/Products";
import Orders from "./components/Orders";
import Profile from "./components/Profile";
import Users from "./components/Users";
import ContactMessages from "./components/ContactMessages";
import Categories from "./components/Categories";
import Coupons from "./components/Coupons";
import ShippingRates from "./components/ShippingRates";
import { useEffect } from "react";
import { getUser } from "./store/slices/authSlice";
import { fetchAllUsers, getDashboardStats } from "./store/slices/adminSlice";
import { fetchAllProducts } from "./store/slices/productsSlice";
import { fetchCategoriasActivas } from "./store/slices/categorySlice";

function App() {
  const { openedComponent } = useSelector((state) => state.extra);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(getUser());
  }, []);
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getDashboardStats());
      dispatch(fetchAllProducts());
      dispatch(fetchCategoriasActivas());
    }
  }, [isAuthenticated]);
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
      case "ContactMessages":
        return <ContactMessages />;
      case "Profile":
        return <Profile />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/contrasena/reiniciar" element={<ForgotPassword />} />
        <Route path="/contrasena/reiniciar/:token" element={<ResetPassword />} />

        {/* Protected Admin Route */}
        <Route
          path="/"
          element={
            isAuthenticated && user?.rol === "Admin" ? (
              <div className="flex min-h-screen">
                <SideBar />
                {renderDashboardContent()}
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
      <ToastContainer theme="dark" />
    </Router>
  );
}

export default App;
