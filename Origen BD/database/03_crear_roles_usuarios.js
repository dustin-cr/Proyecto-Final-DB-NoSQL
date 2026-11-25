// =====================================================================
// 03_crear_roles_usuarios.js
// Crea roles con el minimo de permisos necesarios (principio de menor
// privilegio) y un usuario de base de datos para cada componente:
//
//   api_resenas    --- la API en Node.js
//   nlp_resenas    --- los scripts de Python para carga y análisis NLP
//   lector_resenas --- consultas y demostraciones solo para lectura
//
// Se ejecuta desde usuario administrador:
//   mongosh "mongodb://127.0.0.1:27017/?authSource=admin" -u adminProyecto -p 
//
// Las contraseñas se piden por teclado y nunca quedan en este archivo.
// Se puede  ejecutarlo varias vecessi es necesario, actualiza los roles y omite los
// usuarios que ya existen.
// =====================================================================

(() => {
  const DB_NAME = 'resenas_nlp';
  const base = db.getSiblingDB(DB_NAME);

  const TODAS = [
    'negocios', 'categorias_negocio', 'resenas', 'importaciones',
    'analisis_sentimiento', 'temas', 'palabras_clave', 'temas_detectados',
    'modelos', 'reportes', 'alertas', 'recomendaciones', 'usuarios', 'bitacora_api'
  ];
  const CON_DATOS_PERSONALES = ['usuarios', 'bitacora_api'];

  const permiso = (colecciones, acciones) =>
    colecciones.map(c => ({ resource: { db: DB_NAME, collection: c }, actions: acciones }));

  const roles = {
    // API: lee todo; administra catálogos, usuarios y negocios; solo puede
    // cambiar el estado de las alertas y solo agregar registros a la bitácora.
    rolApi: [
      ...permiso(TODAS, ['find']),
      ...permiso(['negocios', 'categorias_negocio', 'usuarios', 'temas',
                  'palabras_clave', 'recomendaciones'], ['insert', 'update', 'remove']),
      ...permiso(['alertas'], ['update']),
      ...permiso(['bitacora_api'], ['insert'])
    ],
    // NLP (Python): carga los negocios y reseñas de Takeout y guarda los
    // resultados del análisis. No puede borrar nada ni tocar usuarios,
    // bitácora ni catálogos.
    rolNlp: [
      ...permiso(TODAS.filter(c => !CON_DATOS_PERSONALES.includes(c)), ['find']),
      ...permiso(['negocios', 'resenas', 'importaciones', 'analisis_sentimiento',
                  'temas_detectados', 'modelos', 'reportes', 'alertas'], ['insert', 'update'])
    ],
    // Lectura: consultas y demostraciones, sin acceso a usuarios ni bitácora.
    rolLectura: [
      ...permiso(TODAS.filter(c => !CON_DATOS_PERSONALES.includes(c)), ['find'])
    ]
  };

  for (const [rol, privileges] of Object.entries(roles)) {
    if (base.getRole(rol)) {
      base.updateRole(rol, { privileges, roles: [] });
      print(`  ✓ rol ${rol} actualizado`);
    } else {
      base.createRole({ role: rol, privileges, roles: [] });
      print(`  ✓ rol ${rol} creado`);
    }
  }

  const usuarios = [
    { user: 'api_resenas', rol: 'rolApi' },
    { user: 'nlp_resenas', rol: 'rolNlp' },
    { user: 'lector_resenas', rol: 'rolLectura' }
  ];

  for (const u of usuarios) {
    if (base.getUser(u.user)) {
      base.grantRolesToUser(u.user, [{ role: u.rol, db: DB_NAME }]);
      print(`  - ${u.user} ya existe (se confirmó su rol ${u.rol})`);
      continue;
    }
    print(`\nContraseña para ${u.user} (mínimo 12 caracteres, distinta a las demás):`);
    const pwd = passwordPrompt();
    if (!pwd || pwd.length < 12) {
      throw new Error(`La contraseña de ${u.user} debe tener al menos 12 caracteres.`);
    }
    base.createUser({ user: u.user, pwd, roles: [{ role: u.rol, db: DB_NAME }] });
    print(`  ✓ usuario ${u.user} creado con el rol ${u.rol}`);
  }

  print('\nListo. Guarde cada contraseña solo en el archivo .env del componente que la usa.');
})();
