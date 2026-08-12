import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdirSync } from 'node:fs';

import { AppModule } from './app.module';
import {
  PUBLIC_ROOT,
  PUBLIC_URL_PREFIX,
  USER_AVATAR_UPLOAD_DIR,
} from './uploads/upload.constants';

async function bootstrap() {
  mkdirSync(USER_AVATAR_UPLOAD_DIR, { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.useStaticAssets(PUBLIC_ROOT, {
    prefix: `${PUBLIC_URL_PREFIX}/`,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Sun NestJS Tutorial')
    .setDescription('API documentation for Sun NestJS Tutorial')
    .setVersion('1.0')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api-docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
