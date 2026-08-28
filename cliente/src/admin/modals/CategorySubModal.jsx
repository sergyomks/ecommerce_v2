import { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { axiosInstance } from "../../lib/axios";

const CategorySubModal = ({ padre, editing, onClose }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    nombre: editing?.nombre || "",
    imagen_url: editing?.imagen?.url || "",
    imagenFile: null,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append("nombre", form.nombre);
      data.append("id_categoria", padre.id);
      if (form.imagen_url) data.append("imagen_url", form.imagen_url);
      if (form.imagenFile) data.append("imagen", form.imagenFile);

      if (editing) {
        data.append("activo", editing.activo ? "1" : "0");
        const res = await axiosInstance.put(`/subcategoria/admin/${editing.id}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(res.data.message || "Subcategoría actualizada");
      } else {
        const res = await axiosInstance.post("/subcategoria/admin", data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(res.data.message || "Subcategoría creada");
      }

      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error al guardar subcategoría");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal max-w-lg p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#6b8a8a] hover:text-[#c45c6a] text-xl"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-1 text-[#16343a]">
          {editing ? "Editar subcategoría" : "Nueva subcategoría"}
        </h2>
        <p className="text-sm text-[#6b8a8a] mb-5">
          Subcategoría de{" "}
          <span className="font-semibold text-[#16343a]">{padre.nombre}</span>
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre de la subcategoría"
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
            className="admin-input"
          />
          <div className="flex gap-3 pt-1">
            <button type="submit" className="admin-btn" disabled={loading}>
              {loading ? "Guardando..." : editing ? "Guardar cambios" : "Crear subcategoría"}
            </button>
            <button type="button" onClick={onClose} className="admin-btn-ghost" disabled={loading}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategorySubModal;
