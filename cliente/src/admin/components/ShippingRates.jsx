import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import {
  fetchTarifasEnvio,
  createTarifaEnvio,
  updateTarifaEnvio,
  deleteTarifaEnvio,
} from "../store/slices/shippingSlice";

const ShippingRates = () => {
  const dispatch = useDispatch();
  const { tarifas, config, loading } = useSelector((state) => state.shipping);
  const [form, setForm] = useState({
    departamento: "",
    precio: "",
    activo: true,
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    dispatch(fetchTarifasEnvio());
  }, [dispatch]);

  const resetForm = () => {
    setForm({ departamento: "", precio: "", activo: true });
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      departamento: form.departamento.trim(),
      precio: Number(form.precio),
      activo: form.activo,
    };
    if (editingId) {
      dispatch(updateTarifaEnvio(editingId, payload));
    } else {
      dispatch(createTarifaEnvio(payload));
    }
    resetForm();
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setForm({
      departamento: t.departamento,
      precio: String(t.precio),
      activo: t.activo,
    });
  };

  return (
    <main className="admin-page">
      <Header />
      <p className="text-sm text-[#6b8a8a] -mt-3 mb-2">
        Precio por departamento. Si no hay tarifa, se usa el default.
      </p>
        {config && (
          <p className="text-sm text-[#3d5c62] mb-6">
            Umbral gratis: <strong>S/ {config.umbral_gratis}</strong> · Default:{" "}
            <strong>S/ {config.precio_default}</strong> (config.env)
          </p>
        )}

      <div className="space-y-8">
        <form
          onSubmit={handleSubmit}
          className="admin-card p-6 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <input
            type="text"
            placeholder="Departamento"
            value={form.departamento}
            onChange={(e) =>
              setForm({ ...form, departamento: e.target.value })
            }
            className="admin-input"
            required
          />
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Precio S/"
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: e.target.value })}
            className="admin-input"
            required
          />
          <label className="admin-check">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            Activa
          </label>
          <div className="md:col-span-3 flex gap-3">
            <button type="submit" className="admin-btn">
              {editingId ? "Guardar" : "Crear tarifa"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="admin-btn-ghost">
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="admin-card overflow-x-auto">
          {loading && tarifas.length === 0 ? (
            <div className="w-12 h-12 mx-auto my-10 border-2 border-[#1aa89a] border-t-transparent rounded-full animate-spin" />
          ) : tarifas.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Departamento</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tarifas.map((t) => (
                  <tr key={t.id}>
                    <td>{t.departamento}</td>
                    <td>
                      S/ {Number(t.precio).toFixed(2)}
                    </td>
                    <td>
                      {t.activo ? "Activa" : "Inactiva"}
                    </td>
                    <td className="space-x-2">
                      <button
                        onClick={() => startEdit(t)}
                        className="admin-btn"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => dispatch(deleteTarifaEnvio(t.id))}
                        className="admin-btn-danger"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <h3 className="text-lg p-6 font-semibold text-[#6b8a8a]">No hay tarifas</h3>
          )}
        </div>
      </div>
    </main>
  );
};

export default ShippingRates;
