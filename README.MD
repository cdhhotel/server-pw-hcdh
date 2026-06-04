#  Hotel Casa Dolores - Servidor API

Este es el backend del proyecto **Hotel Casa Dolores Hidalgo**, desarrollado en Node.js, Express y TypeScript, utilizando ES Modules (ESM) y PostgreSQL a través de Prisma 7.

---

##  Requisitos de Ejecución y Comandos

A continuación se detallan los comandos disponibles en el proyecto:

### Desarrollo local
Levanta el servidor con recarga automática en caliente (`hot-reload`) ante cualquier cambio en el código:
```bash
npm run dev
```

### Producción (Compilación e Inicio)
Compila el código TypeScript a JavaScript de manera limpia en el directorio `/dist` y ejecuta el servidor compilado:
```bash
# 1. Compilar el código
npm run build

# 2. Iniciar el servidor compilado
npm run start
```

### Comandos de Base de Datos (Prisma)
Generar el cliente de base de datos después de modificar el esquema:
```bash
npx prisma generate
```

Crear y aplicar una nueva migración de base de datos en desarrollo:
```bash
npx prisma migrate dev --name <nombre_migracion>
```

---

##  Estructura de Directorios y Archivos

El servidor está estructurado siguiendo principios de separación de responsabilidades y modularidad:

```text
servidor-casa-dolores/
├── prisma/
│   ├── schema.prisma       # Modelado de base de datos (Prisma Schema)
│   └── seed.ts             # Script de inicialización de datos de prueba
├── src/
│   ├── config/             # Configuración e inicialización de herramientas
│   │   ├── database.ts     # Cliente de base de datos y driver adapter
│   │   ├── env.ts          # Carga y tipado estricto de variables de entorno
│   │   ├── logger.ts       # Configuración global del logger de alto rendimiento
│   │   └── swagger.ts      # Documentación OpenAPI/Swagger de la API
│   ├── controllers/        # Controladores (Lógica de entrega/HTTP de la API)
│   ├── middlewares/        # Middlewares (Autenticación, errores, validaciones)
│   ├── repositories/       # Acceso a base de datos (Patrón Repository / Prisma Queries)
│   ├── routes/             # Definición de rutas y endpoints
│   │   └── index.ts        # Enrutador principal de la API
│   ├── validations/        # Esquemas de validación de datos de entrada (Zod)
│   ├── app.ts              # Configuración base de la aplicación Express
│   └── server.ts           # Inicialización y arranque del servidor HTTP
├── .env                    # Archivo de variables de entorno locales (Ignorado en Git)
├── .env.example            # Plantilla de variables de entorno requeridas
├── prisma.config.ts        # Configuración de base de datos para Prisma 7 CLI
├── package.json            # Dependencias y scripts del proyecto
└── tsconfig.json           # Configuración del compilador TypeScript
```

---

##  Explicación Detallada de Archivos Clave

###  Base de Datos y Prisma 7
*   **[prisma.config.ts](file:///c:/Users/danie/Documents/PROYECTOS/hotel-casa-dolores-hidalgo/servidor-casa-dolores/prisma.config.ts)**: *Configuración requerida por Prisma 7*. Debido a que las URLs de conexión ya no se declaran directamente en el archivo del esquema, este archivo centraliza la obtención de la base de datos para comandos del CLI como `prisma migrate`.
*   **[prisma/schema.prisma](file:///c:/Users/danie/Documents/PROYECTOS/hotel-casa-dolores-hidalgo/servidor-casa-dolores/prisma/schema.prisma)**: Aquí se definen los modelos de base de datos usando el DSL de Prisma. Está configurado para usar PostgreSQL.
*   **[src/config/database.ts](file:///c:/Users/danie/Documents/PROYECTOS/hotel-casa-dolores-hidalgo/servidor-casa-dolores/src/config/database.ts)**: Inicializa y exporta la instancia global de `PrismaClient`. En cumplimiento con Prisma 7, utiliza el adaptador `@prisma/adapter-pg` y una piscina de conexiones (`pg.Pool`) nativa de Node.js para mejorar el rendimiento del motor WASM TypeScript.

###  Configuración Global del Servidor
*   **[src/config/env.ts](file:///c:/Users/danie/Documents/PROYECTOS/hotel-casa-dolores-hidalgo/servidor-casa-dolores/src/config/env.ts)**: Carga las variables de entorno desde el archivo `.env` mediante `dotenv` y exporta un objeto `env` fuertemente tipado. Evita errores en tiempo de ejecución debido a variables faltantes.
*   **[src/config/logger.ts](file:///c:/Users/danie/Documents/PROYECTOS/hotel-casa-dolores-hidalgo/servidor-casa-dolores/src/config/logger.ts)**: Configura la librería de logging `pino`. Ofrece logs rápidos, formateados en JSON y estructurados según el entorno de ejecución (`development` vs `production`).
*   **[src/config/swagger.ts](file:///c:/Users/danie/Documents/PROYECTOS/hotel-casa-dolores-hidalgo/servidor-casa-dolores/src/config/swagger.ts)**: Centraliza la configuración de **OpenAPI 3.0**. Aquí se definen la información general del servidor y las especificaciones básicas de los endpoints de la API.

###  Express y Rutas
*   **[src/app.ts](file:///c:/Users/danie/Documents/PROYECTOS/hotel-casa-dolores-hidalgo/servidor-casa-dolores/src/app.ts)**: Configura la instancia de Express. 
    *   Registra middlewares globales de seguridad (`helmet`, `cors`, `express.json()`).
    *   Monta la UI de Swagger en los endpoints `/api-docs` y `/api/api-docs`.
    *   Monta las rutas principales bajo el prefijo `/api`.
    *   *Nota*: No inicia el servidor en ningún puerto (no llama a `listen()`), facilitando la realización de pruebas automatizadas en aislamiento.
*   **[src/server.ts](file:///c:/Users/danie/Documents/PROYECTOS/hotel-casa-dolores-hidalgo/servidor-casa-dolores/src/server.ts)**: El punto de entrada oficial. Importa la aplicación configurada desde `app.ts` y levanta el servidor HTTP escuchando en el puerto definido en las variables de entorno.
*   **[src/routes/index.ts](file:///c:/Users/danie/Documents/PROYECTOS/hotel-casa-dolores-hidalgo/servidor-casa-dolores/src/routes/index.ts)**: El enrutador Express maestro. Aquí se agrupan y delegan los diferentes módulos de rutas (por ejemplo, `/auth`, `/users`, `/rooms`, etc.).

---

##  Flujo de Desarrollo Sugerido para una Nueva API

Cuando vayas a crear un nuevo recurso o módulo (por ejemplo, "Habitaciones" - `Rooms`), sigue este orden recomendado:

1.  **Modelo**: Define el modelo `Room` en [prisma/schema.prisma](file:///c:/Users/danie/Documents/PROYECTOS/hotel-casa-dolores-hidalgo/servidor-casa-dolores/prisma/schema.prisma) y ejecuta `npx prisma migrate dev` para sincronizar tu base de datos y regenerar tipos.
2.  **Repository**: Crea `src/repositories/roomRepository.ts` para agrupar las consultas de Prisma específicas para las habitaciones.
3.  **Validation**: Define esquemas de Zod en `src/validations/roomValidation.ts` para verificar la información que envía el usuario (ej. datos de creación).
4.  **Controller**: Crea `src/controllers/roomController.ts` para manejar la petición HTTP, validar la entrada usando tu esquema de Zod, interactuar con el repositorio, y retornar la respuesta (JSON).
5.  **Routes**: Crea `src/routes/roomRoutes.ts`, define los endpoints (GET, POST, etc.) conectándolos a tus funciones del controlador, y regístralos en tu enrutador principal [src/routes/index.ts](file:///c:/Users/danie/Documents/PROYECTOS/hotel-casa-dolores-hidalgo/servidor-casa-dolores/src/routes/index.ts).
6.  **Docs**: Agrega la documentación OpenAPI en [src/config/swagger.ts](file:///c:/Users/danie/Documents/PROYECTOS/hotel-casa-dolores-hidalgo/servidor-casa-dolores/src/config/swagger.ts) para que el endpoint se visualice en Swagger UI.