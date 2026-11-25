// src/routes/ResenaRoutes.js
const express = require('express');
const router = express.Router();
const resenaController = require('../controllers/ResenaController');

// Las reseñas vienen de Google y las carga Python: la API solo las consulta.
router.get('/resenas', resenaController.getResenas);
router.get('/resenas/:id', resenaController.getResena);
router.get('/negocios/:id/problemas', resenaController.getProblemasNegocio);

module.exports = router;