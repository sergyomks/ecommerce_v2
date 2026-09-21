import express from "express";
import {
    dashboardPanel,
    eliminarUsuario,
    obtenerTodoUsuarios,
    reporteVentasExcel,
} from "../controllers/adminController.js";
import { isAuthenticateAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/obtenertodosusuarios", isAuthenticateAdmin, obtenerTodoUsuarios);
router.delete("/eliminar/:id", isAuthenticateAdmin, eliminarUsuario);
router.get("/buscar/dashboard-panel", isAuthenticateAdmin, dashboardPanel);
router.get("/reportes/ventas", isAuthenticateAdmin, reporteVentasExcel);

export default router;