import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toggleUpdateProductModal } from "../store/slices/extraSlice";
import { LoaderCircle, X } from "lucide-react";
import { updateProduct } from "../store/slices/productsSlice";
import { fetchCategoriasActivas } from "../store/slices/categorySlice";
import MatrizVariantes from "../components/MatrizVariantes";
import { axiosInstance } from "../../lib/axios";
import { toast } from "react-toastify";

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
};

const parseImagenes = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

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
    precio_oferta: "",
    oferta_inicio: "",
    oferta_fin: "",
  });

  const [quitarOferta, setQuitarOferta] = useState(false);

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
    if (!selectedProduct) return;

    const ofertaActiva = Boolean(
      selectedProduct.precio_oferta && Number(selectedProduct.precio_oferta) > 0
    );

    setFormData({
      name: selectedProduct.nombre || "",
      description: selectedProduct.descripcion || "",
      price: selectedProduct.precio || "",
      category: selectedProduct.categoria || "",
      stock: selectedProduct.stock || "",
      precio_oferta: ofertaActiva ? selectedProduct.precio_oferta : "",
      oferta_inicio: ofertaActiva ? toDateTimeLocal(selectedProduct.oferta_inicio) : "",
      oferta_fin: ofertaActiva ? toDateTimeLocal(selectedProduct.oferta_fin) : "",
    });
    setQuitarOferta(false);
    setImagenesExistentes(parseImagenes(selectedProduct.imagenes));
    setNuevasImagenes([]);
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
    setNuevasImagenes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCampo = (campo) => (e) =>
    setFormData((prev) => ({ ...prev, [campo]: e.target.value }));

  const precioNum = Number(formData.price);
  const precioOfertaNum = Number(formData.precio_oferta);
  const mostrarDescuento =
    formData.precio_oferta &&
    Number.isFinite(precioNum) &&
    precioNum > 0 &&
    precioOfertaNum > 0 &&
    precioOfertaNum < precioNum;
  const porcentajeDescuento = mostrarDescuento
    ? Math.round((1 - precioOfertaNum / precioNum) * 100)
    : 0;

  const estadoOferta = (() => {
    if (!mostrarDescuento) return null;
    const inicio = formData.oferta_inicio ? new Date(formData.oferta_inicio) : null;
    const fin = formData.oferta_fin ? new Date(formData.oferta_fin) : null;
    const ahora = new Date();
    if (inicio && inicio > ahora) return { tipo: "futura", texto: "Programada (aún no inicia)" };
    if (fin && fin < ahora) return { tipo: "vencida", texto: "Vencida (no se mostrará en el Home)" };
    return { tipo: "activa", texto: "Activa ahora en el Home" };
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (variantes.length === 0) {
      toast.error("Añade al menos una combinación de talla y color.");
      return;
    }

    try {
      setGuardandoVariantes(true);
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
      toast.error(
        error.response?.data?.message || "No se pudieron guardar las tallas."
      );
      return;
    } finally {
      setGuardandoVariantes(false);
    }

    const formDataToSend = new FormData();
    formDataToSend.append("nombre", formData.name);
    formDataToSend.append("descripcion", formData.description);
    formDataToSend.append("precio", formData.price);
    formDataToSend.append("categoria", formData.category);
    formDataToSend.append(
      "stock",
      variantes.reduce((s, v) => s + (Number(v.stock) || 0), 0)
    );
    formDataToSend.append("imagenesAMantener", JSON.stringify(imagenesExistentes));

    nuevasImagenes.forEach((img) => {
      formDataToSend.append("imagenes", img);
    });

    if (quitarOferta) {
      formDataToSend.append("quitar_oferta", "true");
    } else if (formData.precio_oferta && precioOfertaNum > 0) {
      formDataToSend.append("precio_oferta", formData.precio_oferta);
      if (formData.oferta_inicio) {
        formDataToSend.append("oferta_inicio", fromDateTimeLocal(formData.oferta_inicio));
      }
      if (formData.oferta_fin) {
        formDataToSend.append("oferta_fin", fromDateTimeLocal(formData.oferta_fin));
      }
    }

    dispatch(updateProduct(selectedProduct.id, formDataToSend));
  };

  const opcionesCategoria = (() => {
    const base = categorias.map((cat) => ({
      value: cat.nombre,
      label: cat.categoria_padre_nombre
        ? `${cat.categoria_padre_nombre} ➔ ${cat.nombre}`
        : cat.nombre,
    }));
    if (formData.category && !base.some((c) => c.value === formData.category)) {
      base.push({ value: formData.category, label: formData.category });
    }
    return base;
  })();

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
              id="name"
              placeholder="Ingrese el nombre del producto"
              value={formData.name}
              onChange={handleCampo("name")}
              className="admin-input"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="category" className="admin-label">
              Categoría
            </label>
            <select
              id="category"
              className="admin-input"
              value={formData.category}
              onChange={handleCampo("category")}
              required
            >
              {opcionesCategoria.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="price" className="admin-label">
              Precio (incluye IGV)
            </label>
            <input
              type="number"
              id="price"
              placeholder="Precio"
              value={formData.price}
              onChange={handleCampo("price")}
              className="admin-input"
            />
          </div>
          <div className="flex flex-col gap-2 col-span-1 md:col-span-2">
            <label className="admin-label">Tallas, colores y stock</label>
            <MatrizVariantes
              variantes={variantes}
              onChange={setVariantes}
              onEliminar={eliminarVariante}
            />
          </div>

          <div className="flex flex-col gap-2 col-span-1 md:col-span-2">
            <label className="admin-label">Imágenes del producto</label>

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
              id="description"
              placeholder="Descripción"
              value={formData.description}
              onChange={handleCampo("description")}
              className="admin-input"
              rows={4}
            />
          </div>

          <div className="col-span-1 md:col-span-2 admin-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="admin-label !mb-0">Promoción (opcional)</label>
              <span className="text-xs text-[#6b8a8a]">
                Déjalo vacío si no quieres ofertar
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#6b8a8a]">Precio oferta</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 49.00"
                  value={formData.precio_oferta}
                  onChange={handleCampo("precio_oferta")}
                  disabled={quitarOferta}
                  className="admin-input disabled:opacity-50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#6b8a8a]">Inicio</label>
                <input
                  type="datetime-local"
                  value={formData.oferta_inicio}
                  onChange={handleCampo("oferta_inicio")}
                  disabled={quitarOferta}
                  className="admin-input disabled:opacity-50"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#6b8a8a]">Fin</label>
                <input
                  type="datetime-local"
                  value={formData.oferta_fin}
                  onChange={handleCampo("oferta_fin")}
                  disabled={quitarOferta}
                  className="admin-input disabled:opacity-50"
                />
              </div>
            </div>

            {mostrarDescuento && (
              <p className="text-xs text-[#1aa89a]">
                Descuento calculado: -{porcentajeDescuento}% (S/. {precioOfertaNum.toFixed(2)} de S/. {precioNum.toFixed(2)})
              </p>
            )}

            {estadoOferta && (
              <p
                className={`text-xs font-medium ${
                  estadoOferta.tipo === "activa"
                    ? "text-emerald-600"
                    : estadoOferta.tipo === "futura"
                    ? "text-amber-600"
                    : "text-rose-600"
                }`}
              >
                {estadoOferta.tipo === "activa" ? "● " : "○ "}
                {estadoOferta.texto}
              </p>
            )}

            <label className="flex items-center gap-2 text-xs text-[#6b8a8a] cursor-pointer">
              <input
                type="checkbox"
                checked={quitarOferta}
                onChange={(e) => setQuitarOferta(e.target.checked)}
                className="accent-[#c45c6a]"
              />
              Quitar oferta al guardar
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || guardandoVariantes}
            className="admin-btn col-span-1 md:col-span-2 sticky bottom-0 disabled:opacity-60"
          >
            {loading || guardandoVariantes ? (
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
