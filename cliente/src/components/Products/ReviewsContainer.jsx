import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { publicarResenaProducto, eliminarResenaProducto } from "../../store/slices/productSlice.js";
import { Star } from "lucide-react";

const ReviewsContainer = ({ producto, productReviews }) => {

  const { authUser } = useSelector((state) => state.auth);
  const { isReviewDeleting, isPostingReview } = useSelector((state) => state.product);
  const dispatch = useDispatch();
  const [calificacion, setCalificacion] = useState(1);
  const [comentario, setComentario] = useState("");

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    dispatch(publicarResenaProducto({
      productoId: producto.id,
      resena: { calificacion: calificacion, comentario }
    }));
    setComentario("");
    setCalificacion(1);
  };
  return <>
    {
      authUser && (
        <form onSubmit={handleReviewSubmit} className="mb-8 space-y-4">
          <h4 className="text-lg font-semibold">Publicar reseña</h4>
          <div className="flex items-center space-x-2">
            {
              [...Array(5)].map((_, i) => {
                return (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setCalificacion(i + 1)}
                    className={`text-2xl ${i < calificacion ? "text-yellow-400" : "text-gray-300"
                      }`}
                  >
                    ✰
                  </button>
                );
              })
            }
          </div>
          <textarea
            rows={4}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Escribe tu reseña"
            className="w-full p-3 border-border rounded-md bg-background text-foreground"
          ></textarea>
          <button type="submit" disabled={isPostingReview} className=" px-6 py-2 bg-primary rounded-lg text-primary-foreground font-semibold hover:glow-on-hover animate-smooth disabled:opacity-50">
            {isPostingReview ? "Publicando..." : "Publicar reseña"}
          </button>
        </form>
      )
    }
    <h3 className="text-xl font-semibold text-foreground mb-6">Reseñas de clientes</h3>
    {
      productReviews && productReviews.length > 0 ? (
        <div className="space-y-6">
          {
            productReviews.map((review) => {
              return (
                <div key={review.id} className="glass-card p-6">
                  <div className="flex items-center space-x-4">
                    <img src={review?.usuario?.avatar?.url || `/avatar-holder.avif`} alt={review.usuario_nombre} className="w-12 h-12 rounded-full text-foreground" />

                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h4 className="font-semibold text-foreground">{review.usuario_nombre}</h4>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => {
                            return (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < Math.floor(review.calificacion || 0) ? "fill-current text-yellow-400 " : "text-gray-300"}`}
                              />
                            )

                          })}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-2">{review.comentario}</p>
                      {
                        authUser?.id === review.id_usuario && (
                          <button onClick={() => dispatch(eliminarResenaProducto({ productoId: producto.id, resenaId: review.id }))} disabled={isReviewDeleting} className="
                        my-6 w-fit flex items-center space-x-3 p-3 rounded-lg glass-card hover:glow-on-hover text-destructive hover:text-destructive-foreground group">
                            {isReviewDeleting ? (<>
                              <div className="
                            w-5 h-5 rounded-full border-2 border-white border-t-transparent rounded-full animate-spin
                          ">
                                {" "}
                              </div>
                              <span>Eliminando reseña...</span>
                            </>) : (<span>Eliminar reseña</span>)}
                          </button>
                        )
                      }
                    </div>
                  </div>

                </div>
              );
            })
          }
        </div>
      ) : (
        <p className="text-muted-foreground">Aún no hay reseñas. Sé el primero en reseñar este producto.</p>
      )
    }

  </>;
};

export default ReviewsContainer;
