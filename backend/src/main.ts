import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para todas las rutas: /api/...
  app.setGlobalPrefix('api');

  // Seguridad: cabeceras HTTP seguras
  app.use(helmet());

  // Manejo de errores de Prisma Global
  app.useGlobalFilters(new PrismaExceptionFilter());

  // CORS: permitir peticiones del frontend local
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Validación global de DTOs con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades extras
      transform: true,           // Transforma tipos automáticamente
    }),
  );

  const puerto = process.env.PORT || 3001;
  await app.listen(puerto);
  console.log(`🚀 Servidor HSE corriendo en http://localhost:${puerto}/api`);
}
bootstrap();
