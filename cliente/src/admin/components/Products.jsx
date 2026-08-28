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
  const { loading, products, totalProducts, fetchingProducts } = useSelector((state) => state.adminProduct);

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
    <main className="admin-page">
      <Header />
      <p className="text-sm text-[#6b8a8a] -mt-3 mb-6">Gestiona los productos de tu plataforma.</p>
      <div className="admin-card p-4 sm:p-6">
        <div className={`overflow-x-auto rounded-lg ${fetchingProducts ? "p-10 shadow-none" : `${products && products.length > 0 && "shadow-sm"}`}`}>
          {
            fetchingProducts ? (
              <div className="w-12 h-12 mx-auto border-2 border-[#1aa89a] border-t-transparent rounded-full animate-spin" />
            ) : products && products.length > 0 ? (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Imagen</th>
                    <th>Nombre</th>
                    <th>Categoria</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Calificaciones</th>
                    <th>Acciones</th>
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
                              if (typeof imgs === 'string') { try { imgs = JSON.parse(imgs); } catch { imgs = []; } }
                              const url = Array.isArray(imgs) && imgs.length > 0 ? imgs[0]?.url : null;
                              return url ? <img src={url} alt={product.nombre} className="w-10 h-10 rounded-md object-cover" /> : null;
                            })()}
                          </td>
                          <td className="py-3 px-4">{product.nombre}</td>
                          <td className="py-3 px-4">
                            {product.categoria_padre && product.subcategoria
                              ? `${product.categoria_padre} > ${product.subcategoria}`
                              : product.categoria}
                          </td>
                          <td className="py-3 px-4">{product.precio}</td>
                          <td className="py-3 px-4">{product.stock}</td>
                          <td className="py-3 px-4 text-yellow-500">{product.calificaciones}</td>
                          <td className="py-3 px-4 flex gap-2">
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(product);
                              dispatch(toggleUpdateProductModal());
                            }}
                              className="admin-btn">
                              Editar
                            </button>
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirm({ open: true, id: product.id, page: page });
                            }}
                              className="admin-btn-danger">
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
              <div className="admin-modal-backdrop">
                <div className="admin-modal p-6 text-center max-w-sm">
                  <h3 className="text-lg font-semibold mb-4 text-[#16343a]">¿Estás seguro de que quieres eliminar este producto?</h3>
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
          !fetchingProducts && products && products.length > 0 && (
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
      <button onClick={() => dispatch(toggleCreateProductModal())}
        className="fixed bottom-6 right-6 admin-btn rounded-full !px-4 !py-4 shadow-lg z-50"
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
