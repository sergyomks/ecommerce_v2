import express from "express";
import {
    dashboardPanel,
    eliminarUsuario,
    obtenerTodoUsuarios,
    reporteVentasExcel,
} from "../controllers/adminController.js";
import {
    autherizedRoles,
    isAuthenticate,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/obtenertodosusuarios", isAuthenticate, autherizedRoles("Admin"), obtenerTodoUsuarios);
router.delete("/eliminar/:id", isAuthenticate, autherizedRoles("Admin"), eliminarUsuario);
router.get("/buscar/dashboard-panel", isAuthenticate, autherizedRoles("Admin"), dashboardPanel);
router.get("/reportes/ventas", isAuthenticate, autherizedRoles("Admin"), reporteVentasExcel);

export default router;