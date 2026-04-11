import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';
import { connectMongo, connectRedis } from './config/db';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { setupSwagger } from './swagger';

dotenv.config();

const app = express();

const bootstrap = async () => {
  // DB connections
  await connectMongo();
  await connectRedis();

  // Middleware
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(pinoHttp());

  // Mount Swagger
  setupSwagger(app);

  // Routes
  app.use('/api/v1/admin', routes);

  // Error handle
  app.use(errorHandler);

  const port = process.env.PORT || 4001;
  app.listen(port, () => {
    console.log(`🚀 Consolidated Admin Service running on port ${port}`);
  });
};

bootstrap();
