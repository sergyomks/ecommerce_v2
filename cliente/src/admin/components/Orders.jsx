import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import {
  deleteOrder,
  fetchAllOrders,
  updateOrderStatus,
} from "../store/slices/orderSlice";

const STATUS_STYLES = {
  Procesando: "bg-[#fff4d6] text-[#b45309]",
  Enviado: "bg-[#dbeafe] text-[#1d4ed8]",
  Entregado: "bg-[#d8f3ef] text-[#0e7c72]",
  Cancelado: "bg-[#fde8e8] text-[#c45c6a]",
};

const Orders = () => {
  const statusArray = ["Todos", "Procesando", "Enviado", "Entregado", "Cancelado"];
  const dispatch = useDispatch();
  const {
    orders: pedidos,
    loading,
    totalPaginas,
    totalPedidos,
    requierenRevision,
  } = useSelector((state) => state.adminOrder);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [filterByStatus, setFilterByStatus] = useState("Todos");
  const [previewImg, setPreviewImg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [filterByStatus]);

  useEffect(() => {
    const cargar = () =>
      dispatch(fetchAllOrders({ pagina: page, estado: filterByStatus }));

    cargar();
    const interval = setInterval(cargar, 5000);
    return () => clearInterval(interval);
  }, [dispatch, page, filterByStatus]);

  const handleStatusChange = (pedidoId, newStatus) => {
    setSelectedStatus((prev) => ({ ...prev, [pedidoId]: newStatus }));
    dispatch(
      updateOrderStatus({
        pedidoId,
        status: newStatus,
      })
    );
  };

  const maxPage = totalPaginas || 1;
  const currentPage = Math.min(page, maxPage);
  const paginatedOrders = pedidos || [];

  const confirmDelete = () => {
    setDeleteConfirm({ open: false, id: null });
    dispatch(deleteOrder(deleteConfirm.id));
  };

  const metaItem = (label, value) => (
    <p className="text-sm text-[#16343a]">
      <span className="font-semibold">{label}: </span>
      <span className="text-[#3d5c62]">{value}</span>
    </p>
  );

  return (
    <>
      <main className="admin-page">
        <Header />
        <p className="text-sm text-[#6b8a8a] -mt-3 mb-6">Gestiona tus pedidos</p>
        <div className="admin-card p-4 sm:p-5 mb-5 flex flex-wrap justify-between items-center gap-3">
          <select
            className="admin-input admin-input-inline"
            value={filterByStatus}
            onChange={(e) => setFilterByStatus(e.target.value)}
          >
            {statusArray.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[#3d5c62] font-medium">
              {totalPedidos} pedido(s)
            </span>
            {requierenRevision > 0 && (
              <span className="admin-badge bg-[#fde8e8] text-[#c45c6a]">
                {requierenRevision} pagado(s) sin stock — requieren revisión
              </span>
            )}
          </div>
        </div>
        {loading ? (
          <div className="w-12 h-12 mx-auto border-2 border-[#1aa89a] border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            {paginatedOrders.length === 0 ? (
              <div className="admin-card p-8 text-center text-[#6b8a8a]">
                No se encontraron pedidos
              </div>
            ) : (
              <>
                {paginatedOrders.map((pedido) => {
                  const estado = selectedStatus[pedido.id] || pedido.estado_pedido;
                  return (
                    <article
                      key={pedido.id}
                      className={`admin-card p-5 sm:p-6 mb-5 ${
                        pedido.requiere_revision ? "ring-2 ring-[#e07a7a]/70" : ""
                      }`}
                    >
                      {pedido.requiere_revision && (
                        <p className="mb-4 px-3 py-2 rounded-2xl bg-[#fde8e8] text-[#c45c6a] text-sm font-semibold">
                          Cobrado pero cancelado por falta de stock. Repón el
                          producto y reactiva el pedido, o reembolsa al cliente.
                        </p>
                      )}
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div className="space-y-1.5">
                          {metaItem("Pedido ID", pedido.id)}
                          <p className="text-sm">
                            <span className="font-semibold text-[#16343a]">Estado: </span>
                            <span className={`admin-badge ${STATUS_STYLES[pedido.estado_pedido] || "bg-white/70 text-[#3d5c62]"}`}>
                              {pedido.estado_pedido}
                            </span>
                          </p>
                          {metaItem(
                            "Pago",
                            `${pedido.fecha_pagado ? "Pagado" : "Pendiente"}${
                              pedido.intentos_pago > 1
                                ? ` (${pedido.intentos_pago} intentos, último: ${pedido.ultimo_estado_pago})`
                                : ""
                            }`
                          )}
                          {pedido.id_cargo &&
                            metaItem("Cargo Culqi", pedido.id_cargo)}
                          {metaItem(
                            "Fecha",
                            new Date(pedido.fecha_creado).toLocaleString()
                          )}
                          {metaItem("Importe Total", `S/. ${pedido.precio_total}`)}
                          {metaItem("Envío", `S/. ${pedido.precio_envio}`)}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            className="admin-input admin-input-inline"
                            value={estado}
                            onChange={(e) =>
                              handleStatusChange(pedido.id, e.target.value)
                            }
                          >
                            {statusArray
                              .filter((s) => s !== "Todos")
                              .map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                          </select>
                          <button
                            className="admin-btn-danger"
                            onClick={() =>
                              setDeleteConfirm({ open: true, id: pedido.id })
                            }
                          >
                            Cancelar Pedido
                          </button>
                        </div>
                      </div>
                      <div className="mt-5 pt-4 border-t border-white/70">
                        <h4 className="font-semibold text-[#16343a] mb-2">
                          Información del Comprador
                        </h4>
                        {metaItem("Nombre", pedido.informacion_envio?.nombre_completo)}
                        {metaItem("Teléfono", pedido.informacion_envio?.telefono)}
                        {metaItem(
                          "Dirección",
                          `${pedido.informacion_envio?.direccion}, ${pedido.informacion_envio?.distrito}, ${pedido.informacion_envio?.provincia}, ${pedido.informacion_envio?.departamento}, ${pedido.informacion_envio?.codigo_postal}`
                        )}
                      </div>

                      <div className="mt-5">
                        <h4 className="font-semibold text-[#16343a] mb-3">
                          Productos pedidos
                        </h4>
                        {Array.isArray(pedido.detalles_pedido) &&
                          pedido.detalles_pedido.map((item) => {
                            return (
                              <div
                                key={item.id}
                                className="flex items-center gap-4 mb-2 border-b border-white/70 pb-3 last:border-0"
                              >
                                {item.imagen && (
                                  <img
                                    src={item.imagen}
                                    alt={item.titulo}
                                    className="w-14 h-14 object-cover cursor-pointer rounded-2xl bg-white/70"
                                    onClick={() => setPreviewImg(item.imagen)}
                                  />
                                )}
                                <div>
                                  <p className="font-semibold text-[#16343a]">
                                    {item.titulo}
                                  </p>
                                  <p className="text-sm text-[#6b8a8a]">
                                    Cantidad: {item.cantidad} · Precio: S/.{" "}
                                    {item.precio} · Total: S/.{" "}
                                    {item.cantidad * item.precio}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </article>
                  );
                })}
                {maxPage > 1 && (
                  <div className="flex justify-center mt-6 gap-3 items-center">
                    <button
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="admin-btn"
                    >
                      Anterior
                    </button>
                    <span className="px-2 py-2 text-sm text-[#3d5c62]">
                      Página {currentPage} de {maxPage}
                    </span>
                    <button
                      onClick={() =>
                        setPage((prev) => Math.min(prev + 1, maxPage))
                      }
                      disabled={currentPage === maxPage}
                      className="admin-btn"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}

            {previewImg && (
              <div
                className="admin-modal-backdrop"
                onClick={() => setPreviewImg(null)}
              >
                <img
                  src={previewImg}
                  alt="Preview"
                  className="max-w-[90%] rounded-3xl shadow-xl"
                />
              </div>
            )}
            {deleteConfirm.open && (
              <div className="admin-modal-backdrop">
                <div className="admin-modal p-6 text-center max-w-sm">
                  <h3 className="text-lg font-semibold mb-5 text-[#16343a]">
                    ¿Estás seguro de que quieres cancelar este pedido?
                  </h3>
                  <div className="flex justify-center gap-3">
                    <button className="admin-btn-danger" onClick={confirmDelete}>
                      Sí, eliminar
                    </button>
                    <button
                      className="admin-btn-ghost"
                      onClick={() =>
                        setDeleteConfirm({ open: false, id: null })
                      }
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
};

export default Orders;
