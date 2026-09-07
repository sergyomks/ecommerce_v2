import { useState, useEffect } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import PaymentForm from "../components/PaymentForm";
import { placeOrder } from "../store/slices/orderSlice";
import { axiosInstance } from "../lib/axios";
import { extraerIgv } from "../lib/igv";
import { precioLinea, formatearSoles } from "../lib/precio";
import SelectorUbigeo from "../components/Layout/SelectorUbigeo";

const Payment = () => {
  const { authUser } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cart } = useSelector((state) => state.cart);
  const { orderStep, placingOrder } = useSelector((state) => state.order);
  const [shippingDetails, setShippingDetails] = useState({
    nombre_completo: "",

    id_distrito: null,
    departamento: "",
    provincia: "",
    distrito: "",
    direccion: "",
    telefono: "",
    codigo_postal: "",
    referencia: "",
  });
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [descuento, setDescuento] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [precioEnvio, setPrecioEnvio] = useState(2);
  const [umbralGratis, setUmbralGratis] = useState(50);
  const [tarifasEnvio, setTarifasEnvio] = useState([]);

  useEffect(() => {
    if (!authUser) {
      navigate("/products");
    }
  }, [authUser, navigate]);

  useEffect(() => {
    let cancelled = false;
    axiosInstance
      .get("/envio/tarifas")
      .then((res) => {
        if (!cancelled) setTarifasEnvio(res.data.tarifas || []);
      })
      .catch(() => {
        if (!cancelled) setTarifasEnvio([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const subtotal = cart.reduce(
    (sum, item) => sum + precioLinea(item) * item.cantidad,
    0
  );
  const ahorro = cart.reduce((sum, item) => {
    const precio = Number(item.producto?.precio);
    const efectivo = Number(item.producto?.precio_efectivo);
    const cantidad = Number(item.cantidad) || 0;
    if (
      Number.isFinite(precio) &&
      Number.isFinite(efectivo) &&
      efectivo > 0 &&
      efectivo < precio
    ) {
      return sum + (precio - efectivo) * cantidad;
    }
    return sum;
  }, 0);
  const baseImponible = Math.max(subtotal - descuento, 0);
  const igv = extraerIgv(baseImponible);
  const total =
    Math.round((baseImponible + precioEnvio) * 100) / 100;

  useEffect(() => {
    let cancelled = false;
    const fetchEnvio = async () => {
      try {
        const res = await axiosInstance.get("/envio/calcular", {
          params: {
            departamento: shippingDetails.departamento || "",
            subtotal: baseImponible,
          },
        });
        if (!cancelled) {
          setPrecioEnvio(Number(res.data.precio) || 0);
          if (res.data.umbral_gratis != null) {
            setUmbralGratis(Number(res.data.umbral_gratis) || 50);
          }
        }
      } catch {

      }
    };
    fetchEnvio();
    return () => {
      cancelled = true;
    };
  }, [shippingDetails.departamento, baseImponible]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Ingresa un código de cupón.");
      return;
    }
    setValidatingCoupon(true);
    try {
      const res = await axiosInstance.post("/cupon/validar", {
        codigo: couponCode.trim(),
        subtotal,
      });
      setAppliedCoupon(res.data.cupon);
      setDescuento(Number(res.data.descuento) || 0);
      setCouponCode(res.data.cupon.codigo);
      toast.success(res.data.message || "Cupón aplicado.");
    } catch (error) {
      setAppliedCoupon(null);
      setDescuento(0);
      toast.error(error.response?.data?.message || "Cupón no válido.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDescuento(0);
    setCouponCode("");
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (!shippingDetails.id_distrito) {
      toast.error("Elige tu distrito de la lista para continuar.");
      return;
    }
    dispatch(
      placeOrder({
        ...shippingDetails,
        pedidoItems: cart,
        codigo_cupon: appliedCoupon?.codigo || undefined,
        id_cupon: appliedCoupon?.id || undefined,
      })
    );
  };

  if (!authUser) return null;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-panel max-w-md p-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            No hay productos en el carrito
          </h1>
          <p className="text-muted-foreground mb-6">
            Agrega productos para continuar con el pago
          </p>
          <Link
            to="/products"
            className=" inline-flex items-center space-x-2 px-6 py-3 gradient-primary text-primary-foreground rounded-lg hover:glow-on-hover animate-smooth font-semibold"
          >
            Navegar a productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen">
        <div className="store-wrap py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center space-x-4 mb-8">
              <Link
                to="/cart"
                className="p-2 glass-card hover:glow-on-hover animate-smooth"
              >
                <ArrowLeft className="w-5 h-5 text-primary" />
              </Link>
            </div>
            <div className="flex items-center justify-center mb-12">
              <div className="flex items-center space-x-4">
                <div
                  className={`flex items-center space-x-2 ${
                    orderStep >= 1 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full  ${
                      orderStep >= 1
                        ? "gradient-primary text-primary-foreground"
                        : "bg-secondary"
                    }`}
                  >
                    {orderStep > 1 ? <Check className="w-5 h-5"></Check> : "1"}
                  </div>
                  <span className="font-medium">Detalles </span>
                </div>
                <div
                  className={`h-0.5 w-12 ${
                    orderStep >= 2 ? "bg-primary" : "bg-border"
                  }`}
                ></div>
                <div
                  className={`flex items-center space-x-2 ${
                    orderStep >= 2 ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <div
                    className={`w-8 h-8 flex items-center justify-center rounded-full  ${
                      orderStep >= 2
                        ? "gradient-primary text-primary-foreground"
                        : "bg-secondary"
                    }`}
                  >
                    {orderStep > 2 ? <Check className="w-5 h-5"></Check> : "2"}
                  </div>
                  <span className="font-medium">Pago </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {orderStep === 1 ? (
                  <form onSubmit={handlePlaceOrder} className="glass-panel">
                    <h2 className="text-xl font-semibold text-foreground mb-6">
                      Información de envío
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                      <div className="md:col-span-6">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Nombres y apellidos*
                        </label>
                        <input
                          type="text"
                          value={shippingDetails.nombre_completo}
                          onChange={(e) =>
                            setShippingDetails({
                              ...shippingDetails,
                              nombre_completo: e.target.value,
                            })
                          }
                          required
                          className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none"
                        />
                      </div>
                      {

 }
                      <SelectorUbigeo
                        valor={shippingDetails}
                        onCambio={(ubigeo) =>
                          setShippingDetails((actual) => ({ ...actual, ...ubigeo }))
                        }
                      />
                      <div className="md:col-span-6">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Dirección
                        </label>
                        <input
                          type="text"
                          value={shippingDetails.direccion}
                          onChange={(e) =>
                            setShippingDetails({
                              ...shippingDetails,
                              direccion: e.target.value,
                            })
                          }
                          required
                          className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={shippingDetails.telefono}
                          onChange={(e) =>
                            setShippingDetails({
                              ...shippingDetails,
                              telefono: e.target.value,
                            })
                          }
                          required
                          className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Código postal
                        </label>
                        <input
                          type="text"
                          value={shippingDetails.codigo_postal}
                          onChange={(e) =>
                            setShippingDetails({
                              ...shippingDetails,
                              codigo_postal: e.target.value,
                            })
                          }
                          required
                          className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-6">
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Referencia
                        </label>
                        <input
                          type="text"
                          value={shippingDetails.referencia}
                          onChange={(e) =>
                            setShippingDetails({
                              ...shippingDetails,
                              referencia: e.target.value,
                            })
                          }
                          required
                          className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Cupón de descuento
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) =>
                            setCouponCode(e.target.value.toUpperCase())
                          }
                          disabled={Boolean(appliedCoupon)}
                          placeholder="Ej: BIENVENIDO10"
                          className="flex-1 px-4 py-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none uppercase"
                        />
                        {appliedCoupon ? (
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="px-4 py-3 bg-secondary rounded-lg"
                          >
                            Quitar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={validatingCoupon}
                            className="px-4 py-3 gradient-primary text-primary-foreground rounded-lg disabled:opacity-50"
                          >
                            {validatingCoupon ? "..." : "Aplicar"}
                          </button>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={placingOrder}
                      className="w-full gradient-primary text-primary-foreground font-bold py-3 rounded-lg hover:glow-on-hover animate-smooth font-semibold disabled:opacity-50"
                    >
                      {placingOrder ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Procesando...
                        </span>
                      ) : (
                        "Continuar al pago"
                      )}
                    </button>
                  </form>
                ) : (
                  <PaymentForm total={total} />
                )}
              </div>
              <div className="lg:col-span-1">
                <div className="glass-panel sticky top-24">
                  <h2 className="text-xl font-semibold text-foreground">
                    Resumen del pedido
                  </h2>
                  <div className="space-y-4 mt-6">
                    {cart.map((item) => (
                      <div
                        key={item.producto.id}
                        className="flex items-center space-x-3"
                      >
                        <img
                          src={
                            item.producto.imagenes?.[0]?.url ||
                            item.producto.imagenes?.[0] ||
                            "/placeholder.svg"
                          }
                          alt={item.producto.nombre}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {item.producto.nombre}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Cantidad: {item.cantidad}
                          </p>
                        </div>
                        <p className="text-sm font-semibold">
                          S/ {formatearSoles(precioLinea(item) * item.cantidad)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2 border-t border-[hsla(var(--glass-border))] pt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>S/{subtotal.toFixed(2)}</span>
                    </div>
                    {ahorro > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Ahorro por promoción</span>
                        <span>-S/{ahorro.toFixed(2)}</span>
                      </div>
                    )}
                    {descuento > 0 && (
                      <div className="flex justify-between text-green-500">
                        <span>
                          Descuento
                          {appliedCoupon ? ` (${appliedCoupon.codigo})` : ""}
                        </span>
                        <span>-S/{descuento.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Envio</span>
                      <span className="text-green-500">
                        {precioEnvio === 0
                          ? `Gratis (≥ S/${umbralGratis})`
                          : `S/${precioEnvio.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        IGV (18% incluido)
                      </span>
                      <span>S/{igv.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between font-semibold text-lg pt-2 border-t border-[hsla(var(--glass-border))]">
                      <span>Total</span>
                      <span className="text-primary">S/{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Payment;
