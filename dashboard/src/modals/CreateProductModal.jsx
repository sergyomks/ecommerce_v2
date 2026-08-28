import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createNewProduct } from "../store/slices/productsSlice";
import { toggleCreateProductModal } from "../store/slices/extraSlice";
import { fetchCategoriasActivas } from "../store/slices/categorySlice";
import { LoaderCircle } from "lucide-react";

const CreateProductModal = () => {
  const { loading } = useSelector((state) => state.product);
  const { categorias } = useSelector((state) => state.category);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
    images: [],
  });

  useEffect(() => {
    dispatch(fetchCategoriasActivas());
  }, [dispatch]);

  useEffect(() => {
    if (!formData.category && categorias.length > 0) {
      setFormData((prev) => ({ ...prev, category: categorias[0].nombre }));
    }
  }, [categorias, formData.category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("nombre", formData.name);
    data.append("descripcion", formData.description);
    data.append("precio", formData.price);
    data.append("categoria", formData.category);
    data.append("stock", formData.stock);

    for (let i = 0; i < formData.images.length; i++) {
      data.append("imagenes", formData.images[i]);
    }

    dispatch(createNewProduct(data));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative">
          <button
            onClick={() => dispatch(toggleCreateProductModal())}
            className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-xl"
          >
            &times;
          </button>
          <h2 className="text-2xl font-bold mb-4 text-center">
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
              className="border px-4 py-2 rounded"
            />
            <select
              className="w-full border p-2 rounded-lg"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              required
            >
              {categorias.length === 0 && (
                <option value="">Sin categorías</option>
              )}
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.nombre}>
                  {cat.categoria_padre_nombre
                    ? `${cat.categoria_padre_nombre} ➔ ${cat.nombre}`
                    : cat.nombre}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Ingrese el precio"
              value={formData.price}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  price: e.target.value,
                })
              }
              className="border px-4 py-2 rounded"
            />
            <input
              type="number"
              placeholder="Ingrese el stock"
              value={formData.stock}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stock: e.target.value,
                })
              }
              className="border px-4 py-2 rounded"
            />

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
              className="border px-4 py-2 rounded col-span-1 md:col-span-2"
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
              className="border px-4 py-2 rounded col-span-1 md:col-span-2"
              rows={4}
            />

            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded col-span-1 md:col-span-2"
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
