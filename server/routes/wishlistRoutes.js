import express from "express";
import {
  listarWishlist,
  agregarWishlist,
  eliminarWishlist,
  verificarWishlist,
} from "../controllers/wishlistController.js";
import { isAuthenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", isAuthenticate, listarWishlist);
router.get("/:productoId/existe", isAuthenticate, verificarWishlist);
router.post("/:productoId", isAuthenticate, agregarWishlist);
router.delete("/:productoId", isAuthenticate, eliminarWishlist);

export default router;
