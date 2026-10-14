import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
const cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { validateEnv } from './config/env.config';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // Validate environment variables on startup
  const env = validateEnv();

  const app = await NestFactory.create(AppModule);

  // Security & Cookie Middleware
  const cookieMiddleware = typeof cookieParser === 'function' ? cookieParser : (cookieParser as any).default;
  if (typeof cookieMiddleware === 'function') {
    app.use(cookieMiddleware());
  }
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'blob:', 'https:'],
        scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
      },
    },
  }));
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Branch-Id'],
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Centralized Error Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // OpenAPI Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('SAI SMART CUSTOMER VAULT API')
    .setDescription(
      'Official REST API for SAI TOURS & TRAVELS — AI-Powered Customer & Document Management System.\n\n' +
      'Head Office: Madurai, Tamil Nadu (+91 9894821561)\n' +
      'Branch Office: Trichy, Tamil Nadu (+91 9894619921)\n' +
      'Portal: https://www.saitravelservices.com/'
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT Access Token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('System Health', 'API liveness and diagnostic metrics')
    .addTag('Authentication', 'JWT and MFA authentication')
    .addTag('Customers', 'Customer CRM and relationship profiles')
    .addTag('Documents', 'Secure S3 document vault')
    .addTag('AI Engine', 'Document OCR, MRZ parser, and RAG search')
    .addTag('Reminders', 'Automated expiry alerts (180/90/30/7 days)')
    .addTag('Branches', 'Madurai and Trichy branch administration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'SAI Vault API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  await app.listen(env.PORT);
  logger.log(`🚀 SAI Vault API Server is running on: http://localhost:${env.PORT}/api/v1`);
  logger.log(`📚 OpenAPI Documentation available at: http://localhost:${env.PORT}/api/docs`);
}

bootstrap();
