// src/routes/ReporteRoutes.js
const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/ReporteController');

// Los reportes los genera el análisis NLP: la API solo los consulta.
router.get('/reportes', reporteController.getReportes);
router.get('/negocios/:id/reporte', reporteController.getUltimoReporte);

module.exports = router;