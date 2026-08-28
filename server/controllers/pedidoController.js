import crypto from "crypto";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import pool from "../database/db.js";
import { escrito } from "../database/procedimientos/_contrato.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateOrderStatusEmailTemplate } from "../utils/generateOrderStatusEmailTemplate.js";
import { generateOrderPlacedEmailTemplate } from "../utils/generateOrderPlacedEmailTemplate.js";
import {
  validarCuponParaCompra,
  validarCuponPorId,
} from "./cuponController.js";
import { calcularPrecioEnvio } from "../utils/calcularEnvio.js";
import { extraerIgv } from "../utils/igv.js";
import {
  reservarStockPedido,
  liberarReservaPedido,
} from "../utils/stockPedido.js";
import {
  esUuid,
  esNombrePersona,
  esTelefono,
  esCodigoPostal,
  esTextoConLongitud,
  normalizarTelefono,
  primerError,
} from "../utils/validaciones.js";

export const nuevoPedido = catchAsyncErrors(async (req, res, next) => {

    if (!req.usuario || !req.usuario.id) {
        return next(new ErrorHandler("Usuario no autenticado.", 401));
    }

    const {
        nombre_completo,
        departamento,
        provincia,
        distrito,
        direccion,
        referencia,
        codigo_postal,
        telefono,
        pedidoItems,
        codigo_cupon,
        id_cupon,
    } = req.body;

    if (
        !nombre_completo ||
        !departamento ||
        !provincia ||
        !distrito ||
        !direccion ||
        !referencia ||
        !codigo_postal ||
        !telefono
    ) {
        return next(
            new ErrorHandler("Por favor, proporcione todos los detalles de envío.", 400)
        );
    }

    const envio = {
        nombre_completo: String(nombre_completo).trim(),
        departamento: String(departamento).trim(),
        provincia: String(provincia).trim(),
        distrito: String(distrito).trim(),
        direccion: String(direccion).trim(),
        referencia: String(referencia).trim(),
        codigo_postal: String(codigo_postal).trim(),
        telefono: String(telefono).trim(),
    };

    const errorEnvio = primerError([
        [
            envio.nombre_completo,
            (v) => esNombrePersona(v, { min: 3, max: 100 }),
            "El nombre completo solo puede contener letras y debe tener entre 3 y 100 caracteres.",
        ],
        [
            envio.telefono,
            esTelefono,
            "El teléfono debe ser un número peruano válido: 9 dígitos para móvil o 7-8 para fijo.",
        ],
        [
            envio.codigo_postal,
            esCodigoPostal,
            "El código postal debe tener exactamente 5 dígitos.",
        ],
        [
            envio.direccion,
            (v) => esTextoConLongitud(v, { min: 5, max: 255 }),
            "La dirección debe tener entre 5 y 255 caracteres.",
        ],
        [
            envio.referencia,
            (v) => esTextoConLongitud(v, { min: 3, max: 255 }),
            "La referencia debe tener entre 3 y 255 caracteres.",
        ],
        [
            envio.departamento,
            (v) => esTextoConLongitud(v, { min: 2, max: 100 }),
            "El departamento no es válido.",
        ],
        [
            envio.provincia,
            (v) => esTextoConLongitud(v, { min: 2, max: 100 }),
            "La provincia no es válida.",
        ],
        [
            envio.distrito,
            (v) => esTextoConLongitud(v, { min: 2, max: 100 }),
            "El distrito no es válido.",
        ],
    ]);

    if (errorEnvio) {
        return next(new ErrorHandler(errorEnvio, 400));
    }

    envio.telefono = normalizarTelefono(envio.telefono);

    let articulos;
    try {
        articulos = Array.isArray(pedidoItems)
            ? pedidoItems
            : JSON.parse(pedidoItems || "[]");
    } catch (err) {
        return next(new ErrorHandler("Formato de artículos inválido.", 400));
    }

    if (!articulos || articulos.length === 0) {
        return next(new ErrorHandler("No hay artículos en el carrito.", 400));
    }

    if (articulos.some((articulo) => !articulo?.producto?.id)) {
        return next(
            new ErrorHandler("Hay artículos inválidos en el carrito.", 400)
        );
    }

    const idVarianteDe = (articulo) =>
        articulo?.variante?.id || articulo?.id_variante || null;

    if (articulos.some((articulo) => !esUuid(idVarianteDe(articulo) || ""))) {
        return next(
            new ErrorHandler(
                "Elige talla y color de cada prenda antes de continuar.",
                400
            )
        );
    }

    const MAX_LINEAS_CARRITO = 50;
    if (articulos.length > MAX_LINEAS_CARRITO) {
        return next(
            new ErrorHandler(
                `El carrito no puede tener más de ${MAX_LINEAS_CARRITO} líneas.`,
                400
            )
        );
    }

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const varianteIds = articulos.map(idVarianteDe);

        const [resVariantes] = await connection.query(
            `CALL sp_bloquear_variantes_pedido(?)`,
            [JSON.stringify(varianteIds)]
        );
        const variantes = resVariantes[0] || [];

        if (variantes.length === 0) {
            await connection.rollback();
            return next(new ErrorHandler("No se encontraron los productos del carrito.", 404));
        }

        let precio_total = 0;
        const detallesPedido = [];

        for (const articulo of articulos) {

            const cantidad = Number(articulo.cantidad);
            if (!Number.isInteger(cantidad) || cantidad <= 0) {
                await connection.rollback();
                return next(
                    new ErrorHandler("Cantidad inválida para producto.", 400)
                );
            }

            const variante = variantes.find((v) => v.id_variante === idVarianteDe(articulo));
            if (!variante) {
                await connection.rollback();
                return next(
                    new ErrorHandler(
                        `"${articulo.producto.nombre || articulo.producto.id}" ya no está disponible. Quítalo del carrito.`,
                        404
                    )
                );
            }

            const descripcion = [variante.nombre, variante.talla, variante.color]
                .filter(Boolean)
                .join(" · ");

            if (cantidad > variante.stock_variante) {
                await connection.rollback();
                return next(
                    new ErrorHandler(
                        variante.stock_variante === 0
                            ? `${descripcion} se agotó mientras comprabas.`
                            : variante.stock_variante === 1
                              ? `Solo queda 1 unidad de ${descripcion}.`
                              : `Solo quedan ${variante.stock_variante} unidades de ${descripcion}.`,
                        400
                    )
                );
            }

            const precio = Number(variante.precio_efectivo ?? variante.precio);
            if (!Number.isFinite(precio) || precio < 0) {
                await connection.rollback();
                return next(
                    new ErrorHandler("Precio de producto inválido.", 400)
                );
            }

            const itemTotal = precio * cantidad;
            precio_total += itemTotal;

            let imagen = "";
            if (variante.imagenes) {
                try {
                    const imagenes = typeof variante.imagenes === "string"
                        ? JSON.parse(variante.imagenes)
                        : variante.imagenes;
                    imagen = imagenes?.[0]?.url || "";
                } catch (err) {
                    imagen = "";
                }
            }

            detallesPedido.push({
                id_producto: variante.id_producto,
                id_variante: variante.id_variante,
                talla: variante.talla,
                color: variante.color,
                cantidad,
                precio,
                imagen,
                titulo: variante.nombre,
            });
        }

        let descuento = 0;
        let idCuponUsado = null;
        let codigoCuponUsado = null;

        if (id_cupon || codigo_cupon) {
            const cuponResult =
                id_cupon && esUuid(id_cupon)
                    ? await validarCuponPorId(id_cupon, precio_total, connection)
                    : await validarCuponParaCompra(
                        codigo_cupon,
                        precio_total,
                        connection
                    );
            if (!cuponResult.ok) {
                await connection.rollback();
                return next(new ErrorHandler(cuponResult.message, 400));
            }
            descuento = cuponResult.descuento;
            idCuponUsado = cuponResult.cupon.id;
            codigoCuponUsado = cuponResult.cupon.codigo;

            await connection.query(`CALL sp_incrementar_uso_cupon(?)`, [idCuponUsado]);
        }

        const brutoTrasDescuento = Math.max(precio_total - descuento, 0);
        const { impuesto: monto_impuesto } = extraerIgv(brutoTrasDescuento);
        const envioCalc = await calcularPrecioEnvio(
            { departamento: envio.departamento, subtotal: brutoTrasDescuento },
            connection
        );
        const precio_envio = envioCalc.precio;
        const precio_total_final =
            Math.round((brutoTrasDescuento + precio_envio) * 100) / 100;

        try {
            await reservarStockPedido(connection, detallesPedido);
        } catch (stockErr) {
            await connection.rollback();
            return next(new ErrorHandler(stockErr.message, 400));
        }

        const pedidoId = crypto.randomUUID();
        const [pedidoResult] = await connection.query(
            `CALL sp_crear_pedido(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                pedidoId,
                req.usuario.id,
                precio_total_final,
                monto_impuesto,
                precio_envio,
                descuento,
                idCuponUsado,
                1,
                "Procesando"
            ]
        );

        if (escrito(pedidoResult) === 0) {
            await connection.rollback();
            return next(new ErrorHandler("Error al crear el pedido.", 500));
        }

        if (detallesPedido.length > 0) {
            for (const detalle of detallesPedido) {
                const id_detalle = crypto.randomUUID();
                await connection.query(
                    `CALL sp_crear_detalle_pedido(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        id_detalle,
                        pedidoId,
                        detalle.id_producto,
                        detalle.titulo,
                        detalle.precio,
                        detalle.cantidad,
                        JSON.stringify(detalle.imagen),
                        detalle.id_variante,
                        detalle.talla,
                        detalle.color,
                    ]
                );
            }
        }

        let idDistritoFinal = Number(req.body.id_distrito) || null;

        if (idDistritoFinal) {
          const [resValido] = await connection.query(
            `CALL sp_obtener_distrito_por_id(?)`,
            [idDistritoFinal]
          );
          if (!resValido[0]?.length) idDistritoFinal = null;
        }

        if (!idDistritoFinal && distrito) {
          const [distRows] = await connection.query(
            `CALL sp_obtener_distrito_por_nombres(?, ?, ?)`,
            [envio.distrito, envio.provincia, envio.departamento]
          );

          if (distRows[0]?.length === 1) idDistritoFinal = distRows[0][0].id;
        }

        if (!idDistritoFinal) {

          await connection.rollback();
          return next(
            new ErrorHandler(
              `No reconocemos "${envio.distrito}, ${envio.provincia}, ${envio.departamento}". ` +
                `Elige el distrito de la lista para que podamos enviarte el pedido.`,
              400
            )
          );
        }

        const envioId = crypto.randomUUID();
        const [envioResult] = await connection.query(
            `CALL sp_crear_informacion_envio(?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                envioId,
                pedidoId,
                idDistritoFinal,
                envio.nombre_completo,
                envio.direccion,
                envio.referencia,
                envio.codigo_postal,
                envio.telefono,
            ]
        );

        if (escrito(envioResult) === 0) {
            await connection.rollback();
            return next(new ErrorHandler("Error al guardar información de envío.", 500));
        }

        await connection.commit();

        try {
            const [resUsuario] = await pool.query(
                `CALL sp_obtener_usuario_email_nombre(?)`,
                [req.usuario.id]
            );
            const usuario = resUsuario[0]?.[0];
            if (usuario?.email) {
                await sendEmail({
                    email: usuario.email,
                    subject: `Recibimos tu pedido #${pedidoId.slice(0, 8)}`,
                    message: generateOrderPlacedEmailTemplate({
                        nombreUsuario: usuario.nombre,
                        pedidoId,
                        items: detallesPedido,
                        precioTotal: precio_total_final,
                        minutosExpiracion:
                            Number(process.env.PEDIDO_EXPIRA_MINUTOS) || 30,
                        ordersUrl: process.env.FRONTEND_URL
                            ? `${process.env.FRONTEND_URL}/orders`
                            : undefined,
                    }),
                });
            }
        } catch (error) {
            console.error(
                `Pedido ${pedidoId} creado pero falló el correo de aviso:`,
                error?.message || error
            );
        }

        res.status(200).json({
            success: true,
            message: "Pedido realizado correctamente. Proceda al pago.",
            pedidoId,
            precio_total: precio_total_final,
            descuento,
            id_cupon: idCuponUsado,
            codigo_cupon: codigoCuponUsado,
        });
    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackErr) {
                console.error("Error al hacer rollback:", rollbackErr.message);
            }
        }

        console.error("Error en nuevoPedido:", err.message);
        return next(
            new ErrorHandler(err.message || "Error al procesar el pedido.", 500)
        );
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

export const obtenerPedidoUnico = catchAsyncErrors(async (req, res, next) => {
    const { pedidoId } = req.params;

    if (!req.usuario || !req.usuario.id) {
        return next(new ErrorHandler("Usuario no autenticado.", 401));
    }

    if (!esUuid(pedidoId)) {
        return next(new ErrorHandler("ID de pedido inválido.", 400));
    }

    const [resPedidos] = await pool.query(`CALL sp_obtener_pedido_completo_usuario(?, ?)`, [pedidoId, req.usuario.id]);
    const pedidos = resPedidos[0] || [];

    if (!pedidos || pedidos.length === 0) {
        return next(new ErrorHandler("Pedido no encontrado o no tiene permisos para verlo.", 404));
    }

    res.status(200).json({
        success: true,
        message: "Pedido recuperado correctamente.",
        pedido: pedidos[0]
    });
});

export const obtenerMisPedidos = catchAsyncErrors(async (req, res, next) => {
    if (!req.usuario || !req.usuario.id) {
        return next(new ErrorHandler("Usuario no autenticado.", 401));
    }

    const [resPedidos] = await pool.query(`CALL sp_listar_mis_pedidos_completos(?)`, [req.usuario.id]);
    const pedidos = resPedidos[0] || [];

    res.status(200).json({
        success: true,
        message: "Pedidos recuperados con éxito.",
        pedidos,
    });
});

const PEDIDOS_POR_PAGINA = 20;
const ESTADOS_PEDIDO = ["Procesando", "Enviado", "Entregado", "Cancelado"];

export const obtenerTodosPedidos = catchAsyncErrors(async (req, res, next) => {
    const pagina = Math.max(parseInt(req.query.page || req.query.pagina, 10) || 1, 1);
    const offset = (pagina - 1) * PEDIDOS_POR_PAGINA;

    const estado = ESTADOS_PEDIDO.includes(req.query.estado) ? req.query.estado : null;
    const [resResumen] = await pool.query(`CALL sp_resumen_pedidos_admin()`);
    const resumen = resResumen[0]?.[0] || { monto_total: 0, requieren_revision: 0 };

    const [resConteo] = await pool.query(`CALL sp_contar_pedidos_filtro(?)`, [estado]);
    const conteo = resConteo[0]?.[0] || { total: 0 };

    const totalPedidos = Number(conteo.total) || 0;
    const totalPaginas = Math.max(Math.ceil(totalPedidos / PEDIDOS_POR_PAGINA), 1);

    const [resPedidos] = await pool.query(`CALL sp_listar_todos_pedidos_admin(?, ?, ?)`, [estado, PEDIDOS_POR_PAGINA, offset]);
    const pedidos = resPedidos[0] || [];

    res.status(200).json({
        success: true,
        message: "Lista de todos los pedidos recuperada.",
        montoTotalVentas: Number(resumen.monto_total).toFixed(2),
        totalPedidos,
        totalPaginas,
        paginaActual: pagina,
        itemsPorPagina: PEDIDOS_POR_PAGINA,
        requierenRevision: Number(resumen.requieren_revision) || 0,
        pedidos: pedidos.map((pedido) => ({
            ...pedido,
            intentos_pago: Number(pedido.intentos_pago) || 0,
            requiere_revision: Boolean(
                pedido.fecha_pagado && pedido.estado_pedido === "Cancelado"
            ),
        })),
    });
});

export const actualizarEstadoPedido = catchAsyncErrors(async (req, res, next) => {
    const { status } = req.body;
    const { pedidoId } = req.params;

    if (!req.usuario || req.usuario.rol !== 'Admin') {
        return next(new ErrorHandler("Acceso denegado. Solo administradores pueden actualizar el estado de un pedido.", 403));
    }

    if (!status) {
        return next(new ErrorHandler("Por favor, proporcione un estado válido para el pedido.", 400));
    }

    if (!esUuid(pedidoId)) {
        return next(new ErrorHandler("ID de pedido inválido.", 400));
    }

    const estadosPermitidos = ['Procesando', 'Enviado', 'Entregado', 'Cancelado'];
    if (!estadosPermitidos.includes(status)) {
        return next(new ErrorHandler(`Estado inválido. Los estados permitidos son: ${estadosPermitidos.join(', ')}.`, 400));
    }

    const [resExisting] = await pool.query(`CALL sp_obtener_pedido_estado(?)`, [pedidoId]);
    const existingOrders = resExisting[0] || [];

    if (existingOrders.length === 0) {
        return next(new ErrorHandler("Pedido no encontrado.", 404));
    }

    const currentOrder = existingOrders[0];
    const estadoAnterior = currentOrder.estado_pedido;

    if (status === "Cancelado" && estadoAnterior !== "Cancelado") {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await liberarReservaPedido(pedidoId, connection);
            await connection.commit();
        } catch (err) {
            await connection.rollback();
            return next(
                new ErrorHandler(
                    err.message || "No se pudo liberar el stock al cancelar.",
                    500
                )
            );
        } finally {
            connection.release();
        }
    }

    const setEntregado = (status === 'Entregado' && !currentOrder.fecha_entregado) ? 1 : 0;

    await pool.query(`CALL sp_actualizar_estado_pedido_completo(?, ?, ?)`, [pedidoId, status, setEntregado]);

    const [resUpdated] = await pool.query(`CALL sp_obtener_pedido_actualizado(?)`, [pedidoId]);
    const updatedOrders = resUpdated[0] || [];

    const estadosNotificables = ["Enviado", "Entregado", "Cancelado"];
    if (
        estadoAnterior !== status &&
        estadosNotificables.includes(status)
    ) {
        try {
            const [resUsuario] = await pool.query(`CALL sp_obtener_usuario_email_nombre(?)`, [currentOrder.id_comprador]);
            const usuarioRows = resUsuario[0] || [];
            const usuario = usuarioRows[0];

            if (usuario?.email) {
                const ordersUrl = process.env.FRONTEND_URL
                    ? `${process.env.FRONTEND_URL}/orders`
                    : undefined;

                await sendEmail({
                    email: usuario.email,
                    subject: `Pedido #${pedidoId.slice(0, 8)} — ${status}`,
                    message: generateOrderStatusEmailTemplate({
                        nombreUsuario: usuario.nombre,
                        pedidoId,
                        estadoAnterior,
                        estadoNuevo: status,
                        ordersUrl,
                    }),
                });
            }
        } catch (emailError) {
            console.error(
                "Estado actualizado pero falló el email de notificación:",
                emailError?.message || emailError
            );
        }
    }

    res.status(200).json({
        success: true,
        message: "Estado del pedido actualizado correctamente.",
        updatedOrder: updatedOrders[0],
    });
});

export const eliminarPedido = catchAsyncErrors(async (req, res, next) => {
    const { pedidoId } = req.params;

    if (!req.usuario || req.usuario.rol !== 'Admin') {
        return next(new ErrorHandler("Acceso denegado. Solo administradores pueden eliminar pedidos.", 403));
    }

    if (!esUuid(pedidoId)) {
        return next(new ErrorHandler("ID de pedido inválido.", 400));
    }

    const [resExisting] = await pool.query(`CALL sp_obtener_pedido_para_eliminar(?)`, [pedidoId]);
    const existing = resExisting[0] || [];
    if (existing.length === 0) {
        return next(new ErrorHandler("Pedido no encontrado o ya eliminado.", 404));
    }

    if (existing[0].fecha_pagado) {
        return next(
            new ErrorHandler(
                "No se puede eliminar un pedido pagado porque se perdería su historial. Cámbialo a 'Cancelado' en su lugar.",
                409
            )
        );
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await liberarReservaPedido(pedidoId, connection);
        const [resEliminar] = await connection.query(`CALL sp_eliminar_pedido(?)`, [pedidoId]);
        if (Number(resEliminar[0]?.[0]?.affected ?? 0) === 0) {
            await connection.rollback();
            return next(new ErrorHandler("Pedido no encontrado o ya eliminado.", 404));
        }
        await connection.commit();
    } catch (err) {
        await connection.rollback();
        return next(
            new ErrorHandler(err.message || "Error al eliminar el pedido.", 500)
        );
    } finally {
        connection.release();
    }

    res.status(200).json({
        success: true,
        message: "Pedido eliminado correctamente.",
    });
});