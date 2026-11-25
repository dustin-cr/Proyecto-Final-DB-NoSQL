// src/services/ResenaService.js

const mongoose = require('mongoose');
const Resena = require('../models/Resena');

const SENTIMIENTOS = ['positivo', 'neutral', 'negativo'];

// Crea un error con código HTTP para que el controlador lo responda
function errorDeEntrada(mensaje) {
  const err = new Error(mensaje);
  err.status = 400;
  return err;
}

function validarId(id, campo = 'id') {
  if (!mongoose.isValidObjectId(id)) throw errorDeEntrada(`El ${campo} enviado no es válido`);
  return new mongoose.Types.ObjectId(String(id));
}

class ResenaService {

  // Arma el filtro de búsqueda SOLO con los parámetros permitidos y los convierte
  // al tipo correcto (evita que se inyecten operadores de MongoDB por la URL).
  construirFiltro(q) {
    const filtro = {};
    if (q.negocio) filtro.negocio_id = validarId(q.negocio, 'negocio');
    if (q.estrellas) {
      const e = parseInt(q.estrellas, 10);
      if (!(e >= 1 && e <= 5)) throw errorDeEntrada('estrellas debe ser un número del 1 al 5');
      filtro.estrellas = e;
    }
    if (q.sentimiento) {
      if (!SENTIMIENTOS.includes(String(q.sentimiento))) {
        throw errorDeEntrada('sentimiento debe ser: positivo, neutral o negativo');
      }
      filtro['nlp.sentimiento'] = String(q.sentimiento);
    }
    if (q.tema) filtro['nlp.temas'] = String(q.tema);
    if (q.problema) filtro['nlp.problemas'] = String(q.problema);
    if (q.con_texto === 'true') filtro.comentario = { $ne: null };
    return filtro;
  }

  async getResenas(q) {
    const filtro = this.construirFiltro(q);
    const limite = Math.min(Math.max(parseInt(q.limite, 10) || 20, 1), 100);
    const pagina = Math.max(parseInt(q.pagina, 10) || 1, 1);

    const [total, resultados] = await Promise.all([
      Resena.countDocuments(filtro),
      Resena.find(filtro).sort({ fecha_creacion: -1 }).skip((pagina - 1) * limite).limit(limite),
    ]);
    return { total, pagina, limite, resultados };
  }

  async getResena(id) {
    return await Resena.findById(validarId(id));
  }

  // Problemas más frecuentes y distribución del sentimiento de un negocio
  async getProblemasNegocio(negocioId) {
    const id = validarId(negocioId, 'negocio');

    const problemas = await Resena.aggregate([
      { $match: { negocio_id: id } },
      { $unwind: '$nlp.problemas' },
      { $group: { _id: '$nlp.problemas', cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } },
      { $project: { _id: 0, tema: '$_id', cantidad: 1 } },
    ]);

    const sentimiento = await Resena.aggregate([
      { $match: { negocio_id: id, 'nlp.sentimiento': { $exists: true } } },
      { $group: { _id: '$nlp.sentimiento', cantidad: { $sum: 1 } } },
      { $project: { _id: 0, sentimiento: '$_id', cantidad: 1 } },
    ]);

    return { negocio_id: id, problemas, sentimiento };
  }
}

module.exports = new ResenaService();