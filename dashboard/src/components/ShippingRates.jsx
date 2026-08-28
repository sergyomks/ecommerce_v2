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
    <main className="p-[10px] pl-[10px] md:pl-[17rem] w-full">
      <div className="flex-1 md:p-6">
        <Header />
        <h1 className="text-2xl font-bold">Tarifas de envío</h1>
        <p className="text-sm text-gray-600 mb-2">
          Precio por departamento. Si no hay tarifa, se usa el default.
        </p>
        {config && (
          <p className="text-sm text-gray-700 mb-6">
            Umbral gratis: <strong>S/ {config.umbral_gratis}</strong> · Default:{" "}
            <strong>S/ {config.precio_default}</strong> (config.env)
          </p>
        )}
      </div>

      <div className="p-4 sm:p-8 bg-gray-50 min-h-screen space-y-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <input
            type="text"
            placeholder="Departamento"
            value={form.departamento}
            onChange={(e) =>
              setForm({ ...form, departamento: e.target.value })
            }
            className="border px-4 py-2 rounded"
            required
          />
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Precio S/"
            value={form.precio}
            onChange={(e) => setForm({ ...form, precio: e.target.value })}
            className="border px-4 py-2 rounded"
            required
          />
          <label className="flex items-center gap-2 border px-4 py-2 rounded">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            Activa
          </label>
          <div className="md:col-span-3 flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              {editingId ? "Guardar" : "Crear tarifa"}
            </button>
            {editingId && (
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
          {loading && tarifas.length === 0 ? (
            <div className="w-40 h-40 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : tarifas.length > 0 ? (
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-blue-100 text-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Departamento</th>
                  <th className="py-3 px-4 text-left">Precio</th>
                  <th className="py-3 px-4 text-left">Estado</th>
                  <th className="py-3 px-4 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tarifas.map((t) => (
                  <tr key={t.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4">{t.departamento}</td>
                    <td className="py-3 px-4">
                      S/ {Number(t.precio).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {t.activo ? "Activa" : "Inactiva"}
                    </td>
                    <td className="py-3 px-4 space-x-2">
                      <button
                        onClick={() => startEdit(t)}
                        className="bg-blue-600 text-white px-3 py-2 rounded-md"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => dispatch(deleteTarifaEnvio(t.id))}
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
            <h3 className="text-2xl p-6 font-bold">No hay tarifas</h3>
          )}
        </div>
      </div>
    </main>
  );
};

export default ShippingRates;
