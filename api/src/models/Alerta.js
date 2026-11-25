// src/models/Alerta.js

const mongoose = require('mongoose');

const AlertaSchema = new mongoose.Schema({

  negocio_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  resena_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  tema_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  tipo: { type: String, enum: ['resena_negativa', 'aumento_problema'], required: true },
  estado: { type: String, enum: ['pendiente', 'atendida', 'descartada'], default: 'pendiente' },
  mensaje: { type: String },
  creada_en: { type: Date, default: Date.now },
  atendida_en: { type: Date, default: null },
  atendida_por: { type: mongoose.Schema.Types.ObjectId, default: null },

}, { collection: 'alertas', versionKey: false });

module.exports = mongoose.model('Alerta', AlertaSchema);