import express from "express";
import {
  obtenerConfigEnvio,
  calcularEnvioEndpoint,
  listarTarifasPublicas,
  listarTarifas,
  crearTarifa,
  actualizarTarifa,
  eliminarTarifa,
} from "../controllers/envioController.js";
import {
  isAuthenticate,
  autherizedRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/config", obtenerConfigEnvio);
router.get("/tarifas", listarTarifasPublicas);
router.get("/calcular", calcularEnvioEndpoint);
router.post("/calcular", calcularEnvioEndpoint);

router.get(
  "/tarifas/admin",
  isAuthenticate,
  autherizedRoles("Admin"),
  listarTarifas
);
router.post(
  "/tarifas/admin",
  isAuthenticate,
  autherizedRoles("Admin"),
  crearTarifa
);
router.put(
  "/tarifas/admin/:id",
  isAuthenticate,
  autherizedRoles("Admin"),
  actualizarTarifa
);
router.delete(
  "/tarifas/admin/:id",
  isAuthenticate,
  autherizedRoles("Admin"),
  eliminarTarifa
);

export default router;
