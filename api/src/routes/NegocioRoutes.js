// src/routes/NegocioRoutes.js
const express = require('express');
const router = express.Router();
const negocioController = require('../controllers/NegocioController');

router.post('/negocios', negocioController.createNegocio);
router.get('/negocios', negocioController.getNegocios);
router.get('/negocios/:id', negocioController.getNegocio);
router.put('/negocios/:id', negocioController.updateNegocio);
router.delete('/negocios/:id', negocioController.deleteNegocio);

module.exports = router;