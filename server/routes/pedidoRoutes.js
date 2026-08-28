import express from "express";
import {
    actualizarEstadoPedido,
    eliminarPedido,
    nuevoPedido,
    obtenerMisPedidos,
    obtenerPedidoUnico,
    obtenerTodosPedidos
} from "../controllers/pedidoController.js";
import {isAuthenticate, autherizedRoles} from "../middlewares/authMiddleware.js";
import { limitadorPedidos } from "../middlewares/rateLimiters.js";

const router = express.Router();

router.post("/nuevo", isAuthenticate, limitadorPedidos, nuevoPedido);
router.get("/pedidos/me", isAuthenticate, obtenerMisPedidos);
router.get("/admin/obtenerTodo", isAuthenticate, autherizedRoles("Admin"), obtenerTodosPedidos);

router.get("/:pedidoId", isAuthenticate, obtenerPedidoUnico);
router.put("/admin/actualizar/:pedidoId", isAuthenticate, autherizedRoles("Admin"), actualizarEstadoPedido);
router.delete("/admin/eliminar/:pedidoId", isAuthenticate, autherizedRoles("Admin"), eliminarPedido);

export default router;