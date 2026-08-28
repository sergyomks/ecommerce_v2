import React from "react";
import { useDispatch } from "react-redux";
import { toggleViewProductModal } from "../store/slices/extraSlice";

const ViewProductModal = ({ selectedProduct }) => {
  const dispatch = useDispatch();
  return (
    <>
      <div className="admin-modal-backdrop">
        <div className="admin-modal max-w-3xl p-6 overflow-y-auto max-h-[90vh] relative">
          <button
            onClick={() => dispatch(toggleViewProductModal())}
            className="absolute top-4 right-4 text-[#6b8a8a] hover:text-[#c45c6a] text-xl"
          >
            &times;
          </button>
          <h2 className="text-2xl font-bold mb-4 text-[#16343a]">{selectedProduct.nombre}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="grid grid-cols-2 gap-3">
              {(() => {
                let imgs = selectedProduct?.imagenes;
                if (typeof imgs === "string") {
                  try {
                    imgs = JSON.parse(imgs);
                  } catch {
                    imgs = [];
                  }
                }
                if (!Array.isArray(imgs)) imgs = [];
                return imgs.map((img, idx) => (
                  <img
                    key={idx}
                    src={img?.url}
                    alt={`Product ${idx}`}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ));
              })()}
            </div>

            <div>
              <p>
                <strong>ID:</strong> {selectedProduct.id}
              </p>
              <p>
                <strong>Descripción:</strong> {selectedProduct.descripcion}
              </p>
              <p>
                <strong>Categoría:</strong> {selectedProduct.categoria}
              </p>
              <p>
                <strong>Precio:</strong> S/.{" "}
                {Number(selectedProduct.precio || 0).toLocaleString()}
              </p>
              <p>
                <strong>Calificaciones:</strong> ⭐ {selectedProduct.calificaciones}
              </p>
              <p>
                <strong>Stock:</strong>{" "}
                {selectedProduct.stock > 0
                  ? `En Stock (${selectedProduct.stock})`
                  : "Sin Stock"}
              </p>
              <p>
                <strong>Fecha de creación:</strong>{" "}
                {new Date(selectedProduct.fecha_creacion).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewProductModal;
