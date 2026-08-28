import React, { useState, useEffect } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import CreateProductModal from "../modals/CreateProductModal";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Header";
import UpdateProductModal from "../modals/UpdateProductModal";
import ViewProductModal from "../modals/ViewProductModal";
import { fetchAllProducts, deleteProduct } from "../store/slices/productsSlice";
import { toggleViewProductModal, toggleUpdateProductModal, toggleCreateProductModal } from "../store/slices/extraSlice";

const Products = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [maxPage, setMaxPage] = useState(null);
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const dispatch = useDispatch()

  const { isViewProductModalOpened, isCreateProductModalOpened, isUpdateProductModalOpened } = useSelector((state) => state.extra);
  const { loading, products, totalProducts, fetchingProducts } = useSelector((state) => state.product);

  useEffect(() => {
    dispatch(fetchAllProducts(page));
  }, [dispatch, page]);

  useEffect(() => {
    if (totalProducts !== undefined) {
      const newMax = Math.ceil(totalProducts / 10);
      setMaxPage(newMax || 1);
    }
  }, [totalProducts]);

  useEffect(() => {
    if (maxPage && page > maxPage) {
      setPage(maxPage);
    }
  }, [maxPage, page]);

  const confirmDelete = () => {
    dispatch(deleteProduct(deleteConfirm.id, page));
    setDeleteConfirm({ open: false, id: null });
  };

  return <>
    <main className="p-[10px] pl-[10px] md:pl-[17rem] w-full">
      <div className="flex-1 md:p-6">
        <Header />
        <h1 className="text-2xl font-bold">Todos los Productos</h1>
        <p className="text-sm text-gray-600 mb-6">Gestiona los productos de tu plataforma.</p>
      </div>
      <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
        <div className={`overflow-x-auto rounded-lg ${fetchingProducts ? "p-10 shadow-none" : `${products && products.length > 0 && "shadow-sm"}`}`}>
          {
            fetchingProducts ? (
              <div className="w-40 h-40 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : products && products.length > 0 ? (
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-blue-100 text-gray-700">
                  <tr>
                    <th className="py-3 px-4 text-left">Imagen</th>
                    <th className="py-3 px-4 text-left">Nombre</th>
                    <th className="py-3 px-4 text-left">Categoria</th>
                    <th className="py-3 px-4 text-left">Precio</th>
                    <th className="py-3 px-4 text-left">Stock</th>
                    <th className="py-3 px-4 text-left">Calificaciones</th>
                    <th className="py-3 px-4 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    products.map((product, index) => {

                      return (
                        <tr key={index} className="border-t hover:bg-gray-50"
                          onClick={() => {
                            setSelectedProduct(product);
                            dispatch(toggleViewProductModal());
                          }}
                        >

                          <td className="py-3 px-4">
                            {(() => {
                              let imgs = product?.imagenes;
                              if (typeof imgs === 'string') { try { imgs = JSON.parse(imgs); } catch(e) { imgs = []; } }
                              const url = Array.isArray(imgs) && imgs.length > 0 ? imgs[0]?.url : null;
                              return url ? <img src={url} alt={product.nombre} className="w-10 h-10 rounded-md object-cover" /> : null;
                            })()}
                          </td>
                          <td className="py-3 px-4">{product.nombre}</td>
                          <td className="py-3 px-4">{product.categoria}</td>
                          <td className="py-3 px-4">{product.precio}</td>
                          <td className="py-3 px-4">{product.stock}</td>
                          <td className="py-3 px-4 text-yellow-500">{product.calificaciones}</td>
                          <td className="py-3 px-4 flex gap-2">
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                              dispatch(toggleUpdateProductModal());
                            }}
                              className="text-white cursor-pointer rounded-md font-semibold bg-blue-gradient px-3 py-2">
                              Editar
                            </button>
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({ open: true, id: product.id, page: page });
                            }}
                              className="text-white cursor-pointer rounded-md font-semibold bg-red-gradient px-3 py-2 flex gap-2 items-center">
                              {
                                deleteConfirm.open && deleteConfirm.id === product.id && loading ? (
                                  <>

                                    <LoaderCircle className="w-6 h-6 animate-spin" />
                                    Eliminando...
                                  </>
                                ) : (

                                  "Eliminar"

                                )
                              }
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  }
                </tbody>
              </table>
            ) : (
              <h3 className="text-2xl p-6 font-bold ">No hay productos</h3>
            )
          }
          {
            deleteConfirm.open && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded shadow-lg text-center max-w-sm w-full">
                  <h3 className="text-lg font-semibold mb-4">¿Estás seguro de que quieres eliminar este producto?</h3>
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
          !fetchingProducts && products && products.length > 0 && (
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
      <button onClick={() => dispatch(toggleCreateProductModal())}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 py-2 rounded-full hover:bg-blue-700 shadow-lg z-50 transition-all duration-300"
        title="Agregar Producto"
      >
        <Plus size={20} />
      </button>
    </main>
    {isCreateProductModalOpened && <CreateProductModal />}
    {isUpdateProductModalOpened && <UpdateProductModal selectedProduct={selectedProduct} />}
    {isViewProductModalOpened && <ViewProductModal selectedProduct={selectedProduct} />}
  </>;
};

export default Products;
