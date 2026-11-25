# Proyecto Final 

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
    └── 03_crear_roles_usuarios.js  ← roles y usuarios de la API, NLP y lectura
```



> Los scripts piden las contraseñas por teclado con `passwordPrompt()`. Por eso hay que
> ejecutarlos con **mongosh en PowerShell**, no en la consola integrada de Compass.

## Pasos de instalación

Abra PowerShell **en la carpeta del proyecto**: en el Explorador, clic derecho en la carpeta → *Abrir en Terminal*.

### Paso 1 – Crear el administrador (con la autenticación todavía desactivada)

usar archivo 01_crear_admin.js

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
   Restart-Service MongoDBRestart-Service MongoDB
   ```

### Paso 3 – Crear las colecciones

```powershell
mongosh "mongodb://127.0.0.1:27017/?authSource=admin" -u adminProyecto -p 

02_crear_colecciones.js
```

El comando pide la contraseña del administrador. Al final debe decir `Total de colecciones: 14`.

### Paso 4 – Crear los roles y usuarios

```powershell
mongosh "mongodb://127.0.0.1:27017/?authSource=admin" -u adminProyecto -p 

03_crear_roles_usuarios.js
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

Luego pasamos a VScode

1 - nlp/01_cargar_resenas.ipynb (Python): carga los 4 negocios y las 205 reseñas.

2- 04_cargar_catalogos.js (mongosh, como adminProyecto): carga temas, palabras clave, recomendaciones y categorías.

3- nlp/02_analisis_nlp.ipynb (Python): hace el análisis NLP.

Luego creamos la API

Por Ultimo el Front



