import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { UserService } from './modules/user/services/user.service';
import { UpdateLastActiveInterceptor } from './core/middleware/update-last-active.middleware';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Valdori CRM API')
    .setDescription('Valdori CRM API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('customers', 'Customer management')
    .addTag('customer-dynamic-fields', 'Dynamic field management for customers')
    .addTag('products', 'Product management')
    .addTag('sales', 'Sales management')
    .addTag('roles', 'Role management')
    .addTag('locations', 'Country, State, City management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS ayarları
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://panel.goldcitycrm.com',
      'https://team.goldcitycrm.com',
      'http://localhost:8092',
      'http://goldcitycrm.com',
      'https://goldcitycrm.com',
      'https://www.goldcitycrm.com',
      'https://api.goldcitycrm.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: ['Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });


  // main.ts
  const userService = app.get(UserService);
  app.useGlobalInterceptors(new UpdateLastActiveInterceptor(userService));



  await app.listen(4000);
}
bootstrap();
