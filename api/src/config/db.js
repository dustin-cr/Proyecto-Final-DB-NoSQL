// src/config/db.js

const mongoose = require('mongoose');

// Las colecciones, validadores e índices ya los creó el administrador con los
//  El usuario de la API no tiene permiso para crearlos,
// así que le indicamos a mongoose que no lo intente.
mongoose.set('autoCreate', false);
mongoose.set('autoIndex', false);

const connectDB = async () => {

  try {
    // La cadena de conexión (con usuario y contraseña) se lee del archivo .env
    await mongoose.connect(process.env.MONGO_URI_API);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Error de conexión a MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;