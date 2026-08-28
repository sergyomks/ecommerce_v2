import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import {
  fetchCupones,
  createCupon,
  updateCupon,
  deleteCupon,
} from "../store/slices/couponSlice";

const emptyForm = {
  codigo: "",
  tipo: "porcentaje",
  valor: "",
  minimo_compra: "0",
  usos_maximos: "",
  fecha_inicio: "",
  fecha_fin: "",
  activo: true,
};

const Coupons = () => {
  const dispatch = useDispatch();
  const { cupones, loading } = useSelector((state) => state.coupon);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    dispatch(fetchCupones());
  }, [dispatch]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      valor: Number(form.valor),
      minimo_compra: Number(form.minimo_compra) || 0,
      usos_maximos: form.usos_maximos === "" ? null : Number(form.usos_maximos),
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
    };
    if (editingId) {
      dispatch(updateCupon(editingId, payload));
    } else {
      dispatch(createCupon(payload));
    }
    resetForm();
  };

  const startEdit = (cupon) => {
    setEditingId(cupon.id);
    setForm({
      codigo: cupon.codigo,
      tipo: cupon.tipo,
      valor: String(cupon.valor),
      minimo_compra: String(cupon.minimo_compra ?? 0),
      usos_maximos:
        cupon.usos_maximos === null || cupon.usos_maximos === undefined
          ? ""
          : String(cupon.usos_maximos),
      fecha_inicio: cupon.fecha_inicio
        ? String(cupon.fecha_inicio).slice(0, 16)
        : "",
      fecha_fin: cupon.fecha_fin ? String(cupon.fecha_fin).slice(0, 16) : "",
      activo: cupon.activo,
    });
  };

  return (
    <main className="p-[10px] pl-[10px] md:pl-[17rem] w-full">
      <div className="flex-1 md:p-6">
        <Header />
        <h1 className="text-2xl font-bold">Cupones</h1>
        <p className="text-sm text-gray-600 mb-6">
          Crea descuentos porcentuales o de monto fijo.
        </p>
      </div>

      <div className="p-4 sm:p-8 bg-gray-50 min-h-screen space-y-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <h2 className="md:col-span-2 text-lg font-semibold">
            {editingId ? "Editar cupón" : "Nuevo cupón"}
          </h2>
          <input
            type="text"
            placeholder="Código (ej. BIENVENIDO10)"
            value={form.codigo}
            onChange={(e) =>
              setForm({ ...form, codigo: e.target.value.toUpperCase() })
            }
            className="border px-4 py-2 rounded uppercase"
            required
          />
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            className="border px-4 py-2 rounded"
          >
            <option value="porcentaje">Porcentaje (%)</option>
            <option value="fijo">Monto fijo (S/)</option>
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Valor"
            value={form.valor}
            onChange={(e) => setForm({ ...form, valor: e.target.value })}
            className="border px-4 py-2 rounded"
            required
          />
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Mínimo de compra"
            value={form.minimo_compra}
            onChange={(e) =>
              setForm({ ...form, minimo_compra: e.target.value })
            }
            className="border px-4 py-2 rounded"
          />
          <input
            type="number"
            min="1"
            placeholder="Usos máximos (vacío = ilimitado)"
            value={form.usos_maximos}
            onChange={(e) => setForm({ ...form, usos_maximos: e.target.value })}
            className="border px-4 py-2 rounded"
          />
          <label className="flex items-center gap-2 border px-4 py-2 rounded">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            Activo
          </label>
          <input
            type="datetime-local"
            value={form.fecha_inicio}
            onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
            className="border px-4 py-2 rounded"
          />
          <input
            type="datetime-local"
            value={form.fecha_fin}
            onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
            className="border px-4 py-2 rounded"
          />
          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              {editingId ? "Guardar" : "Crear cupón"}
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
          {loading && cupones.length === 0 ? (
            <div className="w-40 h-40 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : cupones.length > 0 ? (
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-blue-100 text-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Código</th>
                  <th className="py-3 px-4 text-left">Tipo</th>
                  <th className="py-3 px-4 text-left">Valor</th>
                  <th className="py-3 px-4 text-left">Mínimo</th>
                  <th className="py-3 px-4 text-left">Usos</th>
                  <th className="py-3 px-4 text-left">Estado</th>
                  <th className="py-3 px-4 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cupones.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold">{c.codigo}</td>
                    <td className="py-3 px-4">{c.tipo}</td>
                    <td className="py-3 px-4">
                      {c.tipo === "porcentaje"
                        ? `${c.valor}%`
                        : `S/ ${Number(c.valor).toFixed(2)}`}
                    </td>
                    <td className="py-3 px-4">
                      S/ {Number(c.minimo_compra).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {c.usos_actuales}
                      {c.usos_maximos != null ? ` / ${c.usos_maximos}` : " / ∞"}
                    </td>
                    <td className="py-3 px-4">
                      {c.activo ? "Activo" : "Inactivo"}
                    </td>
                    <td className="py-3 px-4 space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => startEdit(c)}
                        className="bg-blue-600 text-white px-3 py-2 rounded-md"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => dispatch(deleteCupon(c.id))}
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
            <h3 className="text-2xl p-6 font-bold">No hay cupones</h3>
          )}
        </div>
      </div>
    </main>
  );
};

export default Coupons;
