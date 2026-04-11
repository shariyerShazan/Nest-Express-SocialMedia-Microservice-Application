import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Consolidated Admin Service API',
      version: '1.0.0',
      description: 'Moderation and staff management API for the Facebook Clone backend.',
    },
    servers: [
      {
        url: 'http://localhost:80/api/v1/admin',
        description: 'Gateway server',
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
  apis: ['./src/routes/*.ts', './src/modules/**/*.ts'],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api/v1/admin/docs', swaggerUi.serve, swaggerUi.setup(specs));
  console.log('📚 Admin Swagger Docs available at: /api/v1/admin/docs');
};
