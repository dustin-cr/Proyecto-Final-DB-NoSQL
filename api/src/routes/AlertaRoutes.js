// src/routes/AlertaRoutes.js
const express = require('express');
const router = express.Router();
const alertaController = require('../controllers/AlertaController');

// Las alertas las genera el análisis NLP: la API las consulta y cambia su estado.
router.get('/alertas', alertaController.getAlertas);
router.get('/alertas/:id', alertaController.getAlerta);
router.put('/alertas/:id', alertaController.cambiarEstado);

module.exports = router;