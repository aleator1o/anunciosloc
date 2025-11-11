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
        ProfileAttributeCreate: {
          type: "object",
          required: ["key", "value"],
          properties: {
            key: { type: "string" },
            value: { type: "string" },
          },
        },
        PresenceUpdate: {
          type: "object",
          properties: {
            latitude: { type: "number" },
            longitude: { type: "number" },
            wifiIds: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
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
            policyType: {
              type: "string",
              enum: ["WHITELIST", "BLACKLIST"],
              default: "WHITELIST",
            },
            policyRestrictions: {
              type: "array",
              items: {
                type: "object",
                required: ["key", "value"],
                properties: {
                  key: { type: "string" },
                  value: { type: "string" },
                },
              },
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

