import express from 'express';
import {
    registrar,
    login,
    obtenerUsuario,
    cerrarSesion,
    contraseñaOlvidado,
    restaurarContraseña,
    actualizarContraseña, actualizarPerfil,
    loginGoogle, configGoogle
} from '../controllers/authController.js';
import { isAuthenticate } from "../middlewares/authMiddleware.js";
import {
    limitadorAuth,
    limitadorRecuperacion,
} from "../middlewares/rateLimiters.js";

const router = express.Router();
router.post('/registrar', limitadorAuth, registrar)
router.post('/login', limitadorAuth, login)
router.get('/google/config', configGoogle)
router.post('/google', limitadorAuth, loginGoogle)
router.get('/obtenerUsuario', isAuthenticate, obtenerUsuario)
router.post('/cerrarSesion', isAuthenticate, cerrarSesion)
router.post('/contrasena/reiniciar', limitadorRecuperacion, contraseñaOlvidado)
router.put('/contrasena/reiniciar/:token', limitadorRecuperacion, restaurarContraseña)
router.put('/contrasena/actualizar', isAuthenticate, actualizarContraseña)
router.put('/perfil/actualizar', isAuthenticate, actualizarPerfil)

export default router;