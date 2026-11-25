# Origen BD – Creación y seguridad de la base de datos

Esta carpeta tiene todo lo necesario para crear la base **`resenas_nlp`** desde cero.

👉 **La guía completa, paso a paso, está en el [`README.md` de la carpeta principal](../README.md).**

## Orden de ejecución

| # | Archivo | Se pega en mongosh conectado como… | Qué hace |
|---|---|---|---|
| 1 | `database/01_crear_admin.js` | sin usuario (**antes** de activar la seguridad) | Crea `adminProyecto` |
| – | `config/mongod.cfg.ejemplo` | (se edita `mongod.cfg` y se reinicia el servicio) | Activa autenticación y solo conexiones locales |
| 2 | `database/02_crear_colecciones.js` | `adminProyecto` | Crea las 14 colecciones con validación e índices |
| 3 | `database/03_crear_roles_usuarios.js` | `adminProyecto` | Crea los roles y usuarios de la API, el NLP y lectura |
| – | `Ejemplo para variables de entorno/.env.example` | (se copia como `.env` en la carpeta principal) | Cadenas de conexión con las contraseñas |
| 4 | `database/04_cargar_catalogos.js` | `adminProyecto` (después del notebook `nlp/01`) | Carga temas, palabras clave, recomendaciones y categorías |

Todos los scripts se pueden ejecutar varias veces sin duplicar datos.
