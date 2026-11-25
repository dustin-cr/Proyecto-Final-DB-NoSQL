// src/models/Reporte.js
const mongoose = require('mongoose');

const ReporteSchema = new mongoose.Schema({

  negocio_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  periodo_inicio: { type: Date },
  periodo_fin: { type: Date },
  generado_en: { type: Date },
  total_resenas: { type: Number },
  total_analizadas: { type: Number },
  sentimiento_promedio: { type: Number },
  distribucion_sentimiento: {
    positivo: Number,
    neutral: Number,
    negativo: Number,
  },
  principales_problemas: [{
    _id: false,
    tema_id: mongoose.Schema.Types.ObjectId,
    tema: String,
    cantidad: Number,
  }],

}, { collection: 'reportes', versionKey: false });

module.exports = mongoose.model('Reporte', ReporteSchema);