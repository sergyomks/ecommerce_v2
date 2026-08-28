import express from "express";
import {
  listarCategorias,
  listarCategoriasAdmin,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../controllers/categoriaController.js";
import {
  isAuthenticate,
  autherizedRoles,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", listarCategorias);
router.get(
  "/admin/todas",
  isAuthenticate,
  autherizedRoles("Admin"),
  listarCategoriasAdmin
);
router.post(
  "/admin",
  isAuthenticate,
  autherizedRoles("Admin"),
  crearCategoria
);
router.put(
  "/admin/:id",
  isAuthenticate,
  autherizedRoles("Admin"),
  actualizarCategoria
);
router.delete(
  "/admin/:id",
  isAuthenticate,
  autherizedRoles("Admin"),
  eliminarCategoria
);

export default router;
