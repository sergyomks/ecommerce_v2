import express from "express";
import { crearCargo, obtenerLlaveCulqi } from "../controllers/pagoController.js";
import { isAuthenticate } from "../middlewares/authMiddleware.js";
import { limitadorPago } from "../middlewares/rateLimiters.js";

const router = express.Router();

router.post("/crear-cargo", isAuthenticate, limitadorPago, crearCargo);
router.get("/llave-culqi", isAuthenticate, obtenerLlaveCulqi);

export default router;