import React, { useEffect, useState } from "react";
import avatar from "../assets/avatar.jpg";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import { fetchAllUsers, deleteUser } from "../store/slices/adminSlice";

const Users = () => {
  const [page, setPage] = useState(1);
  const { loading, users, totalUsers } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const [maxPage, setMaxPage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });

  useEffect(() => {
    dispatch(fetchAllUsers(page));

  }, [dispatch, page]);

  useEffect(() => {
    if (totalUsers !== undefined) {
      const newMax = Math.ceil(totalUsers / 10);
      setMaxPage(newMax || 1);
    }
  }, [totalUsers]);

  useEffect(() => {
    if (maxPage && page > maxPage) {
      setPage(maxPage);
    }
  }, [maxPage, page]);

  const handleDeleteUser = (id) => {
    setDeleteConfirm({ open: true, id });
  };

  const confirmDelete = () => {
    setDeleteConfirm({ open: false, id: null });
    dispatch(deleteUser(deleteConfirm.id, page));
  };

  return <>

    <main className="p-[10px] pl-[10px] md:pl-[17rem] w-full">
      <div className="flex-1 md:p-6">
        <Header />
        <h1 className="text-2xl font-bold">Todos los Usuarios</h1>
        <p className="text-sm text-gray-600 mb-6">Gestiona los usuarios de tu plataforma.</p>
      </div>
      <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
        <div className={`overflow-x-auto rounded-lg ${loading ? "p-10 shadow-none" : `${users && users.length > 0 && "shadow-sm"}`}`}>
          {
            loading ? (
              <div className="w-40 h-40 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : users && users.length > 0 ? (
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-blue-100 text-gray-700">
                  <tr>
                    <th className="py-3 px-4 text-left">Foto</th>
                    <th className="py-3 px-4 text-left">Nombre</th>
                    <th className="py-3 px-4 text-left">Email</th>
                    <th className="py-3 px-4 text-left">Fecha de registro</th>
                    <th className="py-3 px-4 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    users.map((user, index) => {

                      return (
                        <tr key={index} className="border-t hover:bg-gray-50">

                          <td className="py-3 px-4">
                            <img src={user.imagen?.url || avatar}
                              alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                          </td>
                          <td className="py-3 px-4">{user.nombre}</td>
                          <td className="py-3 px-4">{user.email}</td>
                          <td className="py-3 px-4">{new Date(user.fecha_creacion).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <button onClick={() => handleDeleteUser(user.id)}
                              className="text-white cursor-pointer font-semibold bg-red-gradient  px-3 py-2 rounded-md">
                              Eliminar
                            </button>

                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            ) : (
              <h3 className="text-2xl p-6 font-bold ">No hay usuarios</h3>
            )
          }
          {
            deleteConfirm.open && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded shadow-lg text-center max-w-sm w-full">
                  <h3 className="text-lg font-semibold mb-4">¿Estás seguro de que quieres eliminar este usuario?</h3>
                  <div className="flex justify-self-center gap-4">
                    <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" onClick={confirmDelete}>Sí, eliminar</button>
                    <button className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400" onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancelar</button>
                  </div>
                </div>
              </div>
            )
          }
        </div>
        {
          !loading && users && users.length > 0 && (
            <div className="flex justify-center mt-6 gap-4">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 text-white disabled:opacity-50 "
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-gray-700">Página {page}</span>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, maxPage))}
                disabled={page === maxPage}
                className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600 text-white disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )
        }
      </div>
    </main>
  </>;
};

export default Users;
