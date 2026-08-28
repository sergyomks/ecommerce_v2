import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { v2 as cloudinary } from "cloudinary";
import pool from "../database/db.js";
import crypto from "crypto";
import { esUuid } from "../utils/validaciones.js";
import {
  construirReporteVentas,
  nombreArchivoVentas,
} from "../utils/reporteVentasExcel.js";

export const obtenerTodoUsuarios = catchAsyncErrors(async (req, res, next) => {

    let pagina = parseInt(req.query.page || req.query.pagina) || 1;

    if (pagina < 1) {
        pagina = 1;
    }

    const ITEMS_POR_PAGINA = 10;
    const PAGINA_MAXIMA = 1000;

    if (pagina > PAGINA_MAXIMA) {
        return next(new ErrorHandler(`La página máxima permitida es ${PAGINA_MAXIMA}`, 400));
    }

    const [totalRes] = await pool.query(
        `CALL sp_contar_usuarios_por_rol(?)`,
        ["Usuario"]
    );
    const totalUsuariosResultado = totalRes[0] || [];

    const totalUsuarios = parseInt(totalUsuariosResultado[0]?.total_usuarios) || 0;

    const offset = (pagina - 1) * ITEMS_POR_PAGINA;

    const totalPaginas = Math.ceil(totalUsuarios / ITEMS_POR_PAGINA) || 1;
    if (pagina > totalPaginas && totalUsuarios > 0) {
        return res.status(200).json({
            success: true,
            message: "La página solicitada está fuera de rango",
            totalUsuarios: totalUsuarios,
            paginaActual: pagina,
            totalPaginas: totalPaginas,
            itemsPorPagina: ITEMS_POR_PAGINA,
            usuarios: [],
        });
    }

    const [listRes] = await pool.query(
        `CALL sp_listar_usuarios_paginado(?, ?, ?)`,
        ["Usuario", ITEMS_POR_PAGINA, offset]
    );
    const usuarios = listRes[0] || [];

    res.status(200).json({
        success: true,
        message: "Usuarios obtenidos exitosamente",
        totalUsuarios: totalUsuarios,
        totalPaginas: totalPaginas,
        paginaActual: pagina,
        itemsPorPagina: ITEMS_POR_PAGINA,
        usuarios: usuarios || [],
    });
});

export const eliminarUsuario = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    if (!esUuid(id)) {
        return next(new ErrorHandler("ID de usuario inválido", 400));
    }

    if (req.user?.id === id) {
        return next(new ErrorHandler("No puedes eliminar tu propia cuenta", 403));
    }

    const [userRes] = await pool.query(
        `CALL sp_obtener_usuario_por_id(?)`,
        [id]
    );
    const usuarioExistente = userRes[0] || [];

    if (!usuarioExistente || usuarioExistente.length === 0) {
        return next(new ErrorHandler("Usuario no encontrado", 404));
    }

    const { rol, imagen } = usuarioExistente[0];

    if (rol === "Admin") {
        return next(
            new ErrorHandler(
                "No se puede eliminar a otro administrador desde el panel.",
                403
            )
        );
    }

    const [resProductos] = await pool.query(`CALL sp_contar_productos_por_creador(?)`, [id]);
    const productos = resProductos[0] || [];
    if (Number(productos[0].total) > 0) {
        return next(
            new ErrorHandler(
                `No se puede eliminar: este usuario creó ${productos[0].total} producto(s) y se borrarían con él. Reasigna o elimina esos productos primero.`,
                409
            )
        );
    }

    const [resPedidos] = await pool.query(`CALL sp_contar_pedidos_pagados_por_usuario(?)`, [id]);
    const pedidos = resPedidos[0] || [];
    if (Number(pedidos[0].total) > 0) {
        return next(
            new ErrorHandler(
                `No se puede eliminar: este usuario tiene ${pedidos[0].total} pedido(s) pagado(s) y se perdería el historial de ventas.`,
                409
            )
        );
    }

    await pool.query(
        "CALL sp_eliminar_usuario(?)",
        [id]
    );

    if (resultado.affectedRows === 0) {
        return next(new ErrorHandler("No se pudo eliminar el usuario", 500));
    }

    if (imagen?.public_id) {
        try {
            await cloudinary.uploader.destroy(imagen.public_id);
        } catch (error) {
            console.error("Error al eliminar imagen de Cloudinary:", error);
        }
    }

    res.status(200).json({
        success: true,
        message: "Usuario eliminado exitosamente",
    });
});

const fechaLocal = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
    ).padStart(2, "0")}`;

export const dashboardPanel = catchAsyncErrors(async (req, res, next) => {
    const hoy = new Date();
    const fechaHoy = fechaLocal(hoy);
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);
    const ayerFecha = fechaLocal(ayer);

    const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesSiguiente = new Date(
        hoy.getFullYear(),
        hoy.getMonth() + 1,
        1
    );

    const inicioMesAnterior = new Date(
        hoy.getFullYear(),
        hoy.getMonth() - 1,
        1
    );

    const [spResults] = await pool.query(
        `CALL sp_dashboard_panel(?, ?, ?, ?, ?)`,
        [fechaHoy, ayerFecha, inicioMesActual, inicioMesSiguiente, inicioMesAnterior]
    );

    const ingresoTotalQuery = spResults[0] || [];
    const totalNumeroUsuarioQuery = spResults[1] || [];
    const conteoEstadoPedidoQuery = spResults[2] || [];
    const ingresoHoyQuery = spResults[3] || [];
    const ingresoAyerQuery = spResults[4] || [];
    const ventasMensualesQuery = spResults[5] || [];
    const productoMasVendidoQuery = spResults[6] || [];
    const ventaMesActualQuery = spResults[7] || [];
    const bajoStockProductosQuery = spResults[8] || [];
    const ingresoMesPasadoQuery = spResults[9] || [];
    const nuevoUsuarioMesQuery = spResults[10] || [];

    const ingresoTotalesDate = parseFloat(ingresoTotalQuery[0]?.total_ingreso) || 0;
    const numeroTotalUsuario = parseInt(totalNumeroUsuarioQuery[0]?.total_usuarios) || 0;

    const contarEstadoPedido = {
        'Procesando': 0,
        'Enviado': 0,
        'Entregado': 0,
        'Cancelado': 0
    };

    if (conteoEstadoPedidoQuery && Array.isArray(conteoEstadoPedidoQuery)) {
        conteoEstadoPedidoQuery.forEach((row) => {
            if (row.estado_pedido && contarEstadoPedido.hasOwnProperty(row.estado_pedido)) {
                contarEstadoPedido[row.estado_pedido] = parseInt(row.cantidad) || 0;
            }
        });
    }

    const hoyIngresos = parseFloat(ingresoHoyQuery[0]?.ingreso_hoy) || 0;
    const ayerIngresos = parseFloat(ingresoAyerQuery[0]?.ingreso_ayer) || 0;

    const ventasMensuales = (ventasMensualesQuery || []).map((row) => ({
        mes: row.month,
        totalVentas: parseFloat(row.totalventas) || 0,
    }));

    const topVentaProductos = productoMasVendidoQuery || [];
    const VentasMesActual = parseFloat(ventaMesActualQuery[0]?.total) || 0;
    const bajoStockProductos = bajoStockProductosQuery || [];
    const ingresoMesPasado = parseFloat(ingresoMesPasadoQuery[0]?.total) || 0;

    let ingresosCrecimiento = "0%";

    if (ingresoMesPasado > 0) {
        const growthRate = ((VentasMesActual - ingresoMesPasado) / ingresoMesPasado) * 100;
        ingresosCrecimiento = `${growthRate >= 0 ? "+" : ""}${growthRate.toFixed(2)}%`;
    }

    const nuevoUsuarioMes = parseInt(nuevoUsuarioMesQuery[0]?.total_nuevos) || 0;

    res.status(200).json({
        success: true,
        message: "Estadísticas del panel de control obtenidas correctamente.",
        totalRevenueAllTime: ingresoTotalesDate,
        totalUsersCount: numeroTotalUsuario,
        orderStatusCounts: {
            Processing: contarEstadoPedido['Procesando'] || 0,
            Shipped: contarEstadoPedido['Enviado'] || 0,
            Delivered: contarEstadoPedido['Entregado'] || 0,
            Cancelled: contarEstadoPedido['Cancelado'] || 0
        },
        todayRevenue: hoyIngresos,
        yesterdayRevenue: ayerIngresos,
        monthlySales: (ventasMensualesQuery || []).map((row) => {

            let monthStr = row.month;
            if (row.date) {
                const parts = row.date.split('-');
                if (parts.length === 3) {
                    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
                    monthStr = dateObj.toLocaleString("en-US", { month: "short", year: "numeric" });
                }
            }
            return {
                month: monthStr,
                totalSales: parseFloat(row.totalventas) || 0,
            };
        }),
        topSellingProducts: (productoMasVendidoQuery || []).map((row) => {
            let firstImageUrl = "";
            if (row.imagen) {
                try {
                    const imgs = typeof row.imagen === "string" ? JSON.parse(row.imagen) : row.imagen;
                    firstImageUrl = imgs?.[0]?.url || "";
                } catch (err) {
                    firstImageUrl = "";
                }
            }
            return {
                id: row.id,
                nombre: row.nombre,
                imagen: firstImageUrl,
                categoria: row.categoria,
                calificacion: row.calificaciones,
                total_ventas: parseInt(row.total_vendido) || 0,
            };
        }),
        lowStockProducts: bajoStockProductos,
        revenueGrowth: ingresosCrecimiento,
        newUsersThisMonth: nuevoUsuarioMes,
        currentMonthSales: VentasMesActual,
    });
});

export const reporteVentasExcel = catchAsyncErrors(async (req, res, next) => {
    const { desde, hasta } = req.query;

    const comoFecha = (valor, etiqueta) => {
        if (!valor) return null;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) {
            throw new ErrorHandler(`La fecha "${etiqueta}" debe tener formato AAAA-MM-DD.`, 400);
        }
        const d = new Date(`${valor}T00:00:00`);
        if (Number.isNaN(d.getTime())) {
            throw new ErrorHandler(`La fecha "${etiqueta}" no es válida.`, 400);
        }
        return valor;
    };

    let desdeOk;
    let hastaOk;
    try {
        desdeOk = comoFecha(desde, "desde");
        hastaOk = comoFecha(hasta, "hasta");
    } catch (error) {
        return next(error);
    }

    if (desdeOk && hastaOk && desdeOk > hastaOk) {
        return next(new ErrorHandler("La fecha inicial no puede ser posterior a la final.", 400));
    }

    const [resultado] = await pool.query(`CALL sp_reporte_ventas(?, ?)`, [
        desdeOk,
        hastaOk,
    ]);
    const filas = resultado[0] || [];

    const buffer = await construirReporteVentas({
        filas,
        desde: desdeOk,
        hasta: hastaOk,
        nombreTienda: process.env.STORE_NAME || "Tienda",
    });

    res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="${nombreArchivoVentas(desdeOk, hastaOk)}"`
    );

    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
    res.setHeader("Content-Length", buffer.byteLength);

    res.status(200).end(Buffer.from(buffer));
});
