import swaggerJsdoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AnunciosLoc API",
      version: "1.0.0",
      description: "Documentação dos endpoints da API AnunciosLoc",
    },
    servers: [{ url: "http://localhost:4000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        LocationCreate: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            latitude: { type: "number" },
            longitude: { type: "number" },
            radiusMeters: { type: "integer" },
            type: {
              type: "string",
              enum: ["GEO", "WIFI", "BLE"],
            },
            identifiers: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
        AnnouncementCreate: {
          type: "object",
          required: ["content"],
          properties: {
            content: { type: "string" },
            locationId: { type: "string", format: "uuid" },
            visibility: {
              type: "string",
              enum: ["PUBLIC", "PRIVATE"],
            },
            deliveryMode: {
              type: "string",
              enum: ["CENTRALIZED", "DECENTRALIZED"],
            },
            startsAt: { type: "string", format: "date-time" },
            endsAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/**/*.ts"],
});

