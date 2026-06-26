import swaggerUi from "swagger-ui-express";

export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Hotel Casa Dolores API",
    version: "1.0.0",
    description: "API de servicios para el Hotel Casa Dolores Hidalgo",
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Servidor Local",
    },
    {
      url: "https://server-casa-dolores.onrender.com/api",
      description: "Servidor en la nube",
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Verifica el estado del servidor",
        responses: {
          "200": {
            description: "Respuesta exitosa",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export { swaggerUi };
