import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './filters/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  
  // Enable class-validator globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableCors({ origin: true, credentials: true });

  // Connect RabbitMQ Microservice Engine
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'notification_service_queue',
      queueOptions: {
        durable: true
      },
    },
  });

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('Notification Service')
    .setDescription('Microservice for handling real-time notifications via RabbitMQ and Socket.IO')
    .setVersion('1.0')
    .addTag('notifications')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  // Start BOTH Web Server and RabbitMQ listener
  await app.startAllMicroservices();
  
  const port = process.env.PORT || 3004;
  await app.listen(port);
  console.log(`🚀 Notification Service (HTTP + RabbitMQ) running on port ${port}`);
  console.log(`📑 Swagger docs available at http://localhost:${port}/api/v1/docs`);
}
bootstrap();
