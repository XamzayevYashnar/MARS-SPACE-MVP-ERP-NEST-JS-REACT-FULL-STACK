import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { join, resolve } from 'node:path';
import { AppModule } from './app.module';
import { JSON_BODY_LIMIT } from './common/constants/app.constants';
import { AppConfig } from './core/config/app.config';
import { StorageConfig } from './core/config/storage.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(PinoLogger));

  const configService = app.get(ConfigService);
  const appConfig = configService.getOrThrow<AppConfig>('app');
  const storageConfig = configService.getOrThrow<StorageConfig>('storage');

  // ── HTTP surface ───────────────────────────────────────────
  app.setGlobalPrefix(appConfig.apiPrefix, { exclude: ['health'] });

  app.use(cookieParser());
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });
  app.useBodyParser('urlencoded', { limit: JSON_BODY_LIMIT, extended: true });

  // ── Security ───────────────────────────────────────────────
  app.use(
    helmet({
      // Swagger UI needs inline styles/scripts; the API itself serves no HTML.
      contentSecurityPolicy: appConfig.isProduction ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: appConfig.corsOrigins.length > 0 ? appConfig.corsOrigins : false,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  });

  app.set('trust proxy', 1);

  // ── Validation ─────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      // 422 distinguishes "your payload is malformed" from a 400 raised by a
      // business rule, which is what §6.1 documents for VALIDATION_ERROR.
      errorHttpStatusCode: 422,
    }),
  );

  // ── Static uploads (local driver only) ─────────────────────
  if (storageConfig.driver === 'local') {
    app.useStaticAssets(resolve(process.cwd(), storageConfig.localPath), {
      prefix: '/uploads/',
      index: false,
      maxAge: '7d',
    });
  }

  setupSwagger(app, appConfig);

  app.enableShutdownHooks();

  await app.listen(appConfig.port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`Mars Space API listening on port ${appConfig.port}`);
  logger.log(`REST base path  → /${appConfig.apiPrefix}`);
  logger.log(`Swagger UI      → /api/docs`);
  logger.log(`Health probe    → /health`);
}

function setupSwagger(app: INestApplication, appConfig: AppConfig): void {
  const config = new DocumentBuilder()
    .setTitle('Mars Space LMS API')
    .setDescription(
      [
        'Backend of the Mars Space IT training centre.',
        '',
        'Every response is wrapped in the envelope described in the technical',
        'specification: `{ success, statusCode, data, meta?, timestamp }`.',
        'Errors return `{ success: false, statusCode, error: { code, message, details? }, path, timestamp }`.',
        '',
        'Public routes need no authentication. Admin routes live under',
        `\`/${appConfig.apiPrefix}/admin\` and require a bearer access token.`,
      ].join('\n'),
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addTag('Auth', 'Login, refresh, logout and the current profile')
    .addTag('Public', 'Unauthenticated content served to the marketing website')
    .addTag('Admin: Users', 'Staff accounts — SUPER_ADMIN only')
    .addTag('Admin: Categories', 'Course categories')
    .addTag('Admin: Courses', 'Course catalogue management')
    .addTag('Admin: Teachers', 'Teacher profiles')
    .addTag('Admin: Groups', 'Intakes and schedules')
    .addTag('Admin: Students', 'Enrolled students')
    .addTag('Admin: Leads', 'CRM-style lead pipeline')
    .addTag('Admin: Posts', 'News and blog')
    .addTag('Admin: Testimonials', 'Student reviews')
    .addTag('Admin: Messages', 'Contact-form inbox')
    .addTag('Admin: Settings', 'Site-wide settings bundle')
    .addTag('Admin: Uploads', 'Image uploads')
    .addTag('Admin: Statistics', 'Dashboard aggregates')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(join('api', 'docs').split('\\').join('/'), app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Mars Space API — docs',
  });
}

void bootstrap();
