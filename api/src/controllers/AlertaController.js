// src/controllers/AlertaController.js
const alertaService = require('../services/AlertaService');

function responderError(res, err) {
  if (err.status === 400 || err.name === 'CastError' || err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 13) {
    return res.status(403).json({ error: 'El usuario de la API no tiene permiso para esta operación' });
  }
  return res.status(500).json({ error: err.message });
}

class AlertaController {

  async getAlertas(req, res) {
    try {
      res.json(await alertaService.getAlertas(req.query));
    } catch (err) {
      responderError(res, err);
    }
  }

  async getAlerta(req, res) {
    try {
      const alerta = await alertaService.getAlerta(req.params.id);
      if (!alerta) {
        return res.status(404).json({ error: 'Alerta no encontrada' });
      }
      res.json(alerta);
    } catch (err) {
      responderError(res, err);
    }
  }

  async cambiarEstado(req, res) {
    try {
      const alerta = await alertaService.cambiarEstado(req.params.id, req.body.estado);
      if (!alerta) {
        return res.status(404).json({ error: 'Alerta no encontrada' });
      }
      res.json(alerta);
    } catch (err) {
      responderError(res, err);
    }
  }
}

module.exports = new AlertaController();