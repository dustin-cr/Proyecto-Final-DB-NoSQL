/// src/controllers/NegocioController.js
const negocioService = require('../services/NegocioService');

// Traduce los errores de MongoDB a respuestas claras para quien usa la API
function responderError(res, err) {
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'El id enviado no es válido' });
  }
  if (err.name === 'ValidationError' || err.code === 121) {
    return res.status(400).json({ error: 'Los datos no cumplen el esquema de la colección', detalle: err.message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Ya existe un negocio con ese google_location_id' });
  }
  if (err.code === 13) {
    return res.status(403).json({ error: 'El usuario de la API no tiene permiso para esta operación' });
  }
  return res.status(500).json({ error: err.message });
}

class NegocioController {

  async createNegocio(req, res) {
    try {
      const negocio = await negocioService.createNegocio(req.body);
      res.status(201).json(negocio);
    } catch (err) {
      responderError(res, err);
    }
  }

  async getNegocios(req, res) {
    try {
      const negocios = await negocioService.getNegocios();
      res.json(negocios);
    } catch (err) {
      responderError(res, err);
    }
  }

  async getNegocio(req, res) {
    try {
      const negocio = await negocioService.getNegocio(req.params.id);
      if (!negocio) {
        return res.status(404).json({ error: 'Negocio no encontrado' });
      }
      res.json(negocio);
    } catch (err) {
      responderError(res, err);
    }
  }

  async updateNegocio(req, res) {
    try {
      const negocio = await negocioService.updateNegocio(req.params.id, req.body);
      if (!negocio) {
        return res.status(404).json({ error: 'Negocio no encontrado' });
      }
      res.json(negocio);
    } catch (err) {
      responderError(res, err);
    }
  }

  async deleteNegocio(req, res) {
    try {
      const negocio = await negocioService.deleteNegocio(req.params.id);
      if (!negocio) {
        return res.status(404).json({ error: 'Negocio no encontrado' });
      }
      res.json({ message: 'Negocio eliminado' });
    } catch (err) {
      responderError(res, err);
    }
  }
}

module.exports = new NegocioController();