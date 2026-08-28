import express from "express";
import {
    actualizarProducto, buscarIAFiltrarProducto,
    buscarTodosProductos,
    crearProducto,
    eliminarProducto, eliminarResena,
    obtenerProducto,
    publicarResenaProducto,
    actualizarOfertaProducto,
    listarVariantesProducto,
    guardarVariantesProducto,
    eliminarVarianteProducto
} from "../controllers/productoController.js";
import {isAuthenticate, autherizedRoles}     from "../middlewares/authMiddleware.js";
import { limitadorIA } from "../middlewares/rateLimiters.js";

const router = express.Router();

router.post("/admin/crear", isAuthenticate, autherizedRoles("Admin"), crearProducto);
router.get("/", buscarTodosProductos);
router.get("/:productoId", obtenerProducto);
router.put("/publicar-resena/:productoId", isAuthenticate, publicarResenaProducto);
router.put("/admin/actualizar/:productoId", isAuthenticate, autherizedRoles("Admin"), actualizarProducto);
router.put("/admin/oferta/:productoId", isAuthenticate, autherizedRoles("Admin"), actualizarOfertaProducto);

router.get("/:productoId/variantes", listarVariantesProducto);
router.put("/admin/:productoId/variantes", isAuthenticate, autherizedRoles("Admin"), guardarVariantesProducto);
router.delete("/admin/variantes/:varianteId", isAuthenticate, autherizedRoles("Admin"), eliminarVarianteProducto);
router.delete("/admin/eliminar/:productoId", isAuthenticate, autherizedRoles("Admin"), eliminarProducto);
router.delete("/eliminar/resena/:productoId", isAuthenticate, eliminarResena);
router.post("/buscar_ia", isAuthenticate, limitadorIA, buscarIAFiltrarProducto);

export default router;
