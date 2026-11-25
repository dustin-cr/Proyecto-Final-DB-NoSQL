// src/services/ReporteService.js
const mongoose = require('mongoose');
const Reporte = require('../models/Reporte');

function validarId(id, campo = 'id') {
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error(`El ${campo} enviado no es válido`);
    err.status = 400;
    throw err;
  }
  return new mongoose.Types.ObjectId(String(id));
}

class ReporteService {

  // Historial de reportes (del más reciente al más antiguo). ?negocio=<id> es opcional
  async getReportes(q) {
    const filtro = q.negocio ? { negocio_id: validarId(q.negocio, 'negocio') } : {};
    return await Reporte.find(filtro).sort({ generado_en: -1 });
  }

  // El reporte más reciente de un negocio
  async getUltimoReporte(negocioId) {
    return await Reporte.findOne({ negocio_id: validarId(negocioId, 'negocio') }).sort({ generado_en: -1 });
  }
}

module.exports = new ReporteService();