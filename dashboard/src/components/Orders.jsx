import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteOrder,
  fetchAllOrders,
  updateOrderStatus,
} from "../store/slices/orderSlice";

const Orders = () => {
  const statusArray = ["Todos", "Procesando", "Enviado", "Entregado", "Cancelado"];
  const dispatch = useDispatch();
  const { orders: pedidos, loading } = useSelector((state) => state.order);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [trackingDraft, setTrackingDraft] = useState({});
  const [filterByStatus, setFilterByStatus] = useState("Todos");
  const [previewImg, setPreviewImg] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    dispatch(fetchAllOrders());
    const interval = setInterval(() => {
      dispatch(fetchAllOrders());
    }, 5000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleStatusChange = (pedidoId, newStatus) => {
    setSelectedStatus((prev) => ({ ...prev, [pedidoId]: newStatus }));
    const draft = trackingDraft[pedidoId] || {};
    dispatch(
      updateOrderStatus({
        pedidoId,
        status: newStatus,
        carrier: draft.carrier,
        codigo_seguimiento: draft.codigo_seguimiento,
        url_tracking: draft.url_tracking,
      })
    );
  };

  const handleSaveTracking = (pedido) => {
    const draft = trackingDraft[pedido.id] || {};
    const status = selectedStatus[pedido.id] || pedido.estado_pedido;
    dispatch(
      updateOrderStatus({
        pedidoId: pedido.id,
        status,
        carrier: draft.carrier ?? pedido.informacion_envio?.carrier ?? "",
        codigo_seguimiento:
          draft.codigo_seguimiento ??
          pedido.informacion_envio?.codigo_seguimiento ??
          "",
        url_tracking:
          draft.url_tracking ?? pedido.informacion_envio?.url_tracking ?? "",
      })
    );
  };

  const filteredOrders =
    filterByStatus === "Todos"
      ? pedidos
      : pedidos?.filter((pedido) => pedido.estado_pedido === filterByStatus);

  const maxPage = Math.ceil((filteredOrders || []).length / ITEMS_PER_PAGE) || 1;
  const currentPage = Math.min(page, maxPage);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = (filteredOrders || []).slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const confirmDelete = () => {
    setDeleteConfirm({ open: false, id: null });
    dispatch(deleteOrder(deleteConfirm.id));
  };

  return (
    <>
      <main className="p-[10px] pl-[10px] md:pl-[17rem] w-full">
        <div className="flex-1 md:p-6">
          <h1 className="text-2xl font-bold">Administrar Todos Los Pedidos</h1>
          <p className="text-sm text-gray-600 mb-6">Gestiona tus pedidos</p>
        </div>
        {loading ? (
          <div className="w-40 h-40 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
            {filteredOrders.length === 0 ? (
              <h3 className="text-2xl p-6 font-bold">No se encontraron pedidos</h3>
            ) : (
              <>
                <div className="flex justify-between items-center p-6">
                  <select
                    className="p-2 border rounded shadow-sm"
                    onChange={(e) => {
                      setFilterByStatus(e.target.value);
                      setPage(1);
                    }}
                  >
                    {statusArray.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>
                {paginatedOrders.map((pedido) => {
                  const draft = trackingDraft[pedido.id] || {};
                  return (
                    <div
                      key={pedido.id}
                      className="bg-white rounded-lg shadow-lg p-6 mb-6 transition-all"
                    >
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                          <p>
                            <strong>Pedido ID:</strong>
                            {pedido.id}
                          </p>
                          <p>
                            <strong>Estado:</strong>
                            {pedido.estado_pedido}
                          </p>
                          <p>
                            <strong>Fecha:</strong>
                            {""}
                            {new Date(pedido.fecha_creado).toLocaleString()}
                          </p>
                          <p>
                            <strong>Importe Total:</strong>S/.{" "}
                            {pedido.precio_total}
                          </p>
                          <p>
                            <strong>Envío:</strong>S/. {pedido.precio_envio}
                          </p>
                        </div>
                        <div>
                          <select
                            className="border p-2 rounded mb-2"
                            value={
                              selectedStatus[pedido.id] || pedido.estado_pedido
                            }
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
                            className="ml-3 text-white bg-red-500 hover:bg-red-600 rounded px-3 py-1"
                            onClick={() =>
                              setDeleteConfirm({ open: true, id: pedido.id })
                            }
                          >
                            Cancelar Pedido
                          </button>
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-semibold text-lg mb-1">
                          {" "}
                          Información del Comprador:
                        </h4>
                        <p>
                          <strong>Nombre:</strong>
                          {pedido.informacion_envio?.nombre_completo}
                        </p>
                        <p>
                          <strong>Teléfono:</strong>
                          {pedido.informacion_envio?.telefono}
                        </p>
                        <p>
                          <strong>Direccion:</strong>
                          {pedido.informacion_envio?.direccion},{" "}
                          {pedido.informacion_envio?.distrito},
                          {pedido.informacion_envio?.provincia},
                          {pedido.informacion_envio?.departamento},
                          {pedido.informacion_envio?.codigo_postal}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded">
                        <h4 className="md:col-span-3 font-semibold">
                          Tracking / courier
                        </h4>
                        <input
                          type="text"
                          placeholder="Courier (Olva, Shalom...)"
                          className="border p-2 rounded"
                          value={
                            draft.carrier ??
                            pedido.informacion_envio?.carrier ??
                            ""
                          }
                          onChange={(e) =>
                            setTrackingDraft((prev) => ({
                              ...prev,
                              [pedido.id]: {
                                ...prev[pedido.id],
                                carrier: e.target.value,
                              },
                            }))
                          }
                        />
                        <input
                          type="text"
                          placeholder="Código de seguimiento"
                          className="border p-2 rounded"
                          value={
                            draft.codigo_seguimiento ??
                            pedido.informacion_envio?.codigo_seguimiento ??
                            ""
                          }
                          onChange={(e) =>
                            setTrackingDraft((prev) => ({
                              ...prev,
                              [pedido.id]: {
                                ...prev[pedido.id],
                                codigo_seguimiento: e.target.value,
                              },
                            }))
                          }
                        />
                        <input
                          type="url"
                          placeholder="URL de tracking"
                          className="border p-2 rounded"
                          value={
                            draft.url_tracking ??
                            pedido.informacion_envio?.url_tracking ??
                            ""
                          }
                          onChange={(e) =>
                            setTrackingDraft((prev) => ({
                              ...prev,
                              [pedido.id]: {
                                ...prev[pedido.id],
                                url_tracking: e.target.value,
                              },
                            }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveTracking(pedido)}
                          className="md:col-span-3 bg-blue-600 text-white px-4 py-2 rounded w-fit"
                        >
                          Guardar tracking
                        </button>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-semibold text-lg mb-2">
                          productos pedidos:
                        </h4>
                        {Array.isArray(pedido.detalles_pedido) &&
                          pedido.detalles_pedido.map((item) => {
                            return (
                              <div
                                key={item.id}
                                className="flex items-center gap-4 mb-2 border-b pb-2"
                              >
                                {item.imagen && (
                                  <img
                                    src={item.imagen}
                                    alt={item.titulo}
                                    className="w-16 h-16 object-cover cursor-pointer"
                                    onClick={() => setPreviewImg(item.imagen)}
                                  />
                                )}
                                <div>
                                  <p className="font-semibold">{item.titulo}</p>
                                  <p>
                                    <strong>Cantidad:</strong>
                                    {item.cantidad} | <strong>Precio:</strong>
                                    S/. {item.precio} | <strong>Total:</strong>
                                    S/. {item.cantidad * item.precio}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  );
                })}
                {!loading && filteredOrders.length > 0 && (
                  <div className="flex justify-center mt-6 gap-4">
                    <button
                      onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 text-white disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <span className="px-4 py-2 text-gray-700">
                      Página {currentPage} de {maxPage}
                    </span>
                    <button
                      onClick={() =>
                        setPage((prev) => Math.min(prev + 1, maxPage))
                      }
                      disabled={currentPage === maxPage}
                      className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 text-white disabled:opacity-50"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}

            {previewImg && (
              <div
                className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
                onClick={() => setPreviewImg(null)}
              >
                <img
                  src={previewImg}
                  alt="Preview"
                  className="max-w-[90%]  rounded shadow-xl"
                />
              </div>
            )}
            {deleteConfirm.open && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded shadow-lg text-center max-w-sm w-full">
                  <h3 className="text-lg font-semibold mb-4">
                    ¿Estás seguro de que quieres cancelar este pedido?
                  </h3>
                  <div className="flex justify-self-center gap-4">
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                      onClick={confirmDelete}
                    >
                      Si, Eliminar
                    </button>
                    <button
                      className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
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
