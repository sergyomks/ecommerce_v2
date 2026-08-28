import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { CreditCard, Lock } from "lucide-react";
import { toast } from "react-toastify";
import { processPayment, resetOrderState } from "../store/slices/orderSlice";
import { clearCart } from "../store/slices/cartSlice";
import { axiosInstance } from "../lib/axios";

const obtenerHuellaDispositivo = async () => {
  if (typeof window.Culqi3DS?.generateDevice !== "function") return undefined;
  try {
    return (await window.Culqi3DS.generateDevice()) || undefined;
  } catch {
    return undefined;
  }
};

const PaymentForm = ({ total }) => {
  const { currentPedidoId, finalPrice, processingPayment } = useSelector(
    (state) => state.order
  );
  const { authUser } = useSelector((state) => state.auth);
  const [scriptListo, setScriptListo] = useState(!!window.Culqi);
  const [publicKey, setPublicKey] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const dispatch = useDispatch();
  const navigateTo = useNavigate();

  const culqiLoaded = scriptListo && Boolean(publicKey);

  useEffect(() => {
    if (window.Culqi) {
      setScriptListo(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.Culqi) {
        setScriptListo(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelado = false;

    axiosInstance
      .get("/pago/llave-culqi")
      .then((res) => {
        if (!cancelado) setPublicKey(res.data.publicKey || null);
      })
      .catch(() => {
        if (!cancelado) {
          toast.error("No se pudo cargar la configuración de pago.");
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (culqiLoaded && window.Culqi) {
      window.Culqi.publicKey = publicKey;
      window.Culqi.settings({
        title: "Mi Tienda",
        currency: "PEN",
        amount: Math.round((finalPrice || total) * 100),
      });
      window.Culqi.options({
        lang: "es",
        style: {
          bannerColor: "#8B5CF6",
          buttonBackground: "#8B5CF6",
          menuColor: "#8B5CF6",
          linksColor: "#8B5CF6",
          buttonText: "Pagar",
          buttonTextColor: "#FFFFFF",
          priceColor: "#8B5CF6",
        },
      });
    }
  }, [culqiLoaded, publicKey, finalPrice, total, currentPedidoId]);

  const handleCulqiToken = useCallback(async () => {
    if (!window.Culqi) return;

    if (window.Culqi.token) {
      const token = window.Culqi.token;
      setIsProcessing(true);
      window.Culqi.close?.();

      try {
        const result = await dispatch(
          processPayment({
            tokenId: token.id,
            email: token.email || authUser?.email,
            pedidoId: currentPedidoId,
            deviceFingerPrintId: await obtenerHuellaDispositivo(),
          })
        ).unwrap();

        if (result.success) {
          toast.success("¡Pago realizado con éxito! Redirigiendo a tus pedidos...");
          dispatch(clearCart());
          dispatch(resetOrderState());
          setTimeout(() => {
            navigateTo("/orders");
          }, 2000);
        }
      } catch (error) {
        toast.error(error || "Error al procesar el pago. Inténtalo de nuevo.");
      } finally {
        setIsProcessing(false);
      }
    } else if (window.Culqi.error) {
      toast.error(window.Culqi.error.user_message || "Error al procesar la tarjeta.");
    }
  }, [dispatch, authUser, currentPedidoId, navigateTo]);

  useEffect(() => {
    window.culqi = () => {
      handleCulqiToken();
    };
    return () => {
      delete window.culqi;
    };
  }, [handleCulqiToken]);

  const handleOpenCulqi = (e) => {
    e.preventDefault();
    if (!culqiLoaded || !window.Culqi) {
      toast.error("El procesador de pagos aún se está cargando.");
      return;
    }
    if (!currentPedidoId) {
      toast.error("Error: No se encontró el pedido. Intenta de nuevo.");
      return;
    }
    window.Culqi.open();
  };

  return (
    <div className="glass-panel">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-primary-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Pago con Tarjeta</h2>
      </div>

      <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
        <p className="text-sm text-muted-foreground mb-1">Monto a pagar</p>
        <p className="text-2xl font-bold text-primary">
          S/{(finalPrice || total || 0).toFixed(2)}
        </p>
      </div>

      <div className="flex items-center space-x-2 mb-6 p-4 bg-secondary/50 rounded-lg">
        <Lock className="w-5 h-5 text-green-500" />
        <span className="text-sm text-muted-foreground">
          Su información de tarjeta está encriptada y segura mediante Culqi.
        </span>
      </div>

      <button
        onClick={handleOpenCulqi}
        disabled={!culqiLoaded || isProcessing || processingPayment}
        className="flex justify-center items-center gap-2 w-full py-3 gradient-primary text-primary-foreground rounded-lg hover:glow-on-hover animate-smooth font-semibold disabled:opacity-50"
      >
        {isProcessing || processingPayment ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-white">Procesando pago ...</span>
          </>
        ) : !culqiLoaded ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Cargando procesador...</span>
          </>
        ) : (
          "Pagar con Tarjeta"
        )}
      </button>
    </div>
  );
};

export default PaymentForm;
