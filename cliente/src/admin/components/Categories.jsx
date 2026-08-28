import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import CategorySubModal from "../modals/CategorySubModal";
import {
  fetchCategoriasAdmin,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} from "../store/slices/categorySlice";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

const Categories = () => {
  const dispatch = useDispatch();
  const { categorias, loading } = useSelector((state) => state.adminCategory);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loadingSubcats, setLoadingSubcats] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    imagen_url: "",
    imagenFile: null,
  });
  const [editing, setEditing] = useState(null);
  const [subModal, setSubModal] = useState(null);

  useEffect(() => {
    dispatch(fetchCategoriasAdmin());
    fetchSubcategorias();
  }, [dispatch]);

  const fetchSubcategorias = async () => {
    setLoadingSubcats(true);
    try {
      const res = await axiosInstance.get("/subcategoria/admin/todas");
      setSubcategorias(res.data.subcategorias || []);
    } catch (error) {
      console.error("Error al cargar subcategorías:", error);
      setSubcategorias([]);
    } finally {
      setLoadingSubcats(false);
    }
  };

  const handleSubModalClose = () => {
    setSubModal(null);
    fetchSubcategorias();
  };

  const resetForm = () => {
    setForm({ nombre: "", imagen_url: "", imagenFile: null });
    setEditing(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("nombre", form.nombre);
    if (form.imagen_url) data.append("imagen_url", form.imagen_url);
    if (form.imagenFile) data.append("imagen", form.imagenFile);
    if (editing) {
      data.append("activo", editing.activo ? "1" : "0");
      data.append("categoria_padre_id", "");
      dispatch(updateCategoria(editing.id, data));
    } else {
      dispatch(createCategoria(data));
    }
    resetForm();
  };

  const startEditParent = (cat) => {
    setEditing(cat);
    setForm({
      nombre: cat.nombre,
      imagen_url: cat.imagen?.url || "",
      imagenFile: null,
    });
  };

  const toggleActivo = (cat) => {
    const data = new FormData();
    data.append("nombre", cat.nombre);
    if (cat.categoria_padre_id) {
      data.append("categoria_padre_id", cat.categoria_padre_id);
    } else {
      data.append("categoria_padre_id", "");
    }
    data.append("activo", cat.activo ? "0" : "1");
    if (cat.imagen?.url) data.append("imagen_url", cat.imagen.url);
    dispatch(updateCategoria(cat.id, data));
  };

  const padres = categorias.filter((c) => !c.categoria_padre_id);
  const hijasDe = (id) => subcategorias.filter((s) => s.id_categoria === id);

  const toggleActivoSubcat = async (subcat) => {
    try {
      const data = new FormData();
      data.append("nombre", subcat.nombre);
      data.append("id_categoria", subcat.id_categoria);
      data.append("activo", subcat.activo ? "0" : "1");
      if (subcat.imagen?.url) data.append("imagen_url", subcat.imagen.url);

      const res = await axiosInstance.put(`/subcategoria/admin/${subcat.id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(res.data.message || "Subcategoría actualizada");
      fetchSubcategorias();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al actualizar subcategoría");
    }
  };

  const deleteSubcat = async (id) => {
    if (!confirm("¿Eliminar esta subcategoría?")) return;
    try {
      const res = await axiosInstance.delete(`/subcategoria/admin/${id}`);
      toast.success(res.data.message || "Subcategoría eliminada");
      fetchSubcategorias();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al eliminar subcategoría");
    }
  };

  const renderRow = (cat, esHija) => (
    <tr key={cat.id} className={esHija ? "bg-white/25" : ""}>
      <td>
        {cat.imagen?.url ? (
          <img
            src={cat.imagen.url}
            alt={cat.nombre}
            className="w-14 h-14 object-cover rounded-2xl"
          />
        ) : (
          "—"
        )}
      </td>
      <td className="font-semibold">
        {esHija ? `↳ ${cat.nombre}` : cat.nombre}
      </td>
      <td className="text-[#1aa89a] font-medium">
        {esHija ? cat.categoria_nombre || "—" : "— (Principal)"}
      </td>
      <td className="text-[#6b8a8a]">{cat.slug}</td>
      <td>{cat.activo ? "Activa" : "Inactiva"}</td>
      <td className="space-x-2 whitespace-nowrap">
        {!esHija && (
          <button
            type="button"
            onClick={() => setSubModal({ padre: cat, editing: null })}
            className="admin-btn"
          >
            Agregar subcategoría
          </button>
        )}
        <button
          type="button"
          onClick={() =>
            esHija
              ? setSubModal({
                  padre: categorias.find((c) => c.id === cat.id_categoria) || {
                    id: cat.id_categoria,
                    nombre: cat.categoria_nombre,
                  },
                  editing: cat,
                })
              : startEditParent(cat)
          }
          className="admin-btn"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => (esHija ? toggleActivoSubcat(cat) : toggleActivo(cat))}
          className="admin-btn-muted"
        >
          {cat.activo ? "Desactivar" : "Activar"}
        </button>
        <button
          type="button"
          onClick={() => (esHija ? deleteSubcat(cat.id) : dispatch(deleteCategoria(cat.id)))}
          className="admin-btn-danger"
        >
          Eliminar
        </button>
      </td>
    </tr>
  );

  return (
    <main className="admin-page">
      <Header />
      <p className="text-sm text-[#6b8a8a] -mt-3 mb-6">
        Primero crea una categoría principal. Luego agrega sus subcategorías desde la tabla.
      </p>
      <div className="space-y-8">
        <form
          onSubmit={handleSubmit}
          className="admin-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <h2 className="md:col-span-2 text-lg font-semibold text-[#16343a]">
            {editing ? "Editar categoría principal" : "Nueva categoría principal"}
          </h2>
          <input
            type="text"
            placeholder="Nombre de la categoría"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="admin-input"
            required
          />
          <input
            type="url"
            placeholder="URL de imagen (opcional)"
            value={form.imagen_url}
            onChange={(e) => setForm({ ...form, imagen_url: e.target.value })}
            className="admin-input"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setForm({ ...form, imagenFile: e.target.files?.[0] || null })
            }
            className="admin-input md:col-span-2"
          />
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="admin-btn">
              {editing ? "Guardar cambios" : "Crear categoría"}
            </button>
            {editing && (
              <button type="button" onClick={resetForm} className="admin-btn-ghost">
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="admin-card overflow-x-auto">
          {(loading || loadingSubcats) && categorias.length === 0 ? (
            <div className="w-12 h-12 mx-auto my-10 border-2 border-[#1aa89a] border-t-transparent rounded-full animate-spin" />
          ) : categorias.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Nombre</th>
                  <th>Categoría padre</th>
                  <th>Slug</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {padres.map((padre) => (
                  <React.Fragment key={padre.id}>
                    {renderRow(padre, false)}
                    {hijasDe(padre.id).map((hija) => renderRow(hija, true))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <h3 className="text-lg p-6 font-semibold text-[#6b8a8a]">
              No hay categorías
            </h3>
          )}
        </div>
      </div>

      {subModal && (
        <CategorySubModal
          padre={subModal.padre}
          editing={subModal.editing}
          onClose={handleSubModalClose}
        />
      )}
    </main>
  );
};

export default Categories;
