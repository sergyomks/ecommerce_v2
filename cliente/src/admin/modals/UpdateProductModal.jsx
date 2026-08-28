import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleUpdateProductModal } from "../store/slices/extraSlice";
import { LoaderCircle, X } from "lucide-react";
import { updateProduct } from "../store/slices/productsSlice";
import { fetchCategoriasActivas } from "../store/slices/categorySlice";
import MatrizVariantes from "../components/MatrizVariantes";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

const UpdateProductModal = ({ selectedProduct }) => {
  const { loading } = useSelector((state) => state.adminProduct);
  const { categorias } = useSelector((state) => state.adminCategory);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
  });

  const [variantes, setVariantes] = useState([]);
  const [guardandoVariantes, setGuardandoVariantes] = useState(false);
  const [imagenesExistentes, setImagenesExistentes] = useState([]);
  const [nuevasImagenes, setNuevasImagenes] = useState([]);

  useEffect(() => {
    dispatch(fetchCategoriasActivas());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedProduct?.id) return;
    axiosInstance
      .get(`/producto/${selectedProduct.id}/variantes`)
      .then(({ data }) => setVariantes(data.variantes || []))
      .catch(() => setVariantes([]));
  }, [selectedProduct?.id]);

  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        name: selectedProduct.nombre || "",
        description: selectedProduct.descripcion || "",
        price: selectedProduct.precio || "",
        category: selectedProduct.categoria || "",
        stock: selectedProduct.stock || "",
      });

      let imgs = selectedProduct.imagenes;
      if (typeof imgs === 'string') {
        try {
          imgs = JSON.parse(imgs);
        } catch {
          imgs = [];
        }
      }
      setImagenesExistentes(Array.isArray(imgs) ? imgs : []);
      setNuevasImagenes([]);
    }
  }, [selectedProduct]);

  const eliminarVariante = async (variante) => {
    try {
      const { data } = await axiosInstance.delete(
        `/producto/admin/variantes/${variante.id}`
      );
      toast.info(data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "No se pudo quitar la combinación."
      );
    }
  };

  const eliminarImagenExistente = (index) => {
    setImagenesExistentes(prev => prev.filter((_, i) => i !== index));
  };

  const handleNuevasImagenes = (e) => {
    const archivos = Array.from(e.target.files);
    setNuevasImagenes(prev => [...prev, ...archivos]);
  };

  const eliminarNuevaImagen = (index) => {
    setNuevasImagenes(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (variantes.length === 0) {
      toast.error("Añade al menos una combinación de talla y color.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("nombre", formData.name);
    formDataToSend.append("descripcion", formData.description);
    formDataToSend.append("precio", formData.price);
    formDataToSend.append("categoria", formData.category);
    formDataToSend.append("stock", variantes.reduce((s, v) => s + (Number(v.stock) || 0), 0));

    const imagenesJSON = JSON.stringify(imagenesExistentes);
    formDataToSend.append("imagenesAMantener", imagenesJSON);

    if (nuevasImagenes.length > 0) {
      nuevasImagenes.forEach((img, index) => {
        formDataToSend.append("imagenes", img);
      });
    }

    setGuardandoVariantes(true);
    try {
      await axiosInstance.put(`/producto/admin/${selectedProduct.id}/variantes`, {
        variantes: variantes.map((v) => ({
          talla: v.talla,
          color: v.color,
          color_hex: v.color_hex,
          sku: v.sku,
          stock: Number(v.stock) || 0,
        })),
      });
    } catch (error) {
      setGuardandoVariantes(false);
      toast.error(
        error.response?.data?.message || "No se pudieron guardar las tallas."
      );
      return;
    }
    setGuardandoVariantes(false);

    dispatch(updateProduct(selectedProduct.id, formDataToSend));
  };

  return (
    <div className="admin-modal-backdrop">
      <div className="admin-modal max-w-2xl relative max-h-[90vh] flex flex-col">
        <div className="sticky top-0 bg-white p-6 pb-3 border-b z-10">
          <button
            onClick={() => dispatch(toggleUpdateProductModal())}
            className="absolute top-4 right-4 text-[#6b8a8a] hover:text-[#c45c6a] text-xl"
          >
            &times;
          </button>
          <h2 className="text-2xl font-bold text-center text-[#16343a]">
            Actualizar Producto
          </h2>
        </div>

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 overflow-y-auto flex-1"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="admin-label">
              Nombre del producto
            </label>
            <input
              type="text"
              placeholder="Ingrese el nombre del producto"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="admin-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="category"
              className="admin-label"
            >
              Categoría
            </label>
            <select
              className="admin-input"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              required
            >
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.nombre}>
                  {cat.categoria_padre_nombre
                    ? `${cat.categoria_padre_nombre} ➔ ${cat.nombre}`
                    : cat.nombre}
                </option>
              ))}
              {formData.category &&
                !categorias.some((c) => c.nombre === formData.category) && (
                  <option value={formData.category}>{formData.category}</option>
                )}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="price"
              className="admin-label"
            >
              Precio (incluye IGV)
            </label>
            <input
              type="number"
              placeholder="Precio"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="admin-input"
            />
          </div>
              <div className="flex flex-col gap-2 col-span-1 md:col-span-2">
                <label className="admin-label">
                  Tallas, colores y stock
                </label>
                <MatrizVariantes
                  variantes={variantes}
                  onChange={setVariantes}
                  onEliminar={eliminarVariante}
                />
              </div>

              { }
              <div className="flex flex-col gap-2 col-span-1 md:col-span-2">
                <label className="admin-label">Imágenes del producto</label>

                { }
                {imagenesExistentes.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-[#6b8a8a] mb-2">Imágenes actuales:</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {imagenesExistentes.map((img, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={img.url}
                            alt={`Imagen ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => eliminarImagenExistente(index)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                { }
                {nuevasImagenes.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-[#6b8a8a] mb-2">Nuevas imágenes a agregar:</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {nuevasImagenes.map((file, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Nueva ${index + 1}`}
                            className="w-full h-24 object-cover rounded border border-green-400"
                          />
                          <button
                            type="button"
                            onClick={() => eliminarNuevaImagen(index)}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                { }
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleNuevasImagenes}
                  className="admin-input"
                />
              </div>

              <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
                <label htmlFor="description" className="admin-label">
                  Descripción
                </label>
                <textarea
                  placeholder="Descripción"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="admin-input"
                  rows={4}
                />
              </div>

          <button
            type="submit"
            className="admin-btn col-span-1 md:col-span-2 sticky bottom-0"
          >
            {loading ? (
              <>
                <LoaderCircle className="w-6 h-6 animate-spin" />
                Actualizando
              </>
            ) : (
              "Actualizar Producto"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdateProductModal;
