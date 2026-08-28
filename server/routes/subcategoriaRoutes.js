import express from "express";
import {
  listarSubcategorias,
  listarSubcategoriasAdmin,
  crearSubcategoria,
  actualizarSubcategoria,
  eliminarSubcategoria,
} from "../controllers/subcategoriaController.js";
import { isAuthenticate, autherizedRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", listarSubcategorias);
router.get("/admin/todas", isAuthenticate, autherizedRoles("Admin"), listarSubcategoriasAdmin);
router.post("/admin", isAuthenticate, autherizedRoles("Admin"), crearSubcategoria);
router.put("/admin/:id", isAuthenticate, autherizedRoles("Admin"), actualizarSubcategoria);
router.delete("/admin/:id", isAuthenticate, autherizedRoles("Admin"), eliminarSubcategoria);

export default router;
