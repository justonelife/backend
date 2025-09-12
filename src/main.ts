import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.enableCors({ origin: configService.get('CORS_ORIGIN') });
  app.use(helmet());

  // Versioning and Prefix
  app.setGlobalPrefix(configService.get('API_PREFIX'));
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Pipes
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger (OpenAPI)
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('NestJS API')
      .setDescription('API documentation for the NestJS application')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  // Graceful Shutdown
  app.enableShutdownHooks();

  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
