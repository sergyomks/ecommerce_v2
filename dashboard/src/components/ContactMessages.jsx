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
    <main className="p-[10px] pl-[10px] md:pl-[17rem] w-full">
      <div className="flex-1 md:p-6">
        <Header />
        <h1 className="text-2xl font-bold">Mensajes de contacto</h1>
        <p className="text-sm text-gray-600 mb-6">
          Consultas enviadas desde la tienda.
        </p>
      </div>
      <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
        <div className="overflow-x-auto rounded-lg">
          {mensajesLoading ? (
            <div className="w-40 h-40 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : mensajes && mensajes.length > 0 ? (
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-blue-100 text-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Fecha</th>
                  <th className="py-3 px-4 text-left">Nombre</th>
                  <th className="py-3 px-4 text-left">Email</th>
                  <th className="py-3 px-4 text-left">Asunto</th>
                  <th className="py-3 px-4 text-left">Mensaje</th>
                  <th className="py-3 px-4 text-left">Estado</th>
                  <th className="py-3 px-4 text-left">Acciones</th>
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
                          className="text-white cursor-pointer font-semibold bg-blue-600 px-3 py-2 rounded-md"
                        >
                          Marcar leído
                        </button>
                      )}
                      <button
                        onClick={() =>
                          dispatch(eliminarMensajeContacto(msg.id, page))
                        }
                        className="text-white cursor-pointer font-semibold bg-red-gradient px-3 py-2 rounded-md"
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
          <div className="flex justify-center mt-6 gap-4">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 text-white disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-4 py-2 text-gray-700">
              Página {page} / {maxPage}
            </span>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, maxPage))}
              disabled={page >= maxPage}
              className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 text-white disabled:opacity-50"
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
