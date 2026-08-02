import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { LoggerModule } from 'nestjs-pino';
import * as Joi from 'joi';

import { HealthModule } from './health/health.module';
import { EventBusModule } from './events/event-bus.module';
import { AuthModule } from './domain/auth/auth.module';
import { RegistrationModule } from './domain/registration/registration.module';
import { IntakeModule } from './domain/intake/intake.module';
import { CaseManagementModule } from './domain/case-management/case-management.module';
import { EhrModule } from './domain/ehr/ehr.module';
import { SchedulingModule } from './domain/scheduling/scheduling.module';
import { DocumentsModule } from './domain/documents/documents.module';
import { WorkflowModule } from './domain/workflow/workflow.module';
import { AnalyticsModule } from './domain/analytics/analytics.module';
import { AiModule } from './domain/ai/ai.module';
import { ObservabilityModule } from './domain/observability/observability.module';
import { OperationsModule } from './domain/operations/operations.module';
import { GovernanceModule } from './domain/governance/governance.module';
import { ContentManagementModule } from './domain/content-management/content-management.module';
import { CorporateUniversityModule } from './domain/corporate-university/corporate-university.module';
import { IntegrationModule } from './domain/integration/integration.module';
import { ArchitectureGovernanceModule } from './domain/architecture-governance/architecture-governance.module';
import { ProductionReadinessModule } from './domain/production-readiness/production-readiness.module';
import { MasterCertificationModule } from './domain/master-certification/master-certification.module';
import { InstitutionalIntelligenceModule } from './domain/institutional-intelligence/institutional-intelligence.module';
import { CognitiveOrchestrationModule } from './domain/cognitive-orchestration/cognitive-orchestration.module';

// ── Foundation Domain Modules ─────────────────────────────────────────────────
// TODO(Sprint 2): import { AuthModule } from './domain/auth/auth.module';
// TODO(Sprint 3): import { BeneficiaryModule } from './domain/beneficiary/beneficiary.module';
// TODO(Sprint 3): import { ProfessionalModule } from './domain/professional/professional.module';
// TODO(Sprint 5): import { ClinicalModule } from './domain/clinical/clinical.module';
// TODO(Sprint 6): import { SocialModule } from './domain/social/social.module';

import { AutonomousEvolutionModule } from './domain/autonomous-evolution/autonomous-evolution.module';
import { EnterpriseInteroperabilityModule } from './domain/enterprise-interoperability/enterprise-interoperability.module';
import { UnifiedOperationsModule } from './domain/unified-operations/unified-operations.module';
import { DigitalTwinModule } from './domain/digital-twin/digital-twin.module';
import { EnterpriseKnowledgeModule } from './domain/enterprise-knowledge/enterprise-knowledge.module';
import { DecisionIntelligenceModule } from './domain/decision-intelligence/decision-intelligence.module';

/**
 * AppModule — Módulo Raiz da Plataforma Aura
 *
 * Configura todos os módulos de infraestrutura e plataforma que servem
 * como fundação para todos os domínios de negócio.
 *
 * Referências: P102 (AEBPF), P124 (AEEDA), P131 (AFPI)
 */
@Module({
  imports: [
    // ── Environment & Config ───────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      expandVariables: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'staging', 'production')
          .default('development'),
        PORT: Joi.number().default(3001),
        API_PREFIX: Joi.string().default('api'),
        CORS_ORIGINS: Joi.string().default('http://localhost:3000'),

        // Database
        DATABASE_URL: Joi.string().uri().required(),

        // Redis
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().optional().allow(''),

        // JWT & IAM
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_EXPIRY: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
        KEYCLOAK_URL: Joi.string().uri().optional(),
        KEYCLOAK_REALM: Joi.string().optional().default('aura'),
        KEYCLOAK_CLIENT_ID: Joi.string().optional().default('aura-backend'),

        // Vault (opcional em dev)
        VAULT_ADDR: Joi.string().uri().optional(),
        VAULT_TOKEN: Joi.string().optional(),

        // AWS (opcional em dev)
        AWS_REGION: Joi.string().optional().default('us-east-1'),
        S3_BUCKET: Joi.string().optional(),
      }),
    }),

    // ── Structured Logging (Pino) ──────────────────────────────────────────────
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get('NODE_ENV') === 'production' ? 'info' : 'debug',
          transport:
            config.get('NODE_ENV') !== 'production'
              ? {
                  target: 'pino-pretty',
                  options: { colorize: true, singleLine: true },
                }
              : undefined,
          redact: {
            paths: [
              'req.headers.authorization',
              'req.body.password',
              'req.body.cpf',
              'req.body.token',
            ],
            censor: '[REDACTED]',
          },
          customProps: () => ({ service: 'aura-backend', version: '1.0.0' }),
        },
      }),
    }),

    // ── Rate Limiting ──────────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'short',
          ttl: 1000,
          limit: config.get('NODE_ENV') === 'production' ? 10 : 100,
        },
        {
          name: 'medium',
          ttl: 60000,
          limit: config.get('NODE_ENV') === 'production' ? 200 : 2000,
        },
        {
          name: 'long',
          ttl: 3600000,
          limit: config.get('NODE_ENV') === 'production' ? 1000 : 10000,
        },
      ],
    }),

    // ── Cache (Redis) ──────────────────────────────────────────────────────────
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD', ''),
          keyPrefix: 'aura:',
          db: 0,
        }),
        ttl: 300, // 5 minutos default
      }),
    }),

    // ── Event Emitter ──────────────────────────────────────────────────────────
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 50,
      verboseMemoryLeak: true,
    }),

    // ── Scheduled Tasks ────────────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Foundation Modules ─────────────────────────────────────────────────────
    HealthModule,
    EventBusModule,
    AuthModule,
    RegistrationModule,
    IntakeModule,
    CaseManagementModule,
    EhrModule,
    SchedulingModule,
    DocumentsModule,
    WorkflowModule,
    AnalyticsModule,
    AiModule,
    ObservabilityModule,
    OperationsModule,
    GovernanceModule,
    ContentManagementModule,
    CorporateUniversityModule,
    IntegrationModule,
    ArchitectureGovernanceModule,
    ProductionReadinessModule,
    MasterCertificationModule,
    InstitutionalIntelligenceModule,
    CognitiveOrchestrationModule,
    AutonomousEvolutionModule,
    EnterpriseInteroperabilityModule,
    UnifiedOperationsModule,
    DigitalTwinModule,
    EnterpriseKnowledgeModule,
    DecisionIntelligenceModule,
  ],
})
export class AppModule {}
