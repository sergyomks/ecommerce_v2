import { useEffect, useState } from "react";
import { Filter, Package, Truck, CheckCircle, XCircle, Clock, CreditCard } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { fetchMyOrders } from "../store/slices/orderSlice";

const Orders = () => {
  const [statusFilter, setStatusFilter] = useState("Todos");
  const { myOrders } = useSelector((state) => state.order);
  const { authUser } = useSelector((state) => state.auth);
  const navigateTo = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (!authUser) {
      navigateTo("/products");
    }
  }, [authUser, navigateTo]);

  useEffect(() => {
    if (!authUser) return;
    dispatch(fetchMyOrders());
    const interval = setInterval(() => {
      dispatch(fetchMyOrders());
    }, 5000);
    return () => clearInterval(interval);
  }, [dispatch, authUser]);
  const filterOrders = myOrders.filter(
    (pedido) => statusFilter === 'Todos' || pedido.estado_pedido === statusFilter
  );
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Procesando':
        return <Package className="w-5 h-5 text-yellow-500" />;
      case 'Enviado':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'Entregado':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'Cancelado':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Package className="w-5 h-5 text-yellow-500" />;
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'Procesando':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'Enviado':
        return 'bg-blue-500/20 text-blue-400';
      case 'Entregado':
        return 'bg-green-500/20 text-green-400';
      case 'Cancelado':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };
  const statusArray = ["Todos", "Procesando", "Enviado", "Entregado", "Cancelado"];

  if (!authUser) return null;

  return <>
    <div className="min-h-screen">
      <div className="store-wrap py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Mis Pedidos</h1>
          <p className="text-muted-foreground">Aquí puedes ver y gestionar todos tus pedidos</p>
        </div>
        <div className="glass-card p-4 mb-8">
          <div className="flex items-center space-x-4 flex-wrap">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-primary" />
              <span className="text-medium">Filtrar por estado</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {statusArray.map((status) => {
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${statusFilter === status ? 'gradient-primary text-primary-foreground' : 'glass-card text-foreground hover:glow-on-hover'}`}
                  >
                    {status}
                  </button>
                )
              })

              }
            </div>
          </div>
        </div>
        {
          filterOrders.length === 0 ? (
            <div className="text-center glass-panel max-w-md mx-auto">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4">

              </Package>
              <h2 className="text-xl font-semibold text-foreground mb-2">No tienes pedidos</h2>
              <p className="text-muted-foreground">
                {statusFilter === 'Todos' ?
                  "No has realizado ningun pedido"
                  :
                  `No tienes pedidos ${statusFilter}`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filterOrders.map((order) => {
                return (
                  <div key={order.id} className="glass-card p-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">Pedido #{order.id.substring(0, 8)}</h3>
                        <p className="text-muted-foreground">Colocado en {new Date(order.fecha_creado).toLocaleDateString('es-ES')}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {
                            getStatusIcon(order.estado_pedido)
                          }
                          <span className={`px-3 py-1 rounded text-sm font-medium capitalize ${getStatusColor(order.estado_pedido)}`}>{order.estado_pedido}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {order.fecha_pagado ? (
                            <span className="flex items-center gap-1 px-3 py-1 rounded text-sm font-medium bg-green-500/20 text-green-400">
                              <CreditCard className="w-3.5 h-3.5" />
                              Pagado
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-3 py-1 rounded text-sm font-medium bg-orange-500/20 text-orange-400">
                              <Clock className="w-3.5 h-3.5" />
                              Pendiente de pago
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground text-sm">Total</p>
                          <p className="text-xl font-bold text-primary">S/.{parseFloat(order.precio_total).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-4">
                      {
                        order?.detalles_pedido && Array.isArray(order.detalles_pedido) && order.detalles_pedido.map((item) => {
                          if (!item || !item.id) return null;
                          return (
                            <div key={item.id}
                              className="flex items-center space-x-4 bg-secondary/50 p-4 rounded-lg"
                            >

                              <img src={item.imagen} alt={item.titulo}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground truncate">{item.titulo}</h4>
                                <p className="text-sm text-muted-foreground">Cantidad: {item.cantidad}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-foreground">S/.{parseFloat(item.precio).toFixed(2)}</p>
                              </div>
                            </div>
                          )
                        })
                      }
                    </div>
                    <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-[hsla(var(--glass-border))]">
                      {order.estado_pedido === "Entregado" && (
                        <>
                          <button className="px-4 py-2 glass-card hover:glow-on-hover animate-smooth text-sm">
                            Escribir reseña
                          </button>
                        </>
                      )}
                    </div>

                  </div>
                )
              })}
            </div>
          )
        }
      </div>
    </div>
  </>;
};

export default Orders;
