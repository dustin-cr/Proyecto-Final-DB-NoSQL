// src/controllers/ResenaController.js
const resenaService = require('../services/ResenaService');

function responderError(res, err) {
  if (err.status === 400 || err.name === 'CastError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 13) {
    return res.status(403).json({ error: 'El usuario de la API no tiene permiso para esta operación' });
  }
  return res.status(500).json({ error: err.message });
}

class ResenaController {

  // GET /api/resenas?negocio=&estrellas=&sentimiento=&tema=&problema=&con_texto=true&pagina=&limite=
  async getResenas(req, res) {
    try {
      res.json(await resenaService.getResenas(req.query));
    } catch (err) {
      responderError(res, err);
    }
  }

  async getResena(req, res) {
    try {
      const resena = await resenaService.getResena(req.params.id);
      if (!resena) {
        return res.status(404).json({ error: 'Reseña no encontrada' });
      }
      res.json(resena);
    } catch (err) {
      responderError(res, err);
    }
  }

  async getProblemasNegocio(req, res) {
    try {
      res.json(await resenaService.getProblemasNegocio(req.params.id));
    } catch (err) {
      responderError(res, err);
    }
  }
}

module.exports = new ResenaController();