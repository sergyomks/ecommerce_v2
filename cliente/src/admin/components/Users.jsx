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

    <main className="admin-page">
      <Header />
      <p className="text-sm text-[#6b8a8a] -mt-3 mb-6">Gestiona los usuarios de tu plataforma.</p>
      <div className="admin-card p-4 sm:p-6">
        <div className={`overflow-x-auto rounded-lg ${loading ? "p-10 shadow-none" : `${users && users.length > 0 && "shadow-sm"}`}`}>
          {
            loading ? (
              <div className="w-12 h-12 mx-auto border-2 border-[#1aa89a] border-t-transparent rounded-full animate-spin" />
            ) : users && users.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Fecha de registro</th>
                    <th>Acciones</th>
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
                              className="admin-btn-danger">
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
              <div className="admin-modal-backdrop">
                <div className="admin-modal p-6 text-center max-w-sm">
                  <h3 className="text-lg font-semibold mb-4 text-[#16343a]">¿Estás seguro de que quieres eliminar este usuario?</h3>
                  <div className="flex justify-center gap-3">
                    <button className="admin-btn-danger" onClick={confirmDelete}>Sí, eliminar</button>
                    <button className="admin-btn-ghost" onClick={() => setDeleteConfirm({ open: false, id: null })}>Cancelar</button>
                  </div>
                </div>
              </div>
            )
          }
        </div>
        {
          !loading && users && users.length > 0 && (
            <div className="flex justify-center mt-6 gap-3 items-center">
              <button
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="admin-btn"
              >
                Anterior
              </button>
              <span className="px-2 py-2 text-sm text-[#3d5c62]">Página {page}</span>
              <button
                onClick={() => setPage(prev => Math.min(prev + 1, maxPage))}
                disabled={page === maxPage}
                className="admin-btn"
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
