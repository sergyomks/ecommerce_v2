import { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { obtenerUsuario } from "./store/slices/authSlice";
import { ThemeProvider } from "./contexts/ThemeProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Layout/Navbar";
import Sidebar from "./components/Layout/Sidebar";
import SearchOverlay from "./components/Layout/SearchOverlay";
import CartSidebar from "./components/Layout/CartSidebar";
import ProfilePanel from "./components/Layout/ProfilePanel";
import LoginModal from "./components/Layout/LoginModal";
import Footer from "./components/Layout/Footer";

import Index from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Payment from "./pages/Payment";
import About from "./pages/About";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import Wishlist from "./pages/Wishlist";
import NotFound from "./pages/NotFound";
import { Loader } from "lucide-react";
import { buscarTodosProductos } from "./store/slices/productSlice";
const AdminLayout = lazy(() =>
  import("./admin/AdminApp").then((m) => ({ default: m.AdminLayout }))
);
const AdminShell = lazy(() =>
  import("./admin/AdminApp").then((m) => ({ default: m.AdminShell }))
);
const AdminLogin = lazy(() => import("./admin/pages/Login"));
const AdminForgotPassword = lazy(() => import("./admin/pages/ForgotPassword"));
const AdminResetPassword = lazy(() => import("./admin/pages/ResetPassword"));

const PantallaCarga = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader className="size-10 animate-spin" />
  </div>
);

const StoreLayout = () => {
  const { authUser, isCheckingAuth } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { products } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(
      buscarTodosProductos({
        categoria: "",
        precio: "0-20000",
        buscar: "",
        calificaciones: "",
        disponible: "",
        pagina: 1,
        limite: 24,
      })
    );
  }, [dispatch]);

  if ((isCheckingAuth && !authUser) || !products) {
    return (
      <ThemeProvider>
        <PantallaCarga />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div className="store-page pt-[4.5rem] md:pt-[6.75rem]">
        <Navbar />
        <Sidebar />
        <SearchOverlay />
        <CartSidebar />
        <ProfilePanel />
        <LoginModal />
        <Outlet />
        <Footer />
      </div>
    </ThemeProvider>
  );
};

const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(obtenerUsuario());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route
          path="/admin"
          element={
            <Suspense fallback={<PantallaCarga />}>
              <AdminLayout />
            </Suspense>
          }
        >
          <Route path="login" element={<AdminLogin />} />
          <Route path="contrasena/reiniciar" element={<AdminForgotPassword />} />
          <Route
            path="contrasena/reiniciar/:token"
            element={<AdminResetPassword />}
          />
          <Route index element={<AdminShell />} />
        </Route>
        <Route element={<StoreLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/contrasena/reiniciar/:token" element={<Index />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
