import React, { useState } from "react";
import { X, Search, Sparkles } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleAIModal } from "../../store/slices/popupSlice";
import { buscarIAFiltrarProducto } from "../../store/slices/productSlice";

const AISearchModal = () => {
  const [mensajeUsuario, setMensajeUsuario] = useState("");
  const { aiSearching } = useSelector((state) => state.product);
  const { isAIPopupOpen } = useSelector((state) => state.popup);
  const exampleText = [
    "Auriculares inalámbricos para videojuegos con buenos graves.",
    "Teclado mecánico RGB para gaming con switches silenciosos.",
    "Mouse inalámbrico ergonómico para largas jornadas de trabajo.",
    "Monitor ultrapanorámico con tasa de refresco de 144Hz para gaming.",
    "Silla ergonómica para oficina con soporte lumbar ajustable.",
    "Tarjeta gráfica NVIDIA RTX 4060 Ti 8GB."
  ]
  const dispatch = useDispatch();

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(buscarIAFiltrarProducto(mensajeUsuario));
  };

  if (!isAIPopupOpen) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm
    z-50 flex items-center justify-center p-4"
      onClick={() => dispatch(toggleAIModal())}
    >
      <div
        className="bg-background/95 backdrop-blur-md border
      border-border rounded-2xl p-8 w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        { }
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 bg-gradient-to-br from-purple-500
            to-blue-500 rounded-full flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Busqueda de productos con IA
            </h2>
          </div>
          <button
            onClick={() => dispatch(toggleAIModal())}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        { }
        <p className="text-muted-foreground mb-6">
          Describe lo que estás buscando y nuestra IA encontrará los productos perfectos para ti.
        </p>

        { }
        <form onSubmit={handleSearch} className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="e.g., 'Auriculares inalámbricos para videojuegos con buenos graves.'"
              value={mensajeUsuario}
              onChange={(e) => setMensajeUsuario(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-secondary border border-border rounded-lg focus:outline-none
              focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground"
              required
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={aiSearching || !mensajeUsuario.trim()}
            className={`w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg
              font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center space-x-2 ${aiSearching && "animate-pulse"
              }`}
          >
            {aiSearching ? (
              <>
                <div
                  className={`w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin`}
                />
                <span>IA haciendo magia en el fondo ...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Buscar con IA</span>
              </>
            )}
          </button>
        </form>

        { }
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-3">
            Prueba con estos ejemplos:
          </p>
          <div className="flex flex-wrap gap-2">
            {exampleText.map((example) => (
              <button
                key={example}
                onClick={() => setMensajeUsuario(example)}
                className="px-3 py-1 bg-secondary text-foreground rounded-full
                text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISearchModal;
