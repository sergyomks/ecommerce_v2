import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import {
  fetchMensajesContacto,
  marcarMensajeLeido,
  eliminarMensajeContacto,
} from "../store/slices/adminSlice";

const ContactMessages = () => {
  const [page, setPage] = useState(1);
  const { mensajes, totalMensajes, mensajesLoading } = useSelector(
    (state) => state.admin
  );
  const dispatch = useDispatch();
  const maxPage = Math.max(Math.ceil((totalMensajes || 0) / 10), 1);

  useEffect(() => {
    dispatch(fetchMensajesContacto(page));
  }, [dispatch, page]);

  return (
    <main className="admin-page">
      <Header />
      <p className="text-sm text-[#6b8a8a] -mt-3 mb-6">
        Consultas enviadas desde la tienda.
      </p>
      <div className="admin-card p-4 sm:p-6">
        <div className="overflow-x-auto rounded-lg">
          {mensajesLoading ? (
            <div className="w-12 h-12 mx-auto border-2 border-[#1aa89a] border-t-transparent rounded-full animate-spin" />
          ) : mensajes && mensajes.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Asunto</th>
                  <th>Mensaje</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mensajes.map((msg) => (
                  <tr
                    key={msg.id}
                    className={`border-t hover:bg-gray-50 ${
                      !msg.leido ? "bg-yellow-50" : ""
                    }`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      {new Date(msg.fecha_creacion).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">{msg.nombre}</td>
                    <td className="py-3 px-4">{msg.email}</td>
                    <td className="py-3 px-4">{msg.asunto}</td>
                    <td className="py-3 px-4 max-w-xs truncate" title={msg.mensaje}>
                      {msg.mensaje}
                    </td>
                    <td className="py-3 px-4">
                      {msg.leido ? "Leído" : "Nuevo"}
                    </td>
                    <td className="py-3 px-4 space-x-2 whitespace-nowrap">
                      {!msg.leido && (
                        <button
                          onClick={() => dispatch(marcarMensajeLeido(msg.id, page))}
                          className="admin-btn"
                        >
                          Marcar leído
                        </button>
                      )}
                      <button
                        onClick={() =>
                          dispatch(eliminarMensajeContacto(msg.id, page))
                        }
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
            <h3 className="text-2xl p-6 font-bold">No hay mensajes</h3>
          )}
        </div>
        {!mensajesLoading && mensajes && mensajes.length > 0 && (
          <div className="flex justify-center mt-6 gap-3 items-center">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="admin-btn"
            >
              Anterior
            </button>
            <span className="px-2 py-2 text-sm text-[#3d5c62]">
              Página {page} / {maxPage}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, maxPage))}
              disabled={page >= maxPage}
              className="admin-btn"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default ContactMessages;
