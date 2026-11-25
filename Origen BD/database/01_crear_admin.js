// =====================================================================
// 01_crear_admin.js
// Crea el usuario administrador del proyecto.
//
// Se ejecuta una sola vez, antes de activar la autenticación en
// mongod.cfg.
//
// La contraseña se pide por teclado no se escribe en este archivo.
// =====================================================================

(() => {
  const ADMIN_USER = 'adminProyecto';
  const admin = db.getSiblingDB('admin');

  if (admin.getUser(ADMIN_USER)) {
    print(`El usuario ${ADMIN_USER} ya existe. No se hizo ningún cambio.`);
  } else {
    print(`Escriba la contraseña para ${ADMIN_USER} (mínimo 12 caracteres):`);
    const pwd = passwordPrompt();
    if (!pwd || pwd.length < 12) {
      throw new Error('La contraseña debe tener al menos 12 caracteres.');
    }
    admin.createUser({
      user: ADMIN_USER,
      pwd: pwd,
      roles: [
        { role: 'userAdminAnyDatabase', db: 'admin' }, // crear usuarios y roles
        { role: 'dbAdminAnyDatabase', db: 'admin' },   // colecciones, índices, validadores
        { role: 'readWriteAnyDatabase', db: 'admin' }  // cargar datos de prueba
      ]
    });
    print(`Usuario ${ADMIN_USER} creado en la base "admin".`);
    print('Siguiente paso: activar la autenticación en mongod.cfg y reiniciar el servicio.');
  }
})();
