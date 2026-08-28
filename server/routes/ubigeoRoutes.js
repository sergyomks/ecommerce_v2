import express from "express";
import {
  listarDepartamentos,
  listarProvinciasPorDepartamento,
  listarDistritosPorProvincia,
} from "../controllers/ubigeoController.js";

const router = express.Router();

router.get("/departamentos", listarDepartamentos);
router.get("/provincias/:departamentoId", listarProvinciasPorDepartamento);
router.get("/distritos/:provinciaId", listarDistritosPorProvincia);

export default router;
