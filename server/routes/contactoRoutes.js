import express from "express";
import {
  obtenerInfoContacto,
  enviarMensajeContacto,
  listarMensajesContacto,
  marcarMensajeLeido,
  eliminarMensajeContacto,
} from "../controllers/contactoController.js";
import {
  isAuthenticate,
  autherizedRoles,
} from "../middlewares/authMiddleware.js";

import { limitadorFormularios } from "../middlewares/rateLimiters.js";

const router = express.Router();

router.get("/contacto/info", obtenerInfoContacto);
router.post("/contacto", limitadorFormularios, enviarMensajeContacto);

router.get(
  "/contacto/admin",
  isAuthenticate,
  autherizedRoles("Admin"),
  listarMensajesContacto
);
router.put(
  "/contacto/admin/:id/leido",
  isAuthenticate,
  autherizedRoles("Admin"),
  marcarMensajeLeido
);
router.delete(
  "/contacto/admin/:id",
  isAuthenticate,
  autherizedRoles("Admin"),
  eliminarMensajeContacto
);

export default router;
