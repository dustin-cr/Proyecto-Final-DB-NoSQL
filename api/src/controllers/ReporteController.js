// src/controllers/ReporteController.js
const reporteService = require('../services/ReporteService');

function responderError(res, err) {
  if (err.status === 400 || err.name === 'CastError') {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: err.message });
}

class ReporteController {

  async getReportes(req, res) {
    try {
      res.json(await reporteService.getReportes(req.query));
    } catch (err) {
      responderError(res, err);
    }
  }

  async getUltimoReporte(req, res) {
    try {
      const reporte = await reporteService.getUltimoReporte(req.params.id);
      if (!reporte) {
        return res.status(404).json({ error: 'Este negocio todavía no tiene reportes' });
      }
      res.json(reporte);
    } catch (err) {
      responderError(res, err);
    }
  }
}

module.exports = new ReporteController();