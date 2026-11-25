# Proyecto Final – Base de datos NoSQL (Grupo 8)

Base de datos MongoDB local para el análisis de reseñas de Google con NLP.

- Base de datos: `resenas_nlp`
- 14 colecciones con validación de esquema e índices
- Autenticación obligatoria y un usuario con permisos mínimos para cada componente

## Estructura de la carpeta

```
Proyecto Final DB NoSQL/
├── README.md                       ← este archivo
├── .env.example                    ← plantilla de conexiones (copiar a .env)
├── .gitignore                      ← evita subir contraseñas y datos reales
├── config/
│   └── mongod.cfg.ejemplo          ← configuración de seguridad del servidor
└── database/
    ├── 01_crear_admin.js           ← usuario administrador
    ├── 02_crear_colecciones.js     ← colecciones, validadores e índices
    ├── 03_crear_roles_usuarios.js  ← roles y usuarios de la API, NLP y lectura
    └── 04_cargar_catalogos.js      ← temas, palabras clave, recomendaciones y categorías
```

## Requisitos

1. **MongoDB Community Server** instalado como servicio de Windows.
2. **mongosh** (MongoDB Shell), que se descarga aparte del servidor:
   https://www.mongodb.com/try/download/shell
   Para verificarlo, ejecute `mongosh --version` en PowerShell.
3. **MongoDB Compass**, para ver los datos.

> Los scripts piden las contraseñas por teclado con `passwordPrompt()`. Por eso hay que
> ejecutarlos con **mongosh en PowerShell**, no en la consola integrada de Compass.

## Pasos de instalación

Abra PowerShell **en la carpeta del proyecto**: en el Explorador, clic derecho en la carpeta → *Abrir en Terminal*.

### Paso 1 – Crear el administrador (con la autenticación todavía desactivada)

```powershell
mongosh --file database/01_crear_admin.js
```

Escriba una contraseña de al menos 12 caracteres y guárdela en un lugar seguro, como un gestor de contraseñas.

### Paso 2 – Activar la autenticación

1. Abra el **Bloc de notas como administrador**: busque "Bloc de notas", clic derecho → *Ejecutar como administrador*.
2. Abra `C:\Program Files\MongoDB\Server\<versión>\bin\mongod.cfg`.
3. Deje las secciones `net` y `security` como en `config/mongod.cfg.ejemplo`:
   ```yaml
   net:
     port: 27017
     bindIp: 127.0.0.1

   security:
     authorization: enabled
   ```
   Use espacios para la sangría, nunca tabulaciones.
4. Guarde el archivo y reinicie el servicio desde **PowerShell como administrador**:
   ```powershell
   Restart-Service MongoDB
   ```
   Si ese comando falla, reinícielo desde `services.msc` → *MongoDB Server* → *Reiniciar*.

### Paso 3 – Crear las colecciones

```powershell
mongosh "mongodb://127.0.0.1:27017/?authSource=admin" -u adminProyecto -p --file database/02_crear_colecciones.js
```

El comando pide la contraseña del administrador. Al final debe decir `Total de colecciones: 14`.

### Paso 4 – Crear los roles y usuarios

```powershell
mongosh "mongodb://127.0.0.1:27017/?authSource=admin" -u adminProyecto -p --file database/03_crear_roles_usuarios.js
```

El script pide una contraseña distinta para cada usuario: `api_resenas`, `nlp_resenas` y `lector_resenas`.

### Paso 5 – Configurar las conexiones

1. Copie `.env.example` y renombre la copia a `.env`.
2. Reemplace cada `CAMBIAR` por la contraseña correspondiente.

### Paso 6 – Verificar que la seguridad funciona

```powershell
# Sin usuario: debe fallar con "requires authentication"
mongosh --quiet --eval "db.getSiblingDB('resenas_nlp').resenas.countDocuments()"

# Con el usuario de lectura: debe responder 0
mongosh "mongodb://127.0.0.1:27017/resenas_nlp?authSource=resenas_nlp" -u lector_resenas -p --quiet --eval "db.resenas.countDocuments()"

# El usuario de lectura no puede ver usuarios: debe fallar con "not authorized"
mongosh "mongodb://127.0.0.1:27017/resenas_nlp?authSource=resenas_nlp" -u lector_resenas -p --quiet --eval "db.usuarios.countDocuments()"
```

### Paso 7 – Cargar los catálogos del análisis NLP

Después de cargar las reseñas con `nlp/01_cargar_resenas.ipynb`, conéctese como `adminProyecto` y pegue el contenido de `database/04_cargar_catalogos.js`. Este script crea los temas, las palabras clave, las recomendaciones y las categorías de negocio. Los catálogos los administra el administrador, por eso no se cargan desde Python.

> Si su base se creó con una versión anterior de `02_crear_colecciones.js`, vuelva a pegarlo antes del paso 7. Así se actualizan los validadores con los campos nuevos del análisis (`nlp.problemas`, `temas_detectados.sentimiento` y `reportes.total_analizadas`).

### Conectarse desde Compass

*New connection* → *Advanced Connection Options* → *Authentication* → *Username/Password*:

| Para… | Usuario | Authentication Database |
|---|---|---|
| Administrar | `adminProyecto` | `admin` |
| Solo consultar | `lector_resenas` | `resenas_nlp` |

Para el trabajo diario y las demostraciones, use `lector_resenas`. Así nadie modifica datos por accidente.

## Medidas de seguridad aplicadas

| Medida | Dónde | Para qué |
|---|---|---|
| Autenticación obligatoria | `mongod.cfg` → `authorization: enabled` | Nadie entra sin usuario y contraseña. |
| Solo conexiones locales | `mongod.cfg` → `bindIp: 127.0.0.1` | La base no es accesible desde la red. |
| Menor privilegio | `03_crear_roles_usuarios.js` | Cada componente tiene solo los permisos que necesita. |
| Un usuario por componente | API, NLP y lectura | Si se filtra una contraseña, el daño queda limitado a ese rol. |
| Sin borrado en datos de análisis | `rolNlp` no tiene `remove` | Las reseñas y el historial del NLP no se pueden eliminar desde Python. |
| Datos personales protegidos | `rolNlp` y `rolLectura` sin acceso a `usuarios` ni `bitacora_api` | Solo la API ve correos y registros de acceso. |
| Bitácora inalterable | `rolApi` solo puede *insertar* en `bitacora_api` | Los registros de acceso no se pueden editar ni borrar. |
| Validación de esquema | `$jsonSchema` en las 14 colecciones | Rechaza documentos mal formados o con tipos incorrectos. |
| Contraseñas solo con hash | Validador de `usuarios` | Solo acepta un hash bcrypt y rechaza los campos `password` y `contrasena`. |
| Sin duplicados | Índices únicos (`google_review_id`, `correo`…) | Una reseña o un usuario no se puede cargar dos veces. |
| Retención limitada | Índice TTL en `bitacora_api` (180 días) | Los registros de acceso se borran solos y no se acumulan datos personales. |
| Contraseñas fuera del código | `passwordPrompt()` y archivo `.env` | Ninguna contraseña queda escrita en los scripts. |
| `.gitignore` | Raíz del proyecto | Evita subir `.env`, respaldos o datos de Takeout a GitHub. |

## Respaldo (opcional)

Requiere las [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools):

```powershell
mongodump --uri "mongodb://127.0.0.1:27017/?authSource=admin" -u adminProyecto -p --db resenas_nlp --archive=backups/resenas_nlp.archive --gzip
```

La carpeta `backups/` está excluida de Git porque contiene datos reales.
