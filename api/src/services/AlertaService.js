// src/services/AlertaService.js

const mongoose = require('mongoose');
const Alerta = require('../models/Alerta');

const ESTADOS = ['pendiente', 'atendida', 'descartada'];

function errorDeEntrada(mensaje) {
  const err = new Error(mensaje);
  err.status = 400;
  return err;
}

function validarId(id, campo = 'id') {
  if (!mongoose.isValidObjectId(id)) throw errorDeEntrada(`El ${campo} enviado no es válido`);
  return new mongoose.Types.ObjectId(String(id));
}

class AlertaService {

  // GET con filtros opcionales: ?negocio=<id>&estado=pendiente
  async getAlertas(q) {
    const filtro = {};
    if (q.negocio) filtro.negocio_id = validarId(q.negocio, 'negocio');
    if (q.estado) {
      if (!ESTADOS.includes(String(q.estado))) throw errorDeEntrada('estado debe ser: pendiente, atendida o descartada');
      filtro.estado = String(q.estado);
    }
    return await Alerta.find(filtro).sort({ creada_en: -1 });
  }

  async getAlerta(id) {
    return await Alerta.findById(validarId(id));
  }

  // Solo se permite cambiar el ESTADO. Las alertas las crea el análisis NLP,
  // la API no puede crearlas, borrarlas ni cambiar su contenido.

  async cambiarEstado(id, estado) {
    if (!ESTADOS.includes(String(estado))) {
      throw errorDeEntrada('Debe enviar "estado": pendiente, atendida o descartada');
    }
    const cambios = {
      estado: String(estado),
      atendida_en: estado === 'pendiente' ? null : new Date(),
    };
    return await Alerta.findByIdAndUpdate(validarId(id), { $set: cambios },
      { returnDocument: 'after', runValidators: true });
  }
}

module.exports = new AlertaService();