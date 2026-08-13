import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from '@fastify/compress';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { SanitizationPipe } from './shared/pipes/sanitization.pipe';

/**
 * Aura Platform — Foundation Backend Bootstrap
 *
 * Inicializa o servidor NestJS com Fastify, OpenAPI, ValidationPipe,
 * GlobalExceptionFilter, LoggingInterceptor e configurações de segurança.
 *
 * Arquitetura: Clean Architecture + DDD + CQRS
 * Referências: P102 (AEBPF), P125 (AEAP), P128 (AECS), P131 (AFPI), OWASP Top 10
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
      },
      trustProxy: true,
    }),
    { bufferLogs: true },
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // ── Security Headers & CSP (@fastify/helmet) ──────────────────────────────────
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        connectSrc: [`'self'`],
        fontSrc: [`'self'`, 'data:'],
        objectSrc: [`'none'`],
        mediaSrc: [`'self'`],
        frameSrc: [`'none'`],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
  });

  // ── Compression ──────────────────────────────────────────────────────────────
  await app.register(compression, { encodings: ['gzip', 'br'] });

  // ── API Versioning ────────────────────────────────────────────────────────────
  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // ── CORS ──────────────────────────────────────────────────────────────────────
  const allowedOrigins = configService
    .get<string>('CORS_ORIGINS', 'http://localhost:3000')
    .split(',');
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Tenant-ID',
      'X-Client-Version',
    ],
    credentials: true,
    maxAge: 86400,
  });

  // ── Global Validation & Sanitization Pipes ────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false,
    }),
    new SanitizationPipe(),
  );

  // ── Global Filters & Interceptors ─────────────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ── Graceful Shutdown ─────────────────────────────────────────────────────────
  app.enableShutdownHooks();

  // ── Swagger / OpenAPI 3.1 ────────────────────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Aura Platform API')
      .setDescription(
        'API REST corporativa da Plataforma Aura — Instituto Ser Melhor. ' +
          'Documentação completa em conformidade com OpenAPI 3.1, OAuth 2.1 e RFC 7807.',
      )
      .setVersion('1.0.0')
      .setContact('Instituto Ser Melhor', 'https://sermelhor.org.br', 'ti@sermelhor.org.br')
      .setLicense('Private', 'https://sermelhor.org.br/legal')
      .addServer(`http://localhost:${port}`, 'Desenvolvimento Local')
      .addServer('https://api.staging.aura.sermelhor.org.br', 'Staging')
      .addServer('https://api.aura.sermelhor.org.br', 'Produção')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'access-token',
      )
      .addTag('Health', 'Liveness, Readiness e Métricas')
      .addTag('Auth', 'Autenticação OAuth 2.1 e Gestão de Sessões')
      .addTag('Beneficiary', 'Gestão de Beneficiários e Cidadãos')
      .addTag('Professional', 'Gestão de Profissionais e Voluntários')
      .addTag('Clinical', 'Prontuário Eletrônico e Gestão Clínica')
      .addTag('Social', 'Gestão de Casos e Serviço Social')
      .addTag('Audit', 'Trilha de Auditoria e Conformidade')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
      },
    });

    logger.log(`📚 Swagger disponível em http://localhost:${port}/${apiPrefix}/docs`);
  }

  // ── Server Start ──────────────────────────────────────────────────────────────
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Aura Backend iniciado em http://localhost:${port}`);
  logger.log(`🌍 Ambiente: ${nodeEnv.toUpperCase()}`);
  logger.log(`📡 API Prefix: /${apiPrefix}/v1`);
  logger.log(`🔒 CORS Origins: ${allowedOrigins.join(', ')}`);
}

bootstrap().catch((error: unknown) => {
  console.error('❌ Falha crítica no bootstrap da aplicação:', error);
  process.exit(1);
});
