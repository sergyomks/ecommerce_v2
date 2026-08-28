import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import {
  fetchCategoriasAdmin,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from "../store/slices/categorySlice";

const Categories = () => {
  const dispatch = useDispatch();
  const { categorias, loading } = useSelector((state) => state.category);
  const [form, setForm] = useState({
    nombre: "",
    categoria_padre_id: "",
    imagen_url: "",
    imagenFile: null,
  });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    dispatch(fetchCategoriasAdmin());
  }, [dispatch]);

  const resetForm = () => {
    setForm({ nombre: "", categoria_padre_id: "", imagen_url: "", imagenFile: null });
    setEditing(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("nombre", form.nombre);
    data.append("categoria_padre_id", form.categoria_padre_id);
    if (form.imagen_url) data.append("imagen_url", form.imagen_url);
    if (form.imagenFile) data.append("imagen", form.imagenFile);
    if (editing) {
      data.append("activo", editing.activo ? "1" : "0");
      dispatch(updateCategoria(editing.id, data));
    } else {
      dispatch(createCategoria(data));
    }
    resetForm();
  };

  const startEdit = (cat) => {
    setEditing(cat);
    setForm({
      nombre: cat.nombre,
      categoria_padre_id: cat.categoria_padre_id || "",
      imagen_url: cat.imagen?.url || "",
      imagenFile: null,
    });
  };

  const toggleActivo = (cat) => {
    const data = new FormData();
    data.append("nombre", cat.nombre);
    if (cat.categoria_padre_id) data.append("categoria_padre_id", cat.categoria_padre_id);
    data.append("activo", cat.activo ? "0" : "1");
    if (cat.imagen?.url) data.append("imagen_url", cat.imagen.url);
    dispatch(updateCategoria(cat.id, data));
  };

  return (
    <main className="p-[10px] pl-[10px] md:pl-[17rem] w-full">
      <div className="flex-1 md:p-6">
        <Header />
        <h1 className="text-2xl font-bold">Categorías</h1>
        <p className="text-sm text-gray-600 mb-6">
          Administra las categorías y subcategorías del catálogo.
        </p>
      </div>

      <div className="p-4 sm:p-8 bg-gray-50 min-h-screen space-y-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <h2 className="md:col-span-2 text-lg font-semibold">
            {editing ? "Editar categoría" : "Nueva categoría / subcategoría"}
          </h2>
          <input
            type="text"
            placeholder="Nombre de la categoría"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="border px-4 py-2 rounded"
            required
          />
          <select
            value={form.categoria_padre_id}
            onChange={(e) => setForm({ ...form, categoria_padre_id: e.target.value })}
            className="border px-4 py-2 rounded bg-white"
          >
            <option value="">-- Ninguna (Es Categoría Principal) --</option>
            {categorias
              .filter((c) => !editing || c.id !== editing.id)
              .map((cat) => (
                <option key={cat.id} value={cat.id}>
                  Subcategoría de: {cat.nombre}
                </option>
              ))}
          </select>
          <input
            type="url"
            placeholder="URL de imagen (opcional)"
            value={form.imagen_url}
            onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
            className="border px-4 py-2 rounded"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setForm({ ...form, imagenFile: e.target.files?.[0] || null })
            }
            className="border px-4 py-2 rounded"
          />
          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              {editing ? "Guardar cambios" : "Crear categoría"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="overflow-x-auto rounded-lg">
          {loading && categorias.length === 0 ? (
            <div className="w-40 h-40 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : categorias.length > 0 ? (
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-blue-100 text-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Imagen</th>
                  <th className="py-3 px-4 text-left">Nombre</th>
                  <th className="py-3 px-4 text-left">Categoría Padre</th>
                  <th className="py-3 px-4 text-left">Slug</th>
                  <th className="py-3 px-4 text-left">Estado</th>
                  <th className="py-3 px-4 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((cat) => (
                  <tr key={cat.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {cat.imagen?.url ? (
                        <img
                          src={cat.imagen.url}
                          alt={cat.nombre}
                          className="w-14 h-14 object-cover rounded"
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold">
                      {cat.categoria_padre_nombre ? `↳ ${cat.nombre}` : cat.nombre}
                    </td>
                    <td className="py-3 px-4 text-blue-600 font-medium">
                      {cat.categoria_padre_nombre || "— (Principal)"}
                    </td>
                    <td className="py-3 px-4 text-gray-500">{cat.slug}</td>
                    <td className="py-3 px-4">
                      {cat.activo ? "Activa" : "Inactiva"}
                    </td>
                    <td className="py-3 px-4 space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => startEdit(cat)}
                        className="bg-blue-600 text-white px-3 py-2 rounded-md"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => toggleActivo(cat)}
                        className="bg-yellow-500 text-white px-3 py-2 rounded-md"
                      >
                        {cat.activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        onClick={() => dispatch(deleteCategoria(cat.id))}
                        className="bg-red-gradient text-white px-3 py-2 rounded-md"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <h3 className="text-2xl p-6 font-bold">No hay categorías</h3>
          )}
        </div>
      </div>
    </main>
  );
};

export default Categories;
