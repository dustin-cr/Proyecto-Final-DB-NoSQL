// src/models/Negocio.js

const mongoose = require('mongoose');

const NegocioSchema = new mongoose.Schema({

  nombre: { type: String, required: true },
  categoria_id: { type: mongoose.Schema.Types.ObjectId, default: null },
  google_location_id: { type: String, required: true },
  direccion: { type: String, default: null },
  calificacion_promedio: { type: Number, default: null },
  total_resenas: { type: Number, default: 0 },
  activo: { type: Boolean, default: true },
  creado_en: { type: Date, default: Date.now },

}, { collection: 'negocios', versionKey: false }); // Nombre de la colección en MongoDB

module.exports = mongoose.model('Negocio', NegocioSchema);