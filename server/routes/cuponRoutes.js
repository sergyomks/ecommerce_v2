import express from "express";
import {
  validarCuponPublico,
  listarCupones,
  crearCupon,
  actualizarCupon,
  eliminarCupon,
} from "../controllers/cuponController.js";
import {
  isAuthenticate,
  autherizedRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/validar", isAuthenticate, validarCuponPublico);
router.get(
  "/admin",
  isAuthenticate,
  autherizedRoles("Admin"),
  listarCupones
);
router.post(
  "/admin",
  isAuthenticate,
  autherizedRoles("Admin"),
  crearCupon
);
router.put(
  "/admin/:id",
  isAuthenticate,
  autherizedRoles("Admin"),
  actualizarCupon
);
router.delete(
  "/admin/:id",
  isAuthenticate,
  autherizedRoles("Admin"),
  eliminarCupon
);

export default router;
