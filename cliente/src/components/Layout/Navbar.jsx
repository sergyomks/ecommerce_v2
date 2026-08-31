import { Menu, User, ShoppingBag, Sun, Moon, Search, Heart, ChevronDown } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  toggleAuthPopup,
  openAuthPopup,
  toggleCart,
  toggleSidebar,
} from "../../store/slices/popupSlice";
import { fetchWishlist } from "../../store/slices/wishlistSlice";
import { fetchCategorias } from "../../store/slices/categorySlice";
import { axiosInstance } from "../../lib/axios";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart } = useSelector((state) => state.cart);
  const { authUser } = useSelector((state) => state.auth);
  const { categorias } = useSelector((state) => state.category);
  const wishlistCount = useSelector((state) => state.wishlist.items.length);
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("");
  const [subcategorias, setSubcategorias] = useState([]);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  let cartItemsCount = 0;
  if (cart) {
    cartItemsCount = cart.reduce((total, item) => total + item.cantidad, 0);
  }

  useEffect(() => {
    if (authUser) dispatch(fetchWishlist());
  }, [authUser, dispatch]);

  useEffect(() => {
    dispatch(fetchCategorias());
    fetchSubcategorias();
  }, [dispatch]);

  const fetchSubcategorias = async () => {
    try {
      const res = await axiosInstance.get("/subcategoria");
      setSubcategorias(res.data.subcategorias || []);
    } catch (error) {
      console.error("Error al cargar subcategorías:", error);
      setSubcategorias([]);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    if (category) params.set("category", category);
    navigate(`/products${params.toString() ? `?${params}` : ""}`);
  };

  const openAuth = (mode) => {
    if (authUser) {
      dispatch(toggleAuthPopup());
      return;
    }
    dispatch(openAuthPopup(mode));
  };

  return (
    <header className="fixed left-0 w-full top-0 z-50">
      <div className="hidden md:flex h-9 items-center justify-between store-wrap text-[11px] store-topbar" style={{ background: "var(--store-topbar)", color: "var(--store-muted)" }}>
        <span><Link
              to="/"
              className="font-semibold hover:underline"
              style={{ color: "var(--store-text)" }}
            >
              INICIO
            </Link></span>
        <div className="flex items-center gap-5">
          <Link to="/about" className="hover:opacity-80" style={{ color: "var(--store-muted)" }}>
            Sobre Tec System
          </Link>
          <Link to="/contact" className="hover:opacity-80" style={{ color: "var(--store-muted)" }}>
            Atención
          </Link>
          <Link to="/products" className="hover:opacity-80" style={{ color: "var(--store-muted)" }}>
            Productos
          </Link>
          {authUser ? (
            <button type="button" onClick={() => dispatch(toggleAuthPopup())} className="store-text hover:opacity-80">
              {authUser.nombre}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => openAuth("registrar")} className="hover:opacity-80">
                Regístrate
              </button>
              <button type="button" onClick={() => openAuth("iniciar sesion")} className="hover:opacity-80">
                Iniciar sesión
              </button>
            </>
          )}
        </div>
      </div>
      <nav className="store-nav border-b">
        <div className="store-wrap">
          <div className="flex items-center gap-3 h-[68px]">
            <button
              type="button"
              onClick={() => dispatch(toggleSidebar())}
              className="p-2 rounded-lg store-hover lg:hidden"
            >
              <Menu className="w-6 h-6 store-text" />
            </button>
            <Link
              to="/"
              className="shrink-0 border px-2.5 py-1 text-[18px] md:text-[20px] font-extrabold store-text tracking-tight"
              style={{ borderColor: "var(--store-text)" }}
            >
              TecSystem.com
            </Link>
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 mx-4 lg:mx-8 h-12 rounded-full border store-surface overflow-hidden shadow-sm"
              style={{ borderColor: "var(--store-border)" }}
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="h-full pl-5 pr-8 bg-transparent text-sm store-text outline-none min-w-[168px] flex items-center gap-2 hover:bg-[var(--store-hover)] transition-colors"
                >
                  <span className="truncate">{category || "Todas las categorías"}</span>
                  <ChevronDown className={`w-4 h-4 store-muted transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {categoryDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setCategoryDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-64 max-h-96 overflow-y-auto rounded-xl border shadow-lg store-surface z-20" style={{ borderColor: "var(--store-border)" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setCategory("");
                          setCategoryDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--store-hover)] transition-colors ${!category ? 'store-ink font-medium' : 'store-text'}`}
                      >
                        Todas las categorías
                      </button>
                      {categorias.map((cat) => {
                        const subcats = subcategorias.filter(s => s.id_categoria === cat.id);
                        return (
                          <div key={cat.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setCategory(cat.nombre);
                                setCategoryDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2.5 text-sm font-medium border-t hover:bg-[var(--store-hover)] transition-colors ${category === cat.nombre ? 'store-ink' : 'store-text'}`}
                              style={{ borderColor: "var(--store-border)" }}
                            >
                              {cat.nombre}
                            </button>
                            {subcats.map((subcat) => (
                              <button
                                key={subcat.id}
                                type="button"
                                onClick={() => {
                                  setCategory(subcat.nombre);
                                  setCategoryDropdownOpen(false);
                                }}
                                className={`w-full text-left px-8 py-2 text-sm hover:bg-[var(--store-hover)] transition-colors ${category === subcat.nombre ? 'store-ink font-medium' : 'store-muted'}`}
                              >
                                ↳ {subcat.nombre}
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              <div className="w-px h-6 self-center" style={{ background: "var(--store-border)" }} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="flex-1 bg-transparent px-4 text-sm outline-none store-text placeholder:text-[#9CA3AF]"
              />
              <button type="submit" className="px-4 store-muted hover:text-[#ff4d6d]" aria-label="Buscar">
                <Search className="w-5 h-5" />
              </button>
            </form>
            <div className="flex items-center gap-1 ml-auto">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg store-hover"
                aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 store-text" />
                ) : (
                  <Moon className="w-5 h-5 store-text" />
                )}
              </button>
              <Link to="/wishlist" className="relative p-2 rounded-lg store-hover">
                <Heart className="w-5 h-5 store-text" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#ff4d6d] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={() => openAuth("iniciar sesion")}
                className="p-2 rounded-lg store-hover"
                aria-label="Cuenta"
              >
                <User className="w-5 h-5 store-text" />
              </button>
              <button
                type="button"
                onClick={() => dispatch(toggleCart())}
                className="relative p-2 rounded-lg store-hover"
                aria-label="Bolsa de compras"
              >
                <ShoppingBag className="w-5 h-5 store-text" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#ff4d6d] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <form onSubmit={handleSearch} className="md:hidden pb-3">
            <div className="flex h-11 rounded-full border store-surface overflow-hidden" style={{ borderColor: "var(--store-border)" }}>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="flex-1 bg-transparent px-4 text-sm outline-none store-text"
              />
              <button type="submit" className="px-4 store-muted" aria-label="Buscar">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
