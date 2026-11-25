// src/app.js

const path = require('path');

// Lee el archivo .env que está en la carpeta principal del proyecto

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });

const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const negocioRoutes = require('./routes/NegocioRoutes');
const resenaRoutes = require('./routes/ResenaRoutes'); // Resenas
const alertaRoutes = require('./routes/AlertaRoutes');     // Alertas
const reporteRoutes = require('./routes/ReporteRoutes');   // Reportes

const app = express();

// Conectar a la base de datos
connectDB();

// Middleware
app.use(bodyParser.json());
// Front-end: sirve la carpeta public (index.html, app.js) en http://localhost:5000
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rutas
app.use('/api', negocioRoutes);
app.use('/api', resenaRoutes); //Resenas
app.use('/api', alertaRoutes);    // Alertas
app.use('/api', reporteRoutes);   // Reportes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));