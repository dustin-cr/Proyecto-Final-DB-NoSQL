// =====================================================================
// 04_cargar_catalogos.js
// Carga los catálogos que usa el análisis NLP:
//   - temas (problemas o aspectos que mencionan los clientes)
//   - palabras_clave (términos que indican cada tema)
//   - recomendaciones (acción sugerida para cada tema)
//   - categorias_negocio (y asigna la categoría a cada negocio)
//
// Los catálogos los administra el administrador (o la API), no Python:
// por eso este script se ejecuta con adminProyecto.
//
//   mongosh "mongodb://127.0.0.1:27017/?authSource=admin" -u adminProyecto -p
//   (y se pega este archivo completo)
//
// Es seguro ejecutarlo varias veces: actualiza lo existente sin duplicar.
//
// Palabras clave: se escriben en minúscula y SIN tildes.
//   "rapido"     -> coincide solo con la palabra exacta "rapido"
//   "rapid*"     -> coincide con cualquier palabra que empiece así
//                   (rapido, rapida, rapidez, rapidos...)
//   "a tiempo"   -> también se permiten frases
// =====================================================================

(() => {
  const base = db.getSiblingDB('resenas_nlp');

  const TEMAS = [
    {
      nombre: 'Rapidez y tiempo de espera',
      descripcion: 'Velocidad del servicio, puntualidad y tiempos de espera o entrega.',
      palabras: ['rapid*', 'lent*', 'tard*', 'demor*', 'esper*', 'puntual*', 'a tiempo', 'quick*', 'slow'],
      recomendacion: { accion: 'Revisar los tiempos de atención en horas pico y reforzar el personal en esos horarios.', prioridad: 'alta' }
    },
    {
      nombre: 'Atención y trato del personal',
      descripcion: 'Amabilidad, actitud y profesionalismo de quienes atienden.',
      palabras: ['atencion', 'atend*', 'atiend*', 'amabl*', 'antipatic*', 'grit*', 'groser*', 'altaner*', 'trato*',
                 'personal', 'meser*', 'profesional*', 'servicio al cliente', 'staff', 'friendly'],
      recomendacion: { accion: 'Capacitar al personal en servicio al cliente y dar seguimiento a las quejas de trato.', prioridad: 'alta' }
    },
    {
      nombre: 'Calidad de la comida',
      descripcion: 'Sabor, frescura y preparación de los platillos.',
      palabras: ['comida*', 'sabor*', 'delicios*', 'rico', 'rica', 'ricos', 'ricas', 'exquisit*', 'salad*', 'amarg*',
                 'crud*', 'cocin*', 'platill*', 'plato*', 'ceviche*', 'seviche*', 'sopa*', 'fresc*', 'sazon', 'food'],
      recomendacion: { accion: 'Estandarizar recetas y revisar la preparación de los platillos con quejas.', prioridad: 'media' }
    },
    {
      nombre: 'Precio',
      descripcion: 'Percepción del costo y de la relación calidad-precio.',
      palabras: ['precio*', 'caro', 'cara', 'caros', 'caras', 'barat*', 'economic*', 'costo*', 'estafa*', 'budget'],
      recomendacion: { accion: 'Comparar precios con la competencia y comunicar mejor lo que incluye cada servicio.', prioridad: 'media' }
    },
    {
      nombre: 'Porciones y cantidad',
      descripcion: 'Tamaño de las porciones y cantidad recibida.',
      palabras: ['porcion*', 'cantidad*', 'generos*', 'serving*'],
      recomendacion: { accion: 'Definir porciones estándar por platillo y verificarlas antes de servir.', prioridad: 'baja' }
    },
    {
      nombre: 'Ambiente e instalaciones',
      descripcion: 'Lugar, música, iluminación, limpieza, parqueo y comodidad.',
      palabras: ['ambient*', 'musica', 'music', 'iluminacion', 'instalacion*', 'vista', 'olor', 'parqueo', 'limpi*',
                 'acogedor*', 'clima', 'environment'],
      recomendacion: { accion: 'Revisar la ambientación del local (música, iluminación, ventilación).', prioridad: 'baja' }
    },
    {
      nombre: 'Calidad del servicio o trabajo',
      descripcion: 'Cumplimiento, calidad del trabajo entregado y del servicio en general.',
      palabras: ['servicio*', 'trabajo*', 'acabado*', 'entrega*', 'pedido*', 'remodelacion*', 'calidad', 'cumplid*', 'eficient*'],
      recomendacion: { accion: 'Verificar el pedido o trabajo antes de entregarlo y dar seguimiento al cliente.', prioridad: 'media' }
    }
  ];

  const CATEGORIAS = [
    { nombre: 'Mensajería express', negocio: '4452794751047616077',
      temas: ['Rapidez y tiempo de espera', 'Atención y trato del personal', 'Precio', 'Calidad del servicio o trabajo'] },
    { nombre: 'Restaurante', negocio: '6176225006541180530',
      temas: ['Calidad de la comida', 'Atención y trato del personal', 'Rapidez y tiempo de espera', 'Precio',
              'Porciones y cantidad', 'Ambiente e instalaciones'] },
    { nombre: 'Construcción y remodelación', negocio: '14909255017997408569',
      temas: ['Calidad del servicio o trabajo', 'Atención y trato del personal', 'Precio', 'Rapidez y tiempo de espera'] },
    { nombre: 'Asociación solidarista', negocio: '15277915664842449345',
      temas: ['Atención y trato del personal', 'Calidad del servicio o trabajo'] }
  ];

  // ---------- temas, palabras clave y recomendaciones ----------
  const idTema = {};
  let totalPalabras = 0;
  for (const t of TEMAS) {
    base.temas.updateOne(
      { nombre: t.nombre },
      { $set: { descripcion: t.descripcion, activo: true } },
      { upsert: true }
    );
    const tema = base.temas.findOne({ nombre: t.nombre });
    idTema[t.nombre] = tema._id;

    for (const p of t.palabras) {
      base.palabras_clave.updateOne(
        { termino: p, tema_id: tema._id },
        { $set: { peso: 1.0 } },
        { upsert: true }
      );
      totalPalabras++;
    }

    base.recomendaciones.updateOne(
      { tema_id: tema._id },
      { $set: { accion: t.recomendacion.accion, prioridad: t.recomendacion.prioridad } },
      { upsert: true }
    );
    print(`  ✓ ${t.nombre} (${t.palabras.length} palabras clave)`);
  }

  // ---------- categorías y asignación a negocios ----------
  for (const c of CATEGORIAS) {
    base.categorias_negocio.updateOne(
      { nombre: c.nombre },
      { $set: { descripcion: null, temas_tipicos: c.temas.map(n => idTema[n]) } },
      { upsert: true }
    );
    const cat = base.categorias_negocio.findOne({ nombre: c.nombre });
    const r = base.negocios.updateOne({ google_location_id: c.negocio }, { $set: { categoria_id: cat._id } });
    print(`  ✓ categoría ${c.nombre}` + (r.matchedCount ? ' (asignada a su negocio)' : ' (negocio no encontrado)'));
  }

  print(`\nTemas: ${base.temas.countDocuments()}  |  Palabras clave: ${base.palabras_clave.countDocuments()}  |  ` +
        `Recomendaciones: ${base.recomendaciones.countDocuments()}  |  Categorías: ${base.categorias_negocio.countDocuments()}`);
})();
