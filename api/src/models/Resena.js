// src/models/Resena.js

const mongoose = require('mongoose');

const ResenaSchema = new mongoose.Schema({

  negocio_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  importacion_id: { type: mongoose.Schema.Types.ObjectId },
  google_review_id: { type: String, required: true },
  autor: { type: String },
  estrellas: { type: Number, min: 1, max: 5 },
  comentario: { type: String },
  fecha_creacion: { type: Date },
  fecha_actualizacion: { type: Date },
  respuesta: {
    comentario: { type: String },
    fecha: { type: Date },
  },
  nlp: {                                   // resultado del análisis (lo escribe Python)
    sentimiento: { type: String },
    puntaje: { type: Number },
    temas: [String],
    problemas: [String],
    modelo_id: { type: mongoose.Schema.Types.ObjectId },
    analizado_en: { type: Date },
  },

}, { collection: 'resenas', versionKey: false });

module.exports = mongoose.model('Resena', ResenaSchema);