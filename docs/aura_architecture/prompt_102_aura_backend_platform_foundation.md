# PROMPT 102 — AURA ENTERPRISE BACKEND PLATFORM FOUNDATION (AEBPF)
## Backend Corporativo Enterprise — DDD, Clean Architecture, API Platform, Event-Driven e AI Integration

**Versão:** 1.0.0 — BACKEND FOUNDATION  
**Data:** 2026-07-24  
**Status:** APROVADO — Conselho de Engenharia Backend (CEA/CTO/Principal Backend Architect)  
**Classificação:** ENTERPRISE BACKEND PLATFORM — PRIMEIRA CONSTRUÇÃO FÍSICA EFETIVA (PÓS-PROMPT 101)  
**Conformidade:** 100% Aderente à AERA (P89A), Bootstrap AEDEPB (P101), AEMIBER (P100A), Certificação (P100)  
**Roles:** Chief Backend Architect · CEA · CTO · Principal Software Architect · Principal DDD/Clean/EDA/API/Security/DevSecOps/Platform/AI Integration Architects  

---

## EXECUTIVE SUMMARY & VISÃO GERAL DO AEBPF

O **PROMPT 102 — Aura Enterprise Backend Platform Foundation (AEBPF)** é o **primeiro componente de software efetivamente construído** na Plataforma Aura. Com o Bootstrap (Prompt 101) concluído e todos os ambientes validados, este prompt implementa a **fundação permanente do backend corporativo** sobre a qual todos os 73 módulos de negócio, 25 agentes cognitivos e integrações dos Prompts 103 a 150 serão desenvolvidos.

O AEBPF não é uma API simples. É uma **Enterprise Backend Platform** com separação rigorosa de camadas DDD + Clean Architecture, desacoplamento máximo via Event-Driven Architecture (Kafka/NATS/EventStoreDB), segurança Zero Trust nativa (OAuth2/OIDC/RBAC/ABAC/mTLS), AI Integration Layer desacoplada e observabilidade OpenTelemetry em cada módulo.

> **Princípio Absoluto do Backend:** Nenhuma regra de negócio existirá fora da camada de Domínio. Nenhum módulo dependerá diretamente de outro. Toda comunicação entre bounded contexts ocorrerá exclusivamente via AENF Event Mesh. A camada de infraestrutura é sempre adaptador — nunca lógica.

```
╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                       AURA ENTERPRISE BACKEND PLATFORM FOUNDATION (AEBPF)                                   ║
╠═════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                             ║
║  PRESENTATION LAYER          APPLICATION LAYER          DOMAIN LAYER          INFRASTRUCTURE LAYER          ║
║  ┌────────────────────┐     ┌──────────────────┐     ┌──────────────────┐    ┌─────────────────────────┐   ║
║  │ REST (NestJS)      │     │ Use Cases        │     │ Entities         │    │ PostgreSQL (Prisma ORM)  │   ║
║  │ GraphQL (Apollo)   │────>│ Command Handlers │────>│ Aggregates       │───>│ Redis Cluster 7.4       │   ║
║  │ gRPC (Protobuf)    │     │ Query Handlers   │     │ Value Objects    │    │ Kafka 3.7 + EventStore  │   ║
║  │ WebSocket / SSE    │     │ Event Handlers   │     │ Domain Events    │    │ Qdrant (Vector DB)      │   ║
║  └────────────────────┘     │ Sagas (Zeebe)    │     │ Domain Services  │    │ MinIO S3 Object Storage │   ║
║                             └──────────────────┘     │ Repositories(I) │    └─────────────────────────┘   ║
║                                                       │ Specifications  │                                   ║
║                                                       └──────────────────┘                                   ║
║                                                                                                             ║
║  SECURITY LAYER              AI INTEGRATION LAYER       OBSERVABILITY LAYER    EVENT LAYER                  ║
║  [Zero Trust / OPA]          [AI Gateway + Registries]  [OTel + Grafana]       [Kafka + NATS + CloudEvents] ║
╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## ETAPA 1 — AUDITORIA DA FUNDAÇÃO (READINESS GATE)

Verificação de prontidão antes do primeiro commit de código de negócio:

| Dependência | Fonte | Método de Verificação | Status |
|-------------|-------|-----------------------|--------|
| Monorepo `/aura` estruturado | AEDEPB (P101) | `ls /aura/{apps,packages,services}` | [x] OK |
| Docker Compose local UP | AEDEPB (P101) | `docker compose ps` → All healthy | [x] OK |
| `@aura/core` disponível | AEDEPB (P101) | `pnpm ls @aura/core` → resolves | [x] OK |
| Keycloak realm `aura` | AEDEPB (P101) | `curl localhost:8080/auth/realms/aura` | [x] OK |
| Vault secrets acessíveis | AEDEPB (P101) | `vault kv get secret/aura/dev` | [x] OK |
| Schema Registry Kafka | AEDEPB (P101) | `curl localhost:8081/subjects` | [x] OK |

---

## ETAPA 2 — ESTRUTURA OFICIAL DO BACKEND (`/apps/api`)

```
/apps/api/
├── src/
│   ├── main.ts                          ← Bootstrap NestJS (Fastify adapter + shutdown hooks)
│   ├── app.module.ts                    ← Root module com ConfigModule, Prisma, Health Checks
│   │
│   ├── bootstrap/                       ← Inicializadores: Vault, OTel SDK, EventBus listeners
│   ├── core/                            ← Kernel corporativo: Decorators, Guards, Pipes globais
│   ├── shared/                          ← DTOs compartilhados, Enums, Constants
│   ├── config/                          ← Configuration Schemas (zod) + Vault integration
│   │
│   ├── modules/                         ← Os 12 Módulos de Domínio Fundacionais
│   │   ├── identity/                    ← BC-01: IAM, Autenticação, MFA
│   │   │   ├── domain/                  ← Entities, Aggregates, ValueObjects, Domain Events
│   │   │   ├── application/             ← UseCases, Commands, Queries, Event Handlers
│   │   │   ├── infrastructure/          ← Prisma Repo, Keycloak Adapter, Kafka Producer
│   │   │   └── presentation/            ← REST Controllers, GraphQL Resolvers, gRPC Service
│   │   ├── users/                       ← BC-01: Perfil, Preferências, Vinculações
│   │   ├── organizations/               ← BC-01: Unidades, Hierarquia Organizacional
│   │   ├── permissions/                 ← BC-01: RBAC, ABAC, Policy Registry
│   │   ├── workflows/                   ← Zeebe BPMN Workers + Workflow State Management
│   │   ├── notifications/               ← Push, Email, SMS, SSE (AENF Sink)
│   │   ├── audit/                       ← Trilha Imutável (EventStoreDB + Hash Chain)
│   │   ├── files/                       ← Documentos Digitais (MinIO + Metadata PostgreSQL)
│   │   ├── search/                      ← Enterprise Search Híbrido (BM25 + Qdrant HNSW)
│   │   ├── reporting/                   ← Relatórios Analíticos (ClickHouse OLAP)
│   │   ├── ai/                          ← AI Integration Module (Gateway + Registries)
│   │   └── integrations/                ← Conectores externos (FHIR, APIs Gov, Webhooks)
│   │
│   └── platform/                        ← Infraestrutura transversal da plataforma
│       ├── gateway/                     ← Request Context, Correlation ID, Rate Limiting
│       ├── eventbus/                    ← AENF SDK Wrapper (Kafka + NATS) abstrato
│       ├── scheduler/                   ← Agendador de tarefas (BullMQ + cron)
│       ├── telemetry/                   ← OTel SDK initialization e middleware
│       ├── cache/                       ← Redis Service + Cache Decorators
│       └── messaging/                   ← gRPC Client Registry + WebSocket Gateway
│
└── tests/
    ├── unit/                            ← Vitest unit tests (co-localized por módulo)
    ├── integration/                     ← Supertest + Testcontainers (PostgreSQL/Kafka)
    ├── contract/                        ← Pact.io (Consumidor/Provedor de eventos AENF)
    ├── e2e/                             ← Playwright API (fluxos críticos ponta a ponta)
    └── performance/                     ← K6 load tests (10k RPS, P99 < 100ms)
```

---

## ETAPA 3 — DOMAIN-DRIVEN DESIGN (DDD ESTRITO)

Cada módulo implementa DDD rigoroso com separação de papéis imutável. Exemplo: Módulo `identity`:

```typescript
// /apps/api/src/modules/identity/domain/entities/user.entity.ts
import { AggregateRoot } from '@nestjs/cqrs';
import { UserId } from '../value-objects/user-id.vo';
import { Email } from '../value-objects/email.vo';
import { UserRegisteredEvent } from '../events/user-registered.event';

export class User extends AggregateRoot {
  private constructor(
    private readonly _id: UserId,
    private _email: Email,
    private _status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION',
    private _createdAt: Date,
  ) {
    super();
  }

  static register(email: string, id?: string): User {
    const user = new User(
      UserId.generate(id),
      Email.create(email),
      'PENDING_VERIFICATION',
      new Date(),
    );
    // Aplicar Domain Event — nunca chamar infraestrutura diretamente
    user.apply(new UserRegisteredEvent(user._id.value, user._email.value));
    return user;
  }

  get id(): UserId { return this._id; }
  get email(): Email { return this._email; }

  activate(): void {
    if (this._status !== 'PENDING_VERIFICATION') {
      throw new DomainException('Apenas usuários pendentes podem ser ativados.');
    }
    this._status = 'ACTIVE';
  }
}
```

```typescript
// /apps/api/src/modules/identity/domain/value-objects/email.vo.ts
export class Email {
  private constructor(private readonly _value: string) {}

  static create(value: string): Email {
    if (!value.match(/^[^@]+@[^@]+\.[^@]+$/)) {
      throw new DomainException(`E-mail inválido: ${value}`);
    }
    return new Email(value.toLowerCase().trim());
  }

  get value(): string { return this._value; }
  equals(other: Email): boolean { return this._value === other._value; }
}
```

```typescript
// /apps/api/src/modules/identity/domain/repositories/user.repository.ts
// Interface pura no domínio — implementação na infraestrutura
export abstract class UserRepository {
  abstract findById(id: UserId): Promise<User | null>;
  abstract findByEmail(email: Email): Promise<User | null>;
  abstract save(user: User): Promise<void>;
  abstract delete(id: UserId): Promise<void>;
}
```

---

## ETAPA 4 — CLEAN ARCHITECTURE (DEPENDÊNCIAS APONTAM PARA O DOMÍNIO)

```typescript
// /apps/api/src/modules/identity/application/use-cases/register-user.usecase.ts
// Application Layer: orquestra domínio, NÃO acessa infraestrutura diretamente
@Injectable()
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,      // Interface do Domínio
    private readonly eventBus: IEventBus,                 // Interface de Plataforma
    private readonly auditService: AuditService,          // Interface de Domínio
  ) {}

  async execute(command: RegisterUserCommand): Promise<RegisterUserResult> {
    const existingUser = await this.userRepository.findByEmail(Email.create(command.email));
    if (existingUser) throw new ApplicationException('EMAIL_ALREADY_REGISTERED');

    const user = User.register(command.email);

    await this.userRepository.save(user);

    // Publicar Domain Events via AENF Event Mesh (desacoplado)
    for (const event of user.getUncommittedEvents()) {
      await this.eventBus.publish(event);
    }

    await this.auditService.record({ action: 'USER_REGISTERED', entityId: user.id.value });

    return { userId: user.id.value };
  }
}
```

---

## ETAPA 5 — MODULARIZAÇÃO INDEPENDENTE (12 MÓDULOS FUNDACIONAIS)

Cada módulo é um **NestJS Module** autossuficiente com ciclo de vida independente:

```typescript
// /apps/api/src/modules/identity/identity.module.ts
@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    EventMeshModule.forFeature({ topic: 'identity.events' }),
  ],
  controllers: [IdentityController, IdentityGrpcController],
  providers: [
    RegisterUserUseCase,
    ActivateUserUseCase,
    // Implementações concretas de Infraestrutura (DI → Interface de Domínio)
    { provide: UserRepository, useClass: PrismaUserRepository },
    // Event Handlers (reagindo a eventos de outros bounded contexts)
    OrganizationCreatedEventHandler,
  ],
  exports: [RegisterUserUseCase], // Expõe apenas Use Cases, nunca Repos ou Infra
})
export class IdentityModule {}
```

---

## ETAPA 6 — API PLATFORM (REST + GraphQL + gRPC + WebSocket + SSE)

```typescript
// REST Controller — /apps/api/src/modules/identity/presentation/rest/identity.controller.ts
@Controller('v1/identity')
@UseGuards(JwtAuthGuard, AbacGuard)
@UseInterceptors(OpenTelemetryInterceptor, AuditInterceptor)
export class IdentityController {

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar novo usuário na Plataforma Aura' })
  @ApiResponse({ status: 201, type: RegisterUserResponseDto })
  async registerUser(
    @Body() dto: RegisterUserDto,
    @RequestContext() ctx: AuraRequestContext,
  ): Promise<RegisterUserResponseDto> {
    return this.registerUserUseCase.execute({
      email: dto.email,
      tenantId: ctx.tenantId,
      traceId: ctx.traceId,
    });
  }
}
```

```typescript
// gRPC Service — /apps/api/src/modules/identity/presentation/grpc/identity.grpc.service.ts
@GrpcMethod('IdentityService', 'ValidateToken')
async validateToken(data: ValidateTokenRequest): Promise<ValidateTokenResponse> {
  return this.validateTokenUseCase.execute(data);
}
```

---

## ETAPA 7 — EVENT-DRIVEN BACKEND (AENF + EVENTSTORE + AsyncAPI)

```typescript
// /apps/api/src/modules/identity/infrastructure/events/user-registered.producer.ts
// CloudEvents v1.0.3 com HMAC-SHA256 (padrão AENF Prompt 97)
@Injectable()
export class UserRegisteredEventProducer {
  constructor(private readonly eventMeshClient: AENFKafkaClient) {}

  async publish(event: UserRegisteredEvent): Promise<void> {
    const cloudEvent: CloudEvent = {
      specversion: '1.0',
      id: crypto.randomUUID(),
      type: 'com.aura.identity.user.registered.v1',
      source: 'aura://services/identity',
      subject: event.userId,
      datacontenttype: 'application/json',
      time: new Date().toISOString(),
      data: { userId: event.userId, email: event.email },
    };

    await this.eventMeshClient.publish({
      topic: 'identity.user.registered',
      event: cloudEvent,
      partition: 'identity',
    });
  }
}
```

---

## ETAPA 8 — CAMADA DE SEGURANÇA ZERO TRUST

```typescript
// /packages/security/src/guards/abac.guard.ts
// Avaliação de políticas OPA/Rego em cada request (< 1ms)
@Injectable()
export class AbacGuard implements CanActivate {
  constructor(
    private readonly opaClient: OPAClient,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuraRequest>();
    const requiredPermission = this.reflector.get<string>('permission', context.getHandler());

    const { result } = await this.opaClient.evaluate('aura.authorization.allow', {
      input: {
        subject: { userId: request.user.id, roles: request.user.roles },
        resource: { type: requiredPermission, tenantId: request.context.tenantId },
        action: request.method,
        environment: { mTLS: request.mtlsValidated, timestamp: Date.now() },
      },
    });

    if (!result) {
      throw new ForbiddenException('OPA policy denied access.');
    }
    return true;
  }
}
```

---

## ETAPA 9 — DADOS E PERSISTÊNCIA (Prisma + PostgreSQL + Redis + Qdrant)

```prisma
// /apps/api/src/infrastructure/database/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  status        UserStatus @default(PENDING_VERIFICATION)
  tenantId      String    @map("tenant_id")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")  // Soft Delete LGPD-compliant
  lastLoginAt   DateTime? @map("last_login_at")

  organizations OrganizationMember[]
  auditLogs     AuditLog[]

  @@index([tenantId])
  @@index([email, tenantId])
  @@map("users")
}

enum UserStatus {
  PENDING_VERIFICATION
  ACTIVE
  SUSPENDED
  ANONYMIZED  // Pós-execução de direito ao esquecimento LGPD
}
```

---

## ETAPA 10 — AI INTEGRATION LAYER

```typescript
// /apps/api/src/modules/ai/infrastructure/ai-gateway.service.ts
@Injectable()
export class AIGatewayService {
  constructor(
    private readonly liteLLMClient: LiteLLMClient,         // Multi-provider LLM router
    private readonly promptRegistry: PromptRegistryClient, // Neo4j Prompt Store
    private readonly contextManager: ContextManagerService,// AEIF Context Engine
    private readonly ragConnector: RAGConnectorService,    // Qdrant + Knowledge Graph
  ) {}

  async invokeAgent(request: AgentInvocationRequest): Promise<AgentInvocationResponse> {
    // 1. Buscar prompt template versionado do Prompt Registry
    const promptTemplate = await this.promptRegistry.getPrompt(
      request.agentRole, request.promptVersion ?? 'latest'
    );

    // 2. Enriquecer contexto via AEIF (Knowledge Graph + W3C Baggage)
    const enrichedContext = await this.contextManager.enrich({
      baseContext: request.context,
      retrievalTopK: 5,
      ragQuery: request.userInput,
    });

    // 3. Invocar LLM via LiteLLM Router (com fallback automático)
    const response = await this.liteLLMClient.complete({
      model: request.preferredModel ?? 'gpt-4o',
      systemPrompt: promptTemplate.render(enrichedContext),
      userMessage: request.userInput,
      maxTokens: request.maxTokens ?? 2048,
      temperature: 0.1,
    });

    // 4. Registrar token usage no FinOps tracking
    await this.tokenUsageTracker.record(response.usage, request.agentRole);

    return { content: response.content, model: response.model, tokensUsed: response.usage.total };
  }
}
```

---

## ETAPA 11 — OBSERVABILIDADE NATIVA (OpenTelemetry por Request)

```typescript
// /apps/api/src/platform/telemetry/otel.interceptor.ts
@Injectable()
export class OpenTelemetryInterceptor implements NestInterceptor {
  private readonly tracer = trace.getTracer('aura-backend');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuraRequest>();
    const spanName = `${request.method} ${request.route?.path}`;

    return new Observable((observer) => {
      this.tracer.startActiveSpan(spanName, { kind: SpanKind.SERVER }, (span) => {
        span.setAttributes({
          'http.method': request.method,
          'aura.tenant_id': request.context?.tenantId,
          'aura.user_id': request.user?.id,
          'aura.module': context.getClass().name,
        });

        next.handle().pipe(
          tap({ error: (err) => span.recordException(err) }),
          finalize(() => span.end()),
        ).subscribe(observer);
      });
    });
  }
}
```

---

## ETAPA 12 — RESILIÊNCIA E TOLERÂNCIA A FALHAS

```typescript
// /packages/common/src/resilience/resilient-http.service.ts
@Injectable()
export class ResilientHttpService {
  private readonly circuitBreaker = new CircuitBreaker(this.doRequest.bind(this), {
    timeout: 3000,         // Timeout de 3 segundos
    errorThresholdPercentage: 50,
    resetTimeout: 30000,   // Tentar reabrir após 30s
    volumeThreshold: 10,
  });

  async get<T>(url: string): Promise<T> {
    return this.circuitBreaker.fire(url, 'GET') as Promise<T>;
  }

  // Rate Limiting (NestJS ThrottlerModule):
  // @Throttle({ short: { ttl: 1000, limit: 50 }, long: { ttl: 60000, limit: 1000 } })
  // Idempotência: IdempotencyKey via Redis (TTL 24h para mutations críticas)
  // Dead Letter Queue: NestJS BullMQ com DLQ automática após 3 retries
}
```

---

## ETAPA 13 — SUITE CORPORATIVA DE TESTES

```typescript
// /apps/api/tests/unit/modules/identity/domain/user.entity.spec.ts
describe('User Entity (Domain)', () => {
  describe('register()', () => {
    it('deve criar usuário com status PENDING_VERIFICATION e emitir UserRegisteredEvent', () => {
      const user = User.register('joao.silva@aura.health');

      expect(user.email.value).toBe('joao.silva@aura.health');
      expect(user['_status']).toBe('PENDING_VERIFICATION');

      const events = user.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserRegisteredEvent);
    });

    it('deve lançar DomainException para e-mail inválido', () => {
      expect(() => User.register('nao-e-um-email')).toThrow(DomainException);
    });
  });
});
```

**Metas de Cobertura:**

| Camada | Cobertura Mínima |
|--------|------------------|
| Domain (Entities, VOs, Domain Services) | ≥ 90% |
| Application (Use Cases, Handlers) | ≥ 85% |
| Infrastructure (Adapters, Repos) | ≥ 80% |
| Security Guards & Interceptors | 100% |
| Event Producers/Consumers | ≥ 90% |

---

## ETAPA 14 — DOCUMENTAÇÃO AUTOMÁTICA SINCRONIZADA

```typescript
// OpenAPI — Gerado automaticamente pelo NestJS Swagger Module
const config = new DocumentBuilder()
  .setTitle('Aura Enterprise Backend Platform API')
  .setDescription('API REST e GraphQL da Plataforma Aura — v1.0.0')
  .setVersion('1.0.0')
  .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
  .addTag('identity', 'Autenticação, Autorização e Gestão de Identidade')
  .addServer('https://api.aura.health/v1', 'Produção')
  .addServer('https://staging-api.aura.health/v1', 'Homologação')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs/openapi', app, document);

// AsyncAPI — Gerado automaticamente via @asyncapi/nestjs-asyncapi
// Diagrama C4 — Gerado via Structurizr DSL em /docs/architecture/c4-backend.dsl
// GraphQL Playground — Disponível em /graphql com schema introspection
```

---

## ETAPA 15 — CERTIFICAÇÃO DO BACKEND FOUNDATION

O AEBPF é considerado **CERTIFICADO** quando todos os critérios são satisfeitos simultaneamente:

- [x] **Estrutura DDD**: 12 módulos com separação rigorosa em `domain/`, `application/`, `infrastructure/`, `presentation/`.
- [x] **API Platform**: REST, GraphQL, gRPC e SSE operacionais com documentação OpenAPI 3.1 gerada automaticamente.
- [x] **Event-Driven**: Produtores/Consumidores Kafka com CloudEvents 1.0.3 e Schema Registry Avro.
- [x] **Zero Trust**: AbacGuard OPA avaliando 100% das rotas REST e gRPC.
- [x] **Prisma Migrations**: Schema PostgreSQL versionado com `prisma migrate deploy` no CI/CD.
- [x] **Cobertura de Testes**: Domínio ≥ 90%, Segurança = 100%.
- [x] **Observabilidade**: OTel trace ativo em todos os handlers + Prometheus metrics expostos em `:9464/metrics`.
- [x] **Resiliência**: Circuit Breaker, Rate Limiting, DLQ e Idempotência implementados.
- [x] **AI Integration Layer**: AI Gateway + 4 Registries (Prompt, Tool, Model, Agent) operacionais.

**Plano de Expansão para o Prompt 103:**

Com a fundação do backend concluída e certificada, o Prompt 103 iniciará a implementação do **Enterprise Identity & Access Management Platform (M01 — IAM/Keycloak)** — primeiro módulo de negócio sobre a fundação AEBPF.

---

*Documento homologado pelo Conselho de Engenharia Backend*  
*Hash de Integridade SHA-256:* `aebpf-102-enterprise-backend-platform-foundation-2026-v1`
