import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { v2 as cloudinary } from "cloudinary";
import pool from "../database/db.js";
import crypto from "crypto";
import { obtenerAIRecomendacion } from "../utils/obtenerAIRecomendacion.js";
import { comoLista, validarImagenes } from "../utils/imagenes.js";
import { esImporte, esEnteroNoNegativo, esUuid } from "../utils/validaciones.js";
import { TALLA_UNICA, COLOR_UNICO } from "../models/tablaVariante.js";

const pad2 = (n) => String(n).padStart(2, "0");

const formatMysqlDateTime = (input) => {
    if (input === null || input === undefined || input === "") return null;
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
};

const productoTienePedidos = async (productoId) => {
    const [resProd] = await pool.query(`CALL sp_verificar_pedidos_producto(?)`, [productoId]);
    return resProd[0] && resProd[0].length > 0;
};

const eliminarImagenesCloudinary = async (imagenes) => {
    for (const imagen of imagenes) {
        if (!imagen?.public_id) continue;
        try {
            await cloudinary.uploader.destroy(imagen.public_id);
        } catch (error) {
            console.error('Error al eliminar imagen de Cloudinary:', error);
        }
    }
};

export const crearProducto = catchAsyncErrors(async (req, res, next) => {
    const { nombre, descripcion, precio, categoria, stock, precio_oferta, oferta_inicio, oferta_fin } = req.body;
    const creado_por = req.user.id;

    if (!nombre || !descripcion || !precio || !categoria || stock === undefined || stock === null || stock === '') {
        return next(new ErrorHandler('Por favor, proporcione todos los detalles del producto.', 400));
    }

    if (!esImporte(precio)) {
        return next(new ErrorHandler('El precio debe ser un número con hasta dos decimales.', 400));
    }

    if (!esEnteroNoNegativo(stock, { max: 1000000 })) {
        return next(new ErrorHandler('El stock debe ser un número entero entre 0 y 1 000 000.', 400));
    }

    const precioNum = Number(String(precio).trim().replace(',', '.'));
    const stockNum = Number(String(stock).trim());

    if (String(nombre).trim().length > 255) {
        return next(new ErrorHandler('El nombre del producto no puede superar los 255 caracteres.', 400));
    }

    let precioOfertaNum = null;
    if (precio_oferta !== undefined && precio_oferta !== null && precio_oferta !== '') {
        if (!esImporte(precio_oferta)) {
            return next(new ErrorHandler('El precio de oferta debe ser un número válido.', 400));
        }
        precioOfertaNum = Number(String(precio_oferta).trim().replace(',', '.'));
        if (precioOfertaNum <= 0 || precioOfertaNum >= precioNum) {
            return next(new ErrorHandler('El precio de oferta debe ser mayor a 0 y menor que el precio normal.', 400));
        }
    }

    let ofertaInicioFmt = null;
    let ofertaFinFmt = null;
    if (precioOfertaNum !== null) {
        if (oferta_inicio) {
            ofertaInicioFmt = formatMysqlDateTime(oferta_inicio);
            if (ofertaInicioFmt === null) {
                return next(new ErrorHandler('La fecha de inicio de oferta no es válida.', 400));
            }
        }
        if (oferta_fin) {
            ofertaFinFmt = formatMysqlDateTime(oferta_fin);
            if (ofertaFinFmt === null) {
                return next(new ErrorHandler('La fecha de fin de oferta no es válida.', 400));
            }
        }
        if (ofertaInicioFmt && ofertaFinFmt && ofertaFinFmt < ofertaInicioFmt) {
            return next(new ErrorHandler('La fecha de fin debe ser posterior a la fecha de inicio.', 400));
        }
    }

    let idCategoria = null;
    let idSubcategoria = null;

    const [resCat] = await pool.query(`CALL sp_obtener_categoria_o_subcategoria(?)`, [categoria]);
    const subcatRows = resCat[0] || [];
    const catRows = resCat[1] || [];

    if (subcatRows.length > 0) {
        idSubcategoria = subcatRows[0].id;
        idCategoria = subcatRows[0].id_categoria_padre;
    } else if (catRows.length > 0) {
        idCategoria = catRows[0].id;
    } else {
        return next(new ErrorHandler("La categoría indicada no existe o está inactiva.", 400));
    }

    let uploaderImagenes = [];
    if (req.files && req.files.imagenes) {
        const imagenes = comoLista(req.files.imagenes);
        const errorImagen = validarImagenes(imagenes);
        if (errorImagen) {
            return next(new ErrorHandler(errorImagen, 400));
        }
        for (const imagen of imagenes) {
            const result = await cloudinary.uploader.upload(imagen.tempFilePath, {
                folder: "ecommerce_producto_imagenes",
                width: 1000,
                crop: "scale"
            });
            uploaderImagenes.push({
                url: result.secure_url,
                public_id: result.public_id
            });
        }
    }

    const id = crypto.randomUUID();
    const [resProd] = await pool.query(
        `CALL sp_crear_producto(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, nombre, descripcion, precioNum, idCategoria, idSubcategoria, stockNum, JSON.stringify(uploaderImagenes), creado_por, precioOfertaNum, ofertaInicioFmt, ofertaFinFmt]
    );

    const rows = resProd[0] || [];

    let variantesIniciales;
    try {
        const enviadas = req.body.variantes
            ? JSON.parse(req.body.variantes)
            : null;
        variantesIniciales = Array.isArray(enviadas) && enviadas.length > 0
            ? enviadas
            : null;
    } catch {
        variantesIniciales = null;
    }

    const paraGuardar = variantesIniciales
        ? variantesIniciales.map((v) => ({
              talla: String(v?.talla ?? "").trim() || TALLA_UNICA,
              color: String(v?.color ?? "").trim() || COLOR_UNICO,
              color_hex: String(v?.color_hex ?? "").trim() || null,
              sku: String(v?.sku ?? "").trim() || null,
              stock: esEnteroNoNegativo(v?.stock, { max: 1000000 })
                  ? Number(String(v.stock).trim())
                  : 0,
          }))

        : [{ talla: TALLA_UNICA, color: COLOR_UNICO, color_hex: null, sku: null, stock: stockNum }];

    await pool.query(`CALL sp_guardar_variantes(?, ?)`, [
        id,
        JSON.stringify(paraGuardar),
    ]);

    res.status(201).json({
        success: true,
        message: "Producto creado con éxito",
        producto: rows[0]
    });
});
export const buscarTodosProductos = catchAsyncErrors(async (req, res, next) => {
    const { disponibilidad, precio, categoria, calificaciones, buscar } = req.query;
    const pagina = parseInt(req.query.page || req.query.pagina) || 1;
    const limit = Math.min(Math.max(parseInt(req.query.limite || req.query.limit, 10) || 12, 1), 48);
    const offset = (pagina - 1) * limit;
    let p_min_precio = null;
    let p_max_precio = null;
    if (precio) {
        const [minPrecio, maxPrecio] = precio.split("-");
        if (minPrecio && maxPrecio) {
            p_min_precio = parseFloat(minPrecio);
            p_max_precio = parseFloat(maxPrecio);
        }
    }

    const [totalProductosRows] = await pool.query(
        `CALL sp_contar_buscar_productos(?, ?, ?, ?, ?, ?)`,
        [disponibilidad || null, p_min_precio, p_max_precio, categoria || null, calificaciones ? parseFloat(calificaciones) : null, buscar || null]
    );
    const totalProductos = totalProductosRows[0]?.[0]?.total || 0;

    const [resProductos] = await pool.query(
        `CALL sp_buscar_productos(?, ?, ?, ?, ?, ?, ?, ?)`,
        [disponibilidad || null, p_min_precio, p_max_precio, categoria || null, calificaciones ? parseFloat(calificaciones) : null, buscar || null, limit, offset]
    );
    const productos = resProductos[0] || [];

    const [resNuevos] = await pool.query(`CALL sp_obtener_nuevos_productos()`);
    const nuevoProductos = resNuevos[0] || [];

    const [resTop] = await pool.query(`CALL sp_obtener_top_calificados()`);
    const topCalificacion = resTop[0] || [];

    res.status(200).json({
        success: true,
        totalProductos,
        paginaActual: pagina,
        totalPaginas: Math.ceil(totalProductos / limit),
        productos,
        nuevoProductos,
        topCalificacion
    });
});
export const obtenerProducto = catchAsyncErrors(async (req, res, next) => {
    const { productoId } = req.params;

    if (!productoId) {
        return next(new ErrorHandler('El ID del producto es requerido.', 400));
    }

    const [resDetalle] = await pool.query(`CALL sp_obtener_detalle_producto(?)`, [productoId]);
    const productosRows = resDetalle[0] || [];

    if (productosRows.length === 0) {
        return next(new ErrorHandler('Producto no encontrado o ha sido eliminado.', 404));
    }

    const producto = productosRows[0];

    let imagenes = [];
    if (producto.imagenes) {
        try {
            imagenes = typeof producto.imagenes === 'string'
                ? JSON.parse(producto.imagenes)
                : producto.imagenes;
        } catch (error) {
            console.error('Error al parsear imágenes:', error);
            imagenes = [];
        }
    }

    const [resResenas] = await pool.query(`CALL sp_obtener_resenas_producto(?)`, [productoId]);
    const resenas = resResenas[0] || [];

    const productoCompleto = {
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: parseFloat(producto.precio),
        precio_oferta: producto.precio_oferta === null ? null : parseFloat(producto.precio_oferta),
        precio_efectivo: parseFloat(producto.precio_efectivo ?? producto.precio),
        en_oferta: Number(producto.en_oferta) === 1,
        oferta_inicio: producto.oferta_inicio ?? null,
        oferta_fin: producto.oferta_fin ?? null,
        categoria: producto.categoria,
        stock: producto.stock,
        estado: producto.estado,
        imagenes: imagenes,
        calificaciones: {
            promedio: parseFloat(producto.promedio_calificacion) || 0,
            total_resenas: parseInt(producto.review_count) || 0
        },
        vendedor: {
            id: producto.creado_por,
            nombre: producto.vendedor_nombre,
            email: producto.vendedor_email
        },
        fechas: {
            creacion: producto.fecha_creacion
        },
        resenas: resenas
    };

    res.status(200).json({
        success: true,
        message: "producto obtenido con exito",
        producto: productoCompleto
    });
});
export const actualizarProducto = catchAsyncErrors(async (req, res, next) => {
    const { productoId } = req.params;
    const { nombre, descripcion, precio, categoria, stock, precio_oferta, oferta_inicio, oferta_fin, quitar_oferta } = req.body;

    if (!nombre || !descripcion || !precio || !categoria || stock === undefined || stock === null || stock === '') {
        return next(new ErrorHandler('Por favor, proporcione todos los detalles del producto. Necesario: nombre, descripcion, precio, categoria, stock', 400));
    }

    let idCategoria = null;
    let idSubcategoria = null;

    const [resSubcat] = await pool.query(`CALL sp_resolver_subcategoria(?)`, [categoria]);
    const subcatRows = resSubcat[0] || [];

    if (subcatRows.length > 0) {
        idSubcategoria = subcatRows[0].id;
        idCategoria = subcatRows[0].id_categoria;
    } else {
        const [resCat] = await pool.query(`CALL sp_resolver_categoria(?)`, [categoria]);
        const catRows = resCat[0] || [];
        if (catRows.length === 0) {
            return next(new ErrorHandler("La categoría indicada no existe o está inactiva.", 400));
        }
        idCategoria = catRows[0].id;
    }

    if (!esImporte(precio)) {
        return next(new ErrorHandler('El precio debe ser un número con hasta dos decimales.', 400));
    }

    if (!esEnteroNoNegativo(stock, { max: 1000000 })) {
        return next(new ErrorHandler('El stock debe ser un número entero entre 0 y 1 000 000.', 400));
    }

    const precioNum = Number(String(precio).trim().replace(',', '.'));
    const stockNum = Number(String(stock).trim());

    const [resProd] = await pool.query(`CALL sp_obtener_producto_por_id(?)`, [productoId]);
    const productoRows = resProd[0] || [];

    if (productoRows.length === 0) {
        return next(new ErrorHandler('Producto no encontrado.', 404));
    }

    const productoActual = productoRows[0];

    const quiereQuitarOferta = quitar_oferta === true || quitar_oferta === 'true' || quitar_oferta === '1';
    let precioOfertaNum = productoActual.precio_oferta !== null && productoActual.precio_oferta !== undefined
        ? Number(productoActual.precio_oferta)
        : null;
    let ofertaInicioFmt = productoActual.oferta_inicio
        ? formatMysqlDateTime(productoActual.oferta_inicio)
        : null;
    let ofertaFinFmt = productoActual.oferta_fin
        ? formatMysqlDateTime(productoActual.oferta_fin)
        : null;

    if (quiereQuitarOferta) {
        precioOfertaNum = null;
        ofertaInicioFmt = null;
        ofertaFinFmt = null;
    } else if (precio_oferta !== undefined && precio_oferta !== null && precio_oferta !== '') {
        if (!esImporte(precio_oferta)) {
            return next(new ErrorHandler('El precio de oferta debe ser un número válido.', 400));
        }
        precioOfertaNum = Number(String(precio_oferta).trim().replace(',', '.'));
        if (precioOfertaNum <= 0 || precioOfertaNum >= precioNum) {
            return next(new ErrorHandler('El precio de oferta debe ser mayor a 0 y menor que el precio normal.', 400));
        }

        if (oferta_inicio) {
            ofertaInicioFmt = formatMysqlDateTime(oferta_inicio);
            if (ofertaInicioFmt === null) {
                return next(new ErrorHandler('La fecha de inicio de oferta no es válida.', 400));
            }
        }
        if (oferta_fin) {
            ofertaFinFmt = formatMysqlDateTime(oferta_fin);
            if (ofertaFinFmt === null) {
                return next(new ErrorHandler('La fecha de fin de oferta no es válida.', 400));
            }
        }
        if (ofertaInicioFmt && ofertaFinFmt && ofertaFinFmt < ofertaInicioFmt) {
            return next(new ErrorHandler('La fecha de fin debe ser posterior a la fecha de inicio.', 400));
        }
    }

    let imagenesActuales = [];
    if (productoActual.imagenes) {
        try {
            imagenesActuales = typeof productoActual.imagenes === 'string'
                ? JSON.parse(productoActual.imagenes)
                : productoActual.imagenes;
        } catch (error) {
            console.error('Error al parsear imágenes:', error);
            imagenesActuales = [];
        }
    }

    let imagenesAMantener = imagenesActuales;

    if (req.body.imagenesAMantener) {
        try {
            const parsed = JSON.parse(req.body.imagenesAMantener);

            if (Array.isArray(parsed)) {
                imagenesAMantener = parsed;
            }
        } catch (error) {
            console.error('Error al parsear imagenesAMantener:', error);

            imagenesAMantener = imagenesActuales;
        }
    }

    const imagenesEliminadas = imagenesActuales.filter(
        imgActual => !imagenesAMantener.some(imgMantener => imgMantener.public_id === imgActual.public_id)
    );

    for (const img of imagenesEliminadas) {
        if (img.public_id) {
            try {
                await cloudinary.uploader.destroy(img.public_id);
            } catch (err) {
                console.error("Error eliminando imagen de Cloudinary:", err);
            }
        }
    }

    let imagenes = [...imagenesAMantener];

    if (req.files && req.files.imagenes) {
        const nuevasImagenes = comoLista(req.files.imagenes);
        const errorImagen = validarImagenes(nuevasImagenes);
        if (errorImagen) {
            return next(new ErrorHandler(errorImagen, 400));
        }

        for (const imagen of nuevasImagenes) {
            const result = await cloudinary.uploader.upload(imagen.tempFilePath, {
                folder: "ecommerce_producto_imagenes",
                width: 1000,
                crop: "scale"
            });
            imagenes.push({
                url: result.secure_url,
                public_id: result.public_id
            });
        }
    }

    const [resAct] = await pool.query(
        `CALL sp_actualizar_producto_completo(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productoId, nombre, descripcion, precioNum, idCategoria, idSubcategoria, stockNum, JSON.stringify(imagenes), precioOfertaNum, ofertaInicioFmt, ofertaFinFmt]
    );
    const productoActualizado = resAct[0] || [];

    res.status(200).json({
        success: true,
        message: 'Producto actualizado con éxito',
        producto: productoActualizado[0]
    });
});
export const eliminarProducto = catchAsyncErrors(async (req, res, next) => {
    const { productoId } = req.params;

    const [resProd] = await pool.query(`CALL sp_obtener_producto_por_id(?)`, [productoId]);
    const productoRows = resProd[0] || [];

    if (productoRows.length === 0) {
        return next(new ErrorHandler('Producto no encontrado o ya fue eliminado.', 404));
    }

    const producto = productoRows[0];

    let imagenes = [];
    if (producto.imagenes) {
        try {
            imagenes = typeof producto.imagenes === 'string'
                ? JSON.parse(producto.imagenes)
                : producto.imagenes;
        } catch (error) {
            console.error('Error al parsear imágenes:', error);
            imagenes = [];
        }
    }

    await pool.query(`CALL sp_marcar_producto_eliminado(?)`, [productoId]);

    if (imagenes?.length > 0 && !(await productoTienePedidos(productoId))) {
        await eliminarImagenesCloudinary(imagenes);
    }

    res.status(200).json({
        success: true,
        message: 'Producto eliminado con éxito',
        productoId: productoId
    });
});
export const publicarResenaProducto = catchAsyncErrors(async (req, res, next) => {
    const { productoId } = req.params;
    const { calificacion, comentario } = req.body;
    const usuarioId = req.user.id;

    if (!calificacion || !comentario) {
        return next(new ErrorHandler('Por favor, proporcione una calificación y un comentario para la reseña.', 400));
    }

    if (calificacion < 0 || calificacion > 5) {
        return next(new ErrorHandler('La calificación debe estar entre 0 y 5.', 400));
    }

    const [resCompra] = await pool.query(`CALL sp_verificar_compra_producto(?, ?)`, [usuarioId, productoId]);
    const compra = resCompra[0] || [];

    if (compra.length === 0) {
        return next(new ErrorHandler('Solo puedes reseñar un producto de un pedido que hayas pagado.', 403));
    }

    const [resProd] = await pool.query(`CALL sp_obtener_producto_por_id(?)`, [productoId]);
    const producto = resProd[0] || [];
    if (producto.length === 0) {
        return next(new ErrorHandler('Producto no encontrado.', 404));
    }

    const idResena = crypto.randomUUID();
    const [resResena] = await pool.query(`CALL sp_publicar_resena(?, ?, ?, ?, ?)`, [idResena, productoId, usuarioId, calificacion, comentario]);
    const resena = resResena[0]?.[0] || {};

    res.status(200).json({
        success: true,
        message: 'Reseña publicada con éxito',
        resena: resena
    });
});
export const eliminarResena = catchAsyncErrors(async (req, res, next) => {
    const { productoId } = req.params;
    const usuarioId = req.user.id;

    const [resEliminar] = await pool.query(`CALL sp_eliminar_resena(?, ?)`, [productoId, usuarioId]);
    const affected = resEliminar[0]?.[0]?.affected || 0;

    if (affected === 0) {
        return next(new ErrorHandler('Reseña no encontrada.', 404));
    }

    res.status(200).json({
        success: true,
        message: 'Tu reseña ha sido eliminada con éxito',
        productoId: productoId
    });
});
export const buscarIAFiltrarProducto = catchAsyncErrors(async (req, res, next) => {
    const { mensajeUsuario } = req.body;

    if (!mensajeUsuario || typeof mensajeUsuario !== 'string' || mensajeUsuario.trim().length === 0) {
        return next(new ErrorHandler("Proporcione una solicitud válida de búsqueda.", 400));
    }

    const filterKeywords = (query) => {
        const stopWords = new Set([
            "el", "ellos", "ellas", "entonces", "yo", "nosotros", "tú", "él", "ella",
            "es", "un", "una", "de", "y", "o", "a", "para", "desde", "en", "con",
            "quien", "por qué", "cuando", "cuál", "esto", "aquel", "por", "ser", "no",
            "era", "eran", "tiene", "tener", "tenía", "hacer", "hace", "hizo", "así",
            "algunos", "cualquier", "cómo", "puede", "podría", "debería", "haría",
            "allí", "aquí", "simplemente", "que", "porque", "pero", "su", "si",
            ".", ",", "!", "?", ">", "<", ";", "`"
        ]);

        return query
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter((word) => word.length > 0 && !stopWords.has(word));
    };

    const keywords = filterKeywords(mensajeUsuario);

    if (keywords.length === 0) {
        return res.status(200).json({
            success: true,
            message: "La búsqueda contiene solo palabras irrelevantes.",
            productos: [],
        });
    }

    try {
        const regexKeywords = keywords.join("|");

        const [resIA] = await pool.query(`CALL sp_buscar_productos_ia(?)`, [regexKeywords]);
        const filtradoProductos = resIA[0] || [];

        if (filtradoProductos.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No se encontraron productos que coincidan con su búsqueda.",
                productos: [],
            });
        }

        const sinRefinar = {
            success: true,
            message: "Productos filtrados por búsqueda (sin refinamiento de IA).",
            productos: filtradoProductos,
        };

        const { success, ids, message } = await obtenerAIRecomendacion(
            mensajeUsuario,
            filtradoProductos
        );

        if (!success) {
            console.warn("Advertencia de IA:", message);
            return res.status(200).json(sinRefinar);
        }

        const porId = new Map(filtradoProductos.map((p) => [p.id, p]));
        const productos = ids.map((id) => porId.get(id)).filter(Boolean);

        if (ids.length > 0 && productos.length === 0) {
            console.warn("La IA devolvió ids que no existen en el catálogo.");
            return res.status(200).json(sinRefinar);
        }

        res.status(200).json({
            success: true,
            message: productos.length
                ? "Productos filtrados y refinados por IA."
                : "No se encontraron productos que coincidan con su búsqueda.",
            productos,
        });
    } catch (error) {
        console.error("Error en buscarIAFiltrarProducto:", error);
        return next(new ErrorHandler("Error al procesar la búsqueda de productos.", 500));
    }
})

export const actualizarOfertaProducto = catchAsyncErrors(async (req, res, next) => {
    const { productoId } = req.params;
    const { precio_oferta, oferta_inicio, oferta_fin } = req.body;

    if (!esUuid(productoId)) {
        return next(new ErrorHandler("ID de producto inválido.", 400));
    }

    const quitarOferta =
        precio_oferta === null || precio_oferta === "" || precio_oferta === undefined;

    if (!quitarOferta && !esImporte(precio_oferta)) {
        return next(
            new ErrorHandler(
                "El precio de oferta debe ser un número con hasta dos decimales.",
                400
            )
        );
    }

    const comoFecha = (valor, etiqueta) => {
        if (valor === null || valor === undefined || valor === "") return null;
        const fecha = new Date(valor);
        if (Number.isNaN(fecha.getTime())) {
            throw new ErrorHandler(`La fecha de ${etiqueta} de la promoción no es válida.`, 400);
        }
        return fecha;
    };

    let inicio;
    let fin;
    try {
        inicio = comoFecha(oferta_inicio, "inicio");
        fin = comoFecha(oferta_fin, "fin");
    } catch (error) {
        return next(error);
    }

    const [resultado] = await pool.query(
        `CALL sp_actualizar_oferta_producto(?, ?, ?, ?)`,
        [
            productoId,
            quitarOferta ? null : Number(String(precio_oferta).trim().replace(",", ".")),
            inicio,
            fin,
        ]
    );

    res.status(200).json({
        success: true,
        message: quitarOferta ? "Promoción retirada." : "Promoción actualizada.",
        producto: resultado[0]?.[0] ?? null,
    });
});

const TALLAS_CONOCIDAS = ["XS", "S", "M", "L", "XL", "XXL"];
const MAX_VARIANTES = 100;

export const listarVariantesProducto = catchAsyncErrors(async (req, res, next) => {
    const { productoId } = req.params;
    if (!esUuid(productoId)) {
        return next(new ErrorHandler("ID de producto inválido.", 400));
    }

    const soloActivas = req.usuario?.rol === "Admin" ? 0 : 1;

    const [resultado] = await pool.query(`CALL sp_listar_variantes(?, ?)`, [
        productoId,
        soloActivas,
    ]);

    res.status(200).json({
        success: true,
        variantes: (resultado[0] || []).map((v) => ({
            ...v,
            stock: Number(v.stock),
            activo: Number(v.activo) === 1,
        })),
    });
});

export const guardarVariantesProducto = catchAsyncErrors(async (req, res, next) => {
    const { productoId } = req.params;
    const { variantes } = req.body;

    if (!esUuid(productoId)) {
        return next(new ErrorHandler("ID de producto inválido.", 400));
    }

    if (!Array.isArray(variantes) || variantes.length === 0) {
        return next(
            new ErrorHandler("Envía al menos una combinación de talla y color.", 400)
        );
    }

    if (variantes.length > MAX_VARIANTES) {
        return next(
            new ErrorHandler(
                `Un producto no puede tener más de ${MAX_VARIANTES} combinaciones.`,
                400
            )
        );
    }

    const limpias = [];
    const vistas = new Set();

    for (const v of variantes) {
        const talla = String(v?.talla ?? "").trim();
        const color = String(v?.color ?? "").trim();

        if (!talla || talla.length > 20) {
            return next(new ErrorHandler("Cada variante necesita una talla de 1 a 20 caracteres.", 400));
        }
        if (!color || color.length > 40) {
            return next(new ErrorHandler("Cada variante necesita un color de 1 a 40 caracteres.", 400));
        }
        if (!esEnteroNoNegativo(v?.stock, { max: 1000000 })) {
            return next(
                new ErrorHandler(`El stock de ${talla} · ${color} debe ser un entero de 0 a 1 000 000.`, 400)
            );
        }

        const hex = String(v?.color_hex ?? "").trim();
        if (hex && !/^#[0-9a-fA-F]{6}$/.test(hex)) {
            return next(
                new ErrorHandler(`El color ${color} tiene un código de color inválido (usa #RRGGBB).`, 400)
            );
        }

        const clave = `${talla.toLowerCase()}|${color.toLowerCase()}`;
        if (vistas.has(clave)) {
            return next(new ErrorHandler(`La combinación ${talla} · ${color} está repetida.`, 400));
        }
        vistas.add(clave);

        limpias.push({
            talla,
            color,
            color_hex: hex || null,
            sku: String(v?.sku ?? "").trim() || null,
            stock: Number(String(v.stock).trim()),
        });
    }

    const [resultado] = await pool.query(`CALL sp_guardar_variantes(?, ?)`, [
        productoId,
        JSON.stringify(limpias),
    ]);

    res.status(200).json({
        success: true,
        message: `${limpias.length} combinación(es) guardada(s).`,
        variantes: resultado[0] || [],
    });
});

export const eliminarVarianteProducto = catchAsyncErrors(async (req, res, next) => {
    const { varianteId } = req.params;
    if (!esUuid(varianteId)) {
        return next(new ErrorHandler("ID de variante inválido.", 400));
    }

    const [resultado] = await pool.query(`CALL sp_eliminar_variante(?)`, [varianteId]);
    const info = resultado[0]?.[0] || {};
    const desactivada = Number(info.desactivada) === 1;

    res.status(200).json({
        success: true,
        desactivada,
        message: desactivada
            ? `La combinación se desactivó porque aparece en ${info.pedidos_afectados} pedido(s); ya no se vende pero el historial se conserva.`
            : "Combinación eliminada.",
    });
});

export { TALLAS_CONOCIDAS };
