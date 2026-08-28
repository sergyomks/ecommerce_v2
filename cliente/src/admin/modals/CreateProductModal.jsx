import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createNewProduct } from "../store/slices/productsSlice";
import { toggleCreateProductModal } from "../store/slices/extraSlice";
import { fetchCategoriasActivas } from "../store/slices/categorySlice";
import MatrizVariantes from "../components/MatrizVariantes";
import { LoaderCircle } from "lucide-react";
import { axiosInstance } from "../../lib/axios";

const CreateProductModal = () => {
  const { loading } = useSelector((state) => state.adminProduct);
  const { categorias } = useSelector((state) => state.adminCategory);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    subcategoryId: "",
    stock: "",
    images: [],
  });

  const [subcategorias, setSubcategorias] = useState([]);
  const [subcategoriasFiltradas, setSubcategoriasFiltradas] = useState([]);
  const [variantes, setVariantes] = useState([]);

  useEffect(() => {
    dispatch(fetchCategoriasActivas());
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
    if (formData.categoryId) {
      const subcats = subcategorias.filter(
        s => s.id_categoria === formData.categoryId && s.activo
      );
      setSubcategoriasFiltradas(subcats);

      setFormData(prev => ({ ...prev, subcategoryId: "" }));
    } else {
      setSubcategoriasFiltradas([]);
      setFormData(prev => ({ ...prev, subcategoryId: "" }));
    }
  }, [formData.categoryId, subcategorias]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.subcategoryId) {
      alert("Debes seleccionar una subcategoría");
      return;
    }

    const stockTotal = variantes.length
      ? variantes.reduce((s, v) => s + (Number(v.stock) || 0), 0)
      : Number(formData.stock) || 0;

    const categoria = categorias.find(c => c.id === formData.categoryId);
    const subcategoria = subcategoriasFiltradas.find(s => s.id === formData.subcategoryId);

    const data = new FormData();
    data.append("nombre", formData.name);
    data.append("descripcion", formData.description);
    data.append("precio", formData.price);
    data.append("categoria", subcategoria?.nombre || "");
    data.append("stock", stockTotal);
    if (variantes.length) {
      data.append("variantes", JSON.stringify(variantes));
    }

    for (let i = 0; i < formData.images.length; i++) {
      data.append("imagenes", formData.images[i]);
    }

    dispatch(createNewProduct(data));
  };

  return (
    <>
      <div className="admin-modal-backdrop">
        <div className="admin-modal max-w-2xl p-6 relative">
          <button
            onClick={() => dispatch(toggleCreateProductModal())}
            className="absolute top-4 right-4 text-[#6b8a8a] hover:text-[#c45c6a] text-xl"
          >
            &times;
          </button>
          <h2 className="text-2xl font-bold mb-4 text-center text-[#16343a]">
            Crear Nuevo Producto
          </h2>

          <form
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              placeholder="Ingrese el nombre del producto"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
              className="admin-input"
              required
            />

            <select
              className="admin-input"
              value={formData.categoryId}
              onChange={(e) =>
                setFormData({ ...formData, categoryId: e.target.value })
              }
              required
            >
              <option value="">Seleccione categoría padre</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>

            {formData.categoryId && (
              <select
                className="admin-input"
                value={formData.subcategoryId}
                onChange={(e) =>
                  setFormData({ ...formData, subcategoryId: e.target.value })
                }
                required
              >
                <option value="">Seleccione subcategoría *</option>
                {subcategoriasFiltradas.length === 0 ? (
                  <option value="" disabled>Esta categoría no tiene subcategorías</option>
                ) : (
                  subcategoriasFiltradas.map((subcat) => (
                    <option key={subcat.id} value={subcat.id}>
                      {subcat.nombre}
                    </option>
                  ))
                )}
              </select>
            )}
            <input
              type="number"
              placeholder="Precio (incluye IGV)"
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: e.target.value,
                })
              }
              className="admin-input"
            />
            {

 }
            {variantes.length === 0 && (
              <input
                type="number"
                placeholder="Stock (si la prenda no tiene tallas)"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: e.target.value,
                  })
                }
                className="admin-input"
              />
            )}

            <div className="col-span-1 md:col-span-2 flex flex-col gap-2">
              <label className="admin-label">Tallas, colores y stock (opcional)</label>
              <MatrizVariantes variantes={variantes} onChange={setVariantes} />
            </div>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  images: Array.from(e.target.files),
                })
              }
              className="admin-input col-span-1 md:col-span-2"
            />

            <textarea
              placeholder="Ingrese la descripción del producto"
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
              className="admin-input col-span-1 md:col-span-2"
              rows={4}
            />

            <button
              type="submit"
              className="admin-btn col-span-1 md:col-span-2"
            >
              {loading ? (
                <>
                  <LoaderCircle className="w-6 h-6 animate-spin" />
                  Creando
                </>
              ) : (
                "Crear Producto"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateProductModal;
