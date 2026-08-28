import crypto from "crypto";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import pool from "../database/db.js";
import { generarCargoCulqi } from "../utils/generarIntencionPago.js";
import { verificarPayloadWebhookCulqi } from "../utils/verificarEventoCulqi.js";
import { conciliarCargoHuerfano } from "../utils/conciliarPago.js";
import { enviarConfirmacionPedido } from "../utils/enviarConfirmacionPedido.js";
import { construirAntifraude } from "../utils/antifraudeCulqi.js";

const MINUTOS_BLOQUEO_PAGO = 3;

const liberarBloqueoPago = (pedidoId) =>
    pool.query(`CALL sp_liberar_bloqueo_pago(?)`, [pedidoId]);

export const procesarWebhookCulqi = async (req, res) => {
    try {
        const verificado = await verificarPayloadWebhookCulqi(req);

        if (!verificado.ok) {
            console.warn("Webhook Culqi rechazado:", verificado.message);
            return res.status(verificado.status || 401).json({
                success: false,
                message: verificado.message || "Webhook no autorizado.",
            });
        }

        const { tipo, chargeId, eventId, cargo } = verificado;

        console.log("Evento Culqi verificado:", tipo, chargeId);

        const [resYaProcesado] = await pool.query(`CALL sp_verificar_webhook_procesado(?)`, [eventId]);
        const yaProcesado = resYaProcesado[0] || [];

        if (yaProcesado.length > 0) {
            return res.status(200).json({ received: true, duplicate: true });
        }

        if (tipo === "charge.creation.succeeded") {
            if (cargo?.amount == null) {
                return res.status(401).json({
                    success: false,
                    message: "Cargo Culqi incompleto.",
                });
            }

            const [resPago] = await pool.query(`CALL sp_obtener_pago_por_charge(?)`, [chargeId]);
            const pagoRows = resPago[0] || [];

            if (pagoRows.length > 0) {
                if (pagoRows[0].estado_pago !== "Pagado") {
                    await pool.query(`CALL sp_marcar_pago_pagado(?)`, [chargeId]);
                    await pool.query(`CALL sp_marcar_pedido_pagado(?)`, [pagoRows[0].id_pedido]);
                }
            } else {
                const conciliacion = await conciliarCargoHuerfano(cargo, chargeId);

                if (conciliacion?.pagoRegistrado) {
                    await enviarConfirmacionPedido(
                        conciliacion.pedidoId,
                        chargeId,
                        cargo.email
                    );
                }
            }
        } else if (tipo === "charge.failed") {
            const [resPago] = await pool.query(`CALL sp_obtener_pago_por_charge(?)`, [chargeId]);
            const pagoRows = resPago[0] || [];

            if (pagoRows.length > 0 && pagoRows[0].estado_pago !== "Pagado") {
                await pool.query(`CALL sp_marcar_pago_fallido(?)`, [chargeId]);
            }
        }

        try {
            await pool.query(`CALL sp_registrar_webhook(?, ?, ?, ?)`, [
                crypto.randomUUID(), eventId, tipo, chargeId
            ]);
        } catch (insertError) {

            if (insertError?.code === "ER_DUP_ENTRY") {
                return res.status(200).json({ received: true, duplicate: true });
            }
            throw insertError;
        }

        return res.status(200).json({ received: true });
    } catch (error) {
        console.error("Error en webhook Culqi:", error);
        return res.status(500).json({ success: false, message: "Error procesando webhook" });
    }
};

export const crearCargo = catchAsyncErrors(async (req, res, next) => {
    const {
        tokenId,
        email,
        pedidoId,
        deviceFingerPrintId,
        authentication3DS,
    } = req.body;

    if (!tokenId || !email || !pedidoId) {
        return next(
            new ErrorHandler(
                "Se requiere tokenId, email y pedidoId para procesar el pago.",
                400
            )
        );
    }

    const [resPedido] = await pool.query(`CALL sp_obtener_pedido_para_pago(?, ?)`, [pedidoId, req.usuario.id]);
    const pedidoRows = resPedido[0] || [];

    if (pedidoRows.length === 0) {
        return next(new ErrorHandler("Pedido no encontrado.", 404));
    }

    const pedido = pedidoRows[0];

    if (pedido.fecha_pagado) {
        return next(new ErrorHandler("Este pedido ya fue pagado.", 400));
    }

    if (pedido.estado_pedido === "Cancelado") {
        return next(
            new ErrorHandler(
                "Este pedido se canceló por falta de pago. Realiza uno nuevo.",
                400
            )
        );
    }

    const [reserva] = await pool.query(`CALL sp_iniciar_bloqueo_pago(?, ?)`, [pedidoId, MINUTOS_BLOQUEO_PAGO]);

    const affectedReserva = reserva?.affectedRows ?? reserva?.[0]?.affectedRows ?? 0;
    if (affectedReserva === 0) {
        return next(
            new ErrorHandler(
                "Ya hay un pago en curso para este pedido. Espera unos segundos.",
                409
            )
        );
    }

    const [resUsuario] = await pool.query(`CALL sp_obtener_usuario_nombre(?)`, [req.usuario.id]);
    const usuarioRows = resUsuario[0] || [];

    const [resEnvio] = await pool.query(`CALL sp_obtener_info_envio_pedido(?)`, [pedidoId]);
    const envioRows = resEnvio[0] || [];

    const antifraudDetails = construirAntifraude({
        envio: envioRows[0],
        nombreRespaldo: usuarioRows[0]?.nombre,
        deviceFingerPrintId,
    });

    const resultado = await generarCargoCulqi({
        orderId: pedidoId,
        totalPrice: parseFloat(pedido.precio_total),
        tokenId,
        email,
        antifraudDetails,
        authentication3DS,
    });

    if (resultado.indeterminado) {
        return next(
            new ErrorHandler(
                "No pudimos confirmar el resultado de tu pago. Si el cargo se realizó, " +
                    "tu pedido se activará en unos minutos y recibirás el correo de " +
                    "confirmación. No vuelvas a intentarlo todavía para evitar un doble cobro.",
                502
            )
        );
    }

    if (!resultado.success) {
        await liberarBloqueoPago(pedidoId);
        return next(
            new ErrorHandler(resultado.message || "Error al procesar el pago.", 402)
        );
    }

    await pool.query(`CALL sp_marcar_pedido_pagado(?)`, [pedidoId]);

    const [resDetalles] = await pool.query(`CALL sp_obtener_detalles_pedido(?)`, [pedidoId]);
    const detallesPedido = resDetalles[0] || [];

    if (!pedido.stock_reservado) {
        for (const item of detallesPedido) {
            if (!item.id_variante) {
                console.warn(
                    `Pedido ${pedidoId}: la línea "${item.titulo}" no tiene variante; ` +
                        `no se descontó stock. Ajusta el inventario a mano.`
                );
                continue;
            }
            try {
                await pool.query(`CALL sp_reservar_variante(?, ?)`, [
                    item.id_variante,
                    item.cantidad,
                ]);
            } catch (error) {

                console.error(
                    `Pedido ${pedidoId} pagado pero sin stock para "${item.titulo}": ` +
                        `${error.sqlMessage || error.message}. Requiere reposición o reembolso.`
                );
            }
        }
        await pool.query(`CALL sp_marcar_stock_reservado(?)`, [pedidoId]);
    }

    await enviarConfirmacionPedido(pedidoId, resultado.chargeId, email);

    res.status(200).json({
        success: true,
        message: "Pago procesado exitosamente.",
        chargeId: resultado.chargeId,
    });
});

export const obtenerLlaveCulqi = catchAsyncErrors(async (req, res, next) => {
    res.status(200).json({
        success: true,
        publicKey: process.env.CULQI_PUBLIC_KEY,
    });
});
