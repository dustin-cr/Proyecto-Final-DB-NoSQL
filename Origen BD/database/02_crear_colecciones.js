// =====================================================================
// 02_crear_colecciones.js
// Crea la base "resenas_nlp" con sus 14 colecciones, la validación de
// esquema ($jsonSchema) de cada una y sus índices.
//
// Se ejecuta con el usuario administrador, ya con la autenticación activa:
//   mongosh "mongodb://127.0.0.1:27017/?authSource=admin" -u adminProyecto -p --file database/02_crear_colecciones.js
//
// Es seguro ejecutarlo varias veces: si una colección ya existe, solo se
// actualiza su validador y se aseguran sus índices.
// =====================================================================

(() => {
  const DB_NAME = 'resenas_nlp';
  const base = db.getSiblingDB(DB_NAME);

  // ---------- tipos reutilizables ----------
  const texto = { bsonType: 'string' };
  const textoNoVacio = { bsonType: 'string', minLength: 1 };
  const textoOpcional = { bsonType: ['string', 'null'] };
  const fecha = { bsonType: 'date' };
  const fechaOpcional = { bsonType: ['date', 'null'] };
  const id = { bsonType: 'objectId' };
  const idOpcional = { bsonType: ['objectId', 'null'] };
  const numero = { bsonType: 'number' };
  const entero = { bsonType: ['int', 'long'] };
  const enteroNoNegativo = { bsonType: ['int', 'long'], minimum: 0 };
  const booleano = { bsonType: 'bool' };
  const probabilidad = { bsonType: 'number', minimum: 0, maximum: 1 };
  const SENTIMIENTOS = ['positivo', 'neutral', 'negativo'];

  // ---------- definición de colecciones ----------
  const colecciones = {

    negocios: {
      schema: {
        bsonType: 'object',
        required: ['nombre', 'google_location_id', 'activo', 'creado_en'],
        properties: {
          nombre: textoNoVacio,
          categoria_id: idOpcional,
          google_location_id: textoNoVacio,      // id del perfil en Google
          direccion: textoOpcional,
          calificacion_promedio: { bsonType: ['number', 'null'], minimum: 0, maximum: 5 },
          total_resenas: enteroNoNegativo,
          activo: booleano,
          creado_en: fecha
        }
      },
      indices: [
        { key: { google_location_id: 1 }, options: { unique: true, name: 'ux_google_location' } },
        { key: { nombre: 1 }, options: { name: 'ix_nombre' } }
      ]
    },

    categorias_negocio: {
      schema: {
        bsonType: 'object',
        required: ['nombre'],
        properties: {
          nombre: textoNoVacio,                   // restaurante, construcción, servicios...
          descripcion: textoOpcional,
          temas_tipicos: { bsonType: 'array', items: id }
        }
      },
      indices: [
        { key: { nombre: 1 }, options: { unique: true, name: 'ux_nombre' } }
      ]
    },

    resenas: {
      schema: {
        bsonType: 'object',
        required: ['negocio_id', 'google_review_id', 'estrellas', 'fecha_creacion'],
        properties: {
          negocio_id: id,
          importacion_id: idOpcional,
          google_review_id: textoNoVacio,         // evita cargar dos veces la misma reseña
          autor: textoOpcional,
          estrellas: { bsonType: ['int', 'long'], minimum: 1, maximum: 5 },
          comentario: textoOpcional,              // texto limpio, sin la traducción de Google
          fecha_creacion: fecha,
          fecha_actualizacion: fechaOpcional,
          respuesta: {
            bsonType: ['object', 'null'],
            properties: { comentario: texto, fecha: fechaOpcional }
          },
          nlp: {                                  // resultado incrustado para consultas rápidas
            bsonType: ['object', 'null'],
            properties: {
              sentimiento: { enum: SENTIMIENTOS },
              puntaje: probabilidad,
              temas: { bsonType: 'array', items: texto },      // temas mencionados
              problemas: { bsonType: 'array', items: texto },  // temas mencionados de forma negativa
              modelo_id: idOpcional,
              analizado_en: fecha
            }
          }
        }
      },
      indices: [
        { key: { google_review_id: 1 }, options: { unique: true, name: 'ux_google_review' } },
        { key: { negocio_id: 1, fecha_creacion: -1 }, options: { name: 'ix_negocio_fecha' } },
        { key: { negocio_id: 1, 'nlp.sentimiento': 1 }, options: { name: 'ix_negocio_sentimiento' } },
        { key: { 'nlp.temas': 1 }, options: { name: 'ix_temas' } }
      ]
    },

    importaciones: {
      schema: {
        bsonType: 'object',
        required: ['negocio_id', 'archivo', 'fecha', 'estado', 'total_cargadas'],
        properties: {
          negocio_id: id,
          archivo: textoNoVacio,
          fecha: fecha,
          estado: { enum: ['completada', 'con_errores', 'fallida'] },
          total_leidas: enteroNoNegativo,
          total_cargadas: enteroNoNegativo,
          total_duplicadas: enteroNoNegativo,
          errores: { bsonType: 'array', items: texto }
        }
      },
      indices: [
        { key: { negocio_id: 1, fecha: -1 }, options: { name: 'ix_negocio_fecha' } }
      ]
    },

    analisis_sentimiento: {
      schema: {
        bsonType: 'object',
        required: ['resena_id', 'sentimiento', 'puntaje', 'modelo_id', 'fecha'],
        properties: {
          resena_id: id,
          sentimiento: { enum: SENTIMIENTOS },
          puntaje: probabilidad,
          probabilidades: {
            bsonType: 'object',
            properties: { positivo: probabilidad, neutral: probabilidad, negativo: probabilidad }
          },
          modelo_id: id,
          fecha: fecha
        }
      },
      indices: [
        { key: { resena_id: 1, fecha: -1 }, options: { name: 'ix_resena_fecha' } },
        { key: { modelo_id: 1 }, options: { name: 'ix_modelo' } }
      ]
    },

    temas: {
      schema: {
        bsonType: 'object',
        required: ['nombre', 'activo'],
        properties: {
          nombre: textoNoVacio,                   // tiempo de espera, precio, atención...
          descripcion: textoOpcional,
          activo: booleano
        }
      },
      indices: [
        { key: { nombre: 1 }, options: { unique: true, name: 'ux_nombre' } }
      ]
    },

    palabras_clave: {
      schema: {
        bsonType: 'object',
        required: ['termino', 'tema_id'],
        properties: {
          termino: textoNoVacio,                  // en minúscula y sin tildes
          tema_id: id,
          peso: { bsonType: 'number', minimum: 0 }
        }
      },
      indices: [
        { key: { termino: 1, tema_id: 1 }, options: { unique: true, name: 'ux_termino_tema' } },
        { key: { tema_id: 1 }, options: { name: 'ix_tema' } }
      ]
    },

    temas_detectados: {
      schema: {
        bsonType: 'object',
        required: ['resena_id', 'tema_id', 'confianza', 'metodo', 'fecha'],
        properties: {
          resena_id: id,
          tema_id: id,
          fragmento: textoOpcional,
          sentimiento: { enum: SENTIMIENTOS },             // sentimiento del fragmento sobre ese tema
          confianza: probabilidad,
          metodo: { enum: ['palabras_clave', 'modelo'] },
          modelo_id: idOpcional,
          fecha: fecha
        }
      },
      indices: [
        { key: { resena_id: 1, tema_id: 1 }, options: { name: 'ix_resena_tema' } },
        { key: { tema_id: 1, fecha: -1 }, options: { name: 'ix_tema_fecha' } }
      ]
    },

    modelos: {
      schema: {
        bsonType: 'object',
        required: ['nombre', 'version', 'libreria', 'fecha', 'activo'],
        properties: {
          nombre: textoNoVacio,
          version: textoNoVacio,
          libreria: textoNoVacio,                 // pysentimiento, etc.
          parametros: { bsonType: 'object' },
          precision: { bsonType: ['number', 'null'], minimum: 0, maximum: 1 },
          fecha: fecha,
          activo: booleano
        }
      },
      indices: [
        { key: { nombre: 1, version: 1 }, options: { unique: true, name: 'ux_nombre_version' } }
      ]
    },

    reportes: {
      schema: {
        bsonType: 'object',
        required: ['negocio_id', 'periodo_inicio', 'periodo_fin', 'generado_en', 'total_resenas'],
        properties: {
          negocio_id: id,
          periodo_inicio: fecha,
          periodo_fin: fecha,
          generado_en: fecha,
          total_resenas: enteroNoNegativo,
          total_analizadas: enteroNoNegativo,              // reseñas con texto analizadas por NLP
          sentimiento_promedio: { bsonType: ['number', 'null'], minimum: -1, maximum: 1 },
          distribucion_sentimiento: {
            bsonType: 'object',
            properties: { positivo: enteroNoNegativo, neutral: enteroNoNegativo, negativo: enteroNoNegativo }
          },
          principales_problemas: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              required: ['tema_id', 'cantidad'],
              properties: { tema_id: id, tema: texto, cantidad: enteroNoNegativo }
            }
          }
        }
      },
      indices: [
        { key: { negocio_id: 1, periodo_inicio: -1 }, options: { name: 'ix_negocio_periodo' } }
      ]
    },

    alertas: {
      schema: {
        bsonType: 'object',
        required: ['negocio_id', 'tipo', 'estado', 'creada_en'],
        properties: {
          negocio_id: id,
          resena_id: idOpcional,
          tema_id: idOpcional,
          tipo: { enum: ['resena_negativa', 'aumento_problema'] },
          estado: { enum: ['pendiente', 'atendida', 'descartada'] },
          mensaje: textoOpcional,
          creada_en: fecha,
          atendida_en: fechaOpcional,
          atendida_por: idOpcional
        }
      },
      indices: [
        { key: { negocio_id: 1, estado: 1, creada_en: -1 }, options: { name: 'ix_negocio_estado' } }
      ]
    },

    recomendaciones: {
      schema: {
        bsonType: 'object',
        required: ['tema_id', 'accion', 'prioridad'],
        properties: {
          tema_id: id,
          accion: textoNoVacio,
          prioridad: { enum: ['alta', 'media', 'baja'] }
        }
      },
      indices: [
        { key: { tema_id: 1 }, options: { name: 'ix_tema' } }
      ]
    },

    usuarios: {
      schema: {
        bsonType: 'object',
        required: ['nombre', 'correo', 'password_hash', 'rol', 'activo', 'creado_en'],
        // Seguridad: prohíbe guardar una contraseña en texto plano.
        not: { anyOf: [{ required: ['password'] }, { required: ['contrasena'] }] },
        properties: {
          nombre: textoNoVacio,
          // En minúsculas (la API lo normaliza antes de guardar).
          correo: { bsonType: 'string', pattern: '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$' },
          // Solo se acepta un hash bcrypt (lo genera la API).
          password_hash: { bsonType: 'string', pattern: '^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$' },
          rol: { enum: ['administrador', 'dueno', 'encargado'] },
          negocios: { bsonType: 'array', items: id },
          activo: booleano,
          intentos_fallidos: enteroNoNegativo,
          bloqueado_hasta: fechaOpcional,
          ultimo_acceso: fechaOpcional,
          creado_en: fecha
        }
      },
      indices: [
        { key: { correo: 1 }, options: { unique: true, name: 'ux_correo' } }
      ]
    },

    bitacora_api: {
      schema: {
        bsonType: 'object',
        required: ['fecha', 'metodo', 'endpoint', 'codigo_estado'],
        properties: {
          fecha: fecha,
          usuario_id: idOpcional,
          metodo: { enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
          endpoint: textoNoVacio,
          codigo_estado: { bsonType: ['int', 'long'], minimum: 100, maximum: 599 },
          ip: textoOpcional,
          duracion_ms: { bsonType: ['number', 'null'], minimum: 0 }
        }
      },
      indices: [
        // Los registros se borran solos a los 180 días (minimiza datos personales guardados).
        { key: { fecha: 1 }, options: { expireAfterSeconds: 60 * 60 * 24 * 180, name: 'ttl_fecha_180d' } },
        { key: { usuario_id: 1, fecha: -1 }, options: { name: 'ix_usuario_fecha' } }
      ]
    }
  };

  // ---------- creación ----------
  const existentes = base.getCollectionNames();
  let creadas = 0, actualizadas = 0;

  for (const [nombre, def] of Object.entries(colecciones)) {
    const validator = { $jsonSchema: def.schema };
    if (existentes.includes(nombre)) {
      base.runCommand({ collMod: nombre, validator, validationLevel: 'strict', validationAction: 'error' });
      actualizadas++;
    } else {
      base.createCollection(nombre, { validator, validationLevel: 'strict', validationAction: 'error' });
      creadas++;
    }
    for (const ix of def.indices) {
      base.getCollection(nombre).createIndex(ix.key, ix.options);
    }
    print(`  ✓ ${nombre} (${def.indices.length} índice(s))`);
  }

  print(`\nBase "${DB_NAME}": ${creadas} colección(es) creada(s), ${actualizadas} actualizada(s).`);
  print(`Total de colecciones: ${base.getCollectionNames().length}`);
})();
