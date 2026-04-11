import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Auth & User Service API',
      version: '1.0.0',
      description: 'Identity management and user profiles API for the microservices project.',
    },
    servers: [
      {
        url: 'http://localhost:80/api/v1',
        description: 'Gateway server',
      },
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Direct service port',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.ts', './src/main.ts'],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api/v1/auth/docs', swaggerUi.serve, swaggerUi.setup(specs));
  console.log('📚 Auth Swagger Docs available at: /api/v1/auth/docs');
};
