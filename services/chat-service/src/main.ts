import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db';
import { connectRedis } from './config/redis'; // Moved to top
import { errorHandler } from './middlewares/errorHandler';
import { chatRoutes } from './modules/chat/chat.routes';
import { setupSocketIO } from './modules/chat/socket/chat.gateway';
import { setupSwagger } from './swagger';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Startup sequence
const bootstrap = async () => {
  try {
    await connectDB();
    await connectRedis();

    app.use(helmet());
    app.use(cors({ origin: true, credentials: true }));
    app.use(express.json());
    app.use(cookieParser());

    // Mount Swagger
    setupSwagger(app);

    // Mount Routes
    app.use('/api/v1/chat', chatRoutes);

    // Error Handler
    app.use(errorHandler);

    // Setup massive-scale WebSockets via Redis Backplane
    await setupSocketIO(httpServer);

    const port = process.env.PORT || 3003;
    httpServer.listen(port, () => {
      console.log(`🚀 Chat Service (HTTP + Socket.IO) running on port ${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start Chat Service:', error);
    process.exit(1);
  }
};

bootstrap();
