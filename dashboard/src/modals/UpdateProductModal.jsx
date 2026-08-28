import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleUpdateProductModal } from "../store/slices/extraSlice";
import { LoaderCircle } from "lucide-react";
import { updateProduct } from "../store/slices/productsSlice";
import { fetchCategoriasActivas } from "../store/slices/categorySlice";

const UpdateProductModal = ({ selectedProduct }) => {
  const { loading } = useSelector((state) => state.product);
  const { categorias } = useSelector((state) => state.category);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "",
  });

  useEffect(() => {
    dispatch(fetchCategoriasActivas());
  }, [dispatch]);

  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        name: selectedProduct.nombre || "",
        description: selectedProduct.descripcion || "",
        price: selectedProduct.precio || "",
        category: selectedProduct.categoria || "",
        stock: selectedProduct.stock || "",
      });
    }
  }, [selectedProduct]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      nombre: formData.name,
      descripcion: formData.description,
      precio: formData.price,
      categoria: formData.category,
      stock: formData.stock,
    };

    dispatch(updateProduct(selectedProduct.id, data));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative">
        <button
          onClick={() => dispatch(toggleUpdateProductModal())}
          className="absolute top-4 right-4 text-gray-600 hover:text-red-500 text-xl"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-center">
          Actualizar Producto
        </h2>

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              Nombre del producto
            </label>
            <input
              type="text"
              placeholder="Ingrese el nombre del producto"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="border px-4 py-2 rounded"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="category"
              className="text-sm font-medium text-gray-700"
            >
              Categoría
            </label>
            <select
              className="w-full border p-2 rounded-lg"
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
              className="text-sm font-medium text-gray-700"
            >
              Precio
            </label>
            <input
              type="number"
              placeholder="Precio"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="border px-4 py-2 rounded"
            />
          </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="stock" className="text-sm font-medium text-gray-700">
    Stock
  </label>
<input
            type="number"
            placeholder="Stock"
            value={formData.stock}
            onChange={(e) =>
              setFormData({ ...formData, stock: e.target.value })
            }
            className="border px-4 py-2 rounded"
          />
              </div>

            <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
    Descripción
  </label>
<textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="border px-4 py-2 rounded col-span-1 md:col-span-2"
            rows={4}
          />
            </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded col-span-1 md:col-span-2"
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
