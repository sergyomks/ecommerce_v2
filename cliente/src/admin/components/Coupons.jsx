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
    <main className="admin-page">
      <Header />
      <p className="text-sm text-[#6b8a8a] -mt-3 mb-6">
        Crea descuentos porcentuales o de monto fijo.
      </p>
      <div className="space-y-8">
        <form
          onSubmit={handleSubmit}
          className="admin-card p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <h2 className="md:col-span-2 text-lg font-semibold text-[#16343a]">
            {editingId ? "Editar cupón" : "Nuevo cupón"}
          </h2>
          <input
            type="text"
            placeholder="Código (ej. BIENVENIDO10)"
            value={form.codigo}
            onChange={(e) =>
              setForm({ ...form, codigo: e.target.value.toUpperCase() })
            }
            className="admin-input uppercase"
            required
          />
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            className="admin-input"
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
            className="admin-input"
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
            className="admin-input"
          />
          <input
            type="number"
            min="1"
            placeholder="Usos máximos (vacío = ilimitado)"
            value={form.usos_maximos}
            onChange={(e) => setForm({ ...form, usos_maximos: e.target.value })}
            className="admin-input"
          />
          <label className="admin-check">
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
            className="admin-input"
          />
          <input
            type="datetime-local"
            value={form.fecha_fin}
            onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
            className="admin-input"
          />
          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="admin-btn">
              {editingId ? "Guardar" : "Crear cupón"}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="admin-btn-ghost">
                Cancelar
              </button>
            )}
          </div>
        </form>

        <div className="admin-card overflow-x-auto">
          {loading && cupones.length === 0 ? (
            <div className="w-12 h-12 mx-auto my-10 border-2 border-[#1aa89a] border-t-transparent rounded-full animate-spin" />
          ) : cupones.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Mínimo</th>
                  <th>Usos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cupones.map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold">{c.codigo}</td>
                    <td>{c.tipo}</td>
                    <td>
                      {c.tipo === "porcentaje"
                        ? `${c.valor}%`
                        : `S/ ${Number(c.valor).toFixed(2)}`}
                    </td>
                    <td>
                      S/ {Number(c.minimo_compra).toFixed(2)}
                    </td>
                    <td>
                      {c.usos_actuales}
                      {c.usos_maximos != null ? ` / ${c.usos_maximos}` : " / ∞"}
                    </td>
                    <td>
                      {c.activo ? "Activo" : "Inactivo"}
                    </td>
                    <td className="space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => startEdit(c)}
                        className="admin-btn"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => dispatch(deleteCupon(c.id))}
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
            <h3 className="text-lg p-6 font-semibold text-[#6b8a8a]">No hay cupones</h3>
          )}
        </div>
      </div>
    </main>
  );
};

export default Coupons;
