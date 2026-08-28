import { useState, useEffect } from "react";
import { Search, Sparkles, Star, Filter } from "lucide-react";
import ProductCard from "../components/Products/ProductCard";
import Pagination from "../components/Products/Pagination";
import AISearchModal from "../components/Products/AISearchModal";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { buscarTodosProductos } from "../store/slices/productSlice";
import { fetchCategorias } from "../store/slices/categorySlice";
import { toggleAIModal } from "../store/slices/popupSlice";
import { useDebounce } from "../lib/useDebounce";
import { axiosInstance } from "../lib/axios";

const Products = () => {
  const { products, totalProducts } = useSelector((state) => state.product);
  const { categorias } = useSelector((state) => state.category);
  const [subcategorias, setSubcategorias] = useState([]);
  const useQuery = () => {
    return new URLSearchParams(useLocation().search);
  };
  const query = useQuery();
  const searchTerm = query.get('search');
  const searchCategory = query.get('category');
  const [searchQuery, setSearchQuery] = useState(searchTerm || "");
  const [selectedCategory, setSelectedCategory] = useState(searchCategory || "");
  const [precioRango, setPrecioRango] = useState([0, 20000]);
  const [selectedRating, setSelectedRating] = useState(0);
  const [disponible, setDisponible] = useState("");
  const [actualPage, setActualPage] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const dispatch = useDispatch();

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

  useEffect(() => {
    setSelectedCategory(searchCategory || "");
  }, [searchCategory]);

  useEffect(() => {
    setSearchQuery(searchTerm || "");
  }, [searchTerm]);

  const busquedaDiferida = useDebounce(searchQuery);
  const precioDiferido = useDebounce(`${precioRango[0]}-${precioRango[1]}`);

  useEffect(() => {
    setActualPage(1);
  }, [selectedCategory, busquedaDiferida, selectedRating, disponible, precioDiferido]);

  useEffect(() => {
    const peticion = dispatch(buscarTodosProductos({
      categoria: selectedCategory,
      precio: precioDiferido,
      buscar: busquedaDiferida,
      calificaciones: selectedRating,
      disponible: disponible,
      pagina: actualPage,
    }));
    return () => peticion.abort();
  }, [dispatch, selectedCategory, busquedaDiferida, selectedRating, disponible, precioDiferido, actualPage]);
  const totalPages = Math.ceil(totalProducts / 12);

  return <>
    <div className="min-h-screen">
      <div className="store-wrap py-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <button onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="lg:hidden mb-4 p-3 store-card flex items-center space-x-2"
          >
            <Filter className="w-5 h-5" />
            <span>Filtrar</span>
          </button>
          <div className={`lg:block ${isMobileFilterOpen ? 'block' : 'hidden'} w-full lg:w-80 space-y-6`}>
            <div className="store-card p-6">
              <h2 className="text-xl font-semibold text-foreground mb-6">Filtrar</h2>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-foreground mb-3">Precio rango</h3>
                <div className="space-y-2">
                  <input type="range" min={0} max={20000} value={precioRango[1]} onChange={(e) => setPrecioRango([precioRango[0], parseInt(e.target.value)])} className="w-full" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>min: S/ {precioRango[0]}</span>
                    <span>MAX: S/ {precioRango[1]}</span>
                  </div>
                </div>

              </div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-foreground mb-3">Calificaciones</h3>
                <div className="space-y-2">
                  {
                    [4, 3, 2, 1].map((rating) => {
                      return (
                        <button key={rating} onClick={() => setSelectedRating(selectedRating === rating ? 0 : rating)} className={` flex items-center space-x-2 w-full p-2 rounded-xl ${selectedRating === rating ? 'bg-[var(--store-ink)] text-[var(--store-surface)]' : 'store-hover'} `}>
                          {[...Array(rating)].map((_, i) => {
                            return (
                              <Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
                            )
                          })}
                        </button>
                      )
                    })
                  }
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-foreground mb-3">Disponibilidad</h3>
                <div className="space-y-2">
                  {
                    ["en_stock", "limitado", "agotado"].map((status) => {
                      return (
                        <button key={status} onClick={() => setDisponible(disponible === status ? "" : status)}
                          className={` w-full p-2 text-left rounded-xl ${disponible === status ? 'bg-[var(--store-ink)] text-[var(--store-surface)]' : 'store-hover'} `}>
                          {
                            status == "en_stock" ? "En Stock" : status == "limitado" ? "Limitado" : "Agotado"
                          }
                        </button>
                      )
                    })
                  }
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-medium text-foreground mb-3">Categoria</h3>
                <div className="space-y-2">
                  <button onClick={() => setSelectedCategory("")} className={`w-full p-2 text-left rounded-xl ${!selectedCategory ? 'bg-[var(--store-ink)] text-[var(--store-surface)]' : 'store-hover'} `}>Todas Categorias</button>
                  {
                    categorias.map((category) => {
                      const subcats = subcategorias.filter(s => s.id_categoria === category.id && s.activo);
                      return (
                        <div key={category.id} className="space-y-1">
                          <button onClick={() => setSelectedCategory(category.nombre)}
                            className={` w-full p-2 text-left rounded-xl font-semibold ${selectedCategory === category.nombre ? 'bg-[var(--store-ink)] text-[var(--store-surface)]' : 'store-hover'} `}>
                            {category.nombre}
                          </button>
                          {subcats.length > 0 && (
                            <div className="pl-4 space-y-1">
                              {subcats.map((subcat) => (
                                <button
                                  key={subcat.id}
                                  onClick={() => setSelectedCategory(subcat.nombre)}
                                  className={`w-full p-2 text-left rounded-xl text-sm ${selectedCategory === subcat.nombre ? 'bg-[var(--store-ink)] text-[var(--store-surface)]' : 'store-hover'} `}
                                >
                                  ↳ {subcat.nombre}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-8 flex max-[400px]:flex-col items-center gap-2">
              <div className="relative w-[-webkit-fill-available]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground"></Search>
                <input type="text" placeholder="buscar producto"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="store-input pl-10"
                />
              </div>
              <button
                className="store-btn min-w-[132px] max-[440px]:min-w-full"
                onClick={() => dispatch(toggleAIModal())}
              >
                <span className="flex justify-center items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Buscar con IA</span>
                </span>
              </button>

            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {products?.map((product) => {
                return (
                  <ProductCard key={product.id} product={product} />
                )
              })}

            </div>
            {
              totalPages > 1 && (
                <div className="mt-10">
                  <Pagination
                    currentPage={actualPage}
                    totalPages={totalPages}
                    onPageChange={setActualPage}
                  />
                </div>
              )
            }
            {
              products.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No se encontró ningún producto que coincida con sus criterios.</p>
                </div>
              )
            }
          </div>
        </div>
      </div>
      <AISearchModal></AISearchModal>
    </div>
  </>;
};

export default Products;
