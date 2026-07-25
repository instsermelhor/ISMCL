# PROMPT 104 — AURA ENTERPRISE MOBILE PLATFORM FOUNDATION (AEMPF)
## Plataforma Mobile Enterprise Android/iOS — Flutter, Offline First, AI Experience e Zero Trust

**Versão:** 1.0.0 — ENTERPRISE MOBILE PLATFORM FOUNDATION  
**Data:** 2026-07-24  
**Status:** APROVADO — Conselho de Engenharia Mobile e Experiência (CEA/CTO/CXO/Chief Mobile Architect)  
**Classificação:** ENTERPRISE MOBILE PLATFORM — CONSTRUÇÃO FÍSICA (PÓS-PROMPT 103 FRONTEND WEB)  
**Conformidade:** 100% Integrado ao AEXP (P103), AEBPF (P102), AEDEPB (P101), AERA (P89A), AENF (P97)  
**Roles:** Chief Mobile Architect · CEA · CTO · CXO · Principal Flutter/Mobile Security/Offline/AI Mobile/A11y/Performance/DevSecOps/Enterprise UX Architects  

---

## EXECUTIVE SUMMARY & VISÃO GERAL DA AEMPF

A **Aura Enterprise Mobile Platform Foundation (AEMPF)** é a **fundação oficial das aplicações móveis da Plataforma Aura** para Android e iOS. Integrada ao ecossistema construído nos Prompts 101 a 103 (Bootstrap, Backend e Frontend Web), a AEMPF implementa um nível de engenharia mobile enterprise raro: arquitetura **Offline First** com sincronização resiliente via AENF Event Mesh, segurança **Zero Trust** com biometria + PKCE + certificate pinning, **AI Experience Layer** com streaming de assistente e HITL, e **Mobile Design System** consistente com o `@aura/ui` web.

> **Princípio Fundador da AEMPF:** O app mobile não é um cliente HTTP. É uma **plataforma autônoma** capaz de operar completamente offline, sincronizar de forma resiliente, proteger dados sensíveis de saúde em armazenamento local criptografado e oferecer inteligência contextual ao cidadão — mesmo em regiões de conectividade limitada do Brasil.

```
╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                      AURA ENTERPRISE MOBILE PLATFORM FOUNDATION (AEMPF)                                     ║
╠═════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                             ║
║  MOBILE DESIGN SYSTEM       OFFLINE FIRST ENGINE          AI EXPERIENCE             ZERO TRUST SECURITY     ║
║  ┌────────────────────┐    ┌──────────────────────┐     ┌──────────────────────┐   ┌─────────────────────┐  ║
║  │ Design Tokens Dart  │    │ SQLite / Drift ORM    │     │ Chat com Streaming   │   │ OAuth2 PKCE OIDC    │  ║
║  │ ThemeData light/dark│    │ Hive Cache Layer      │     │ Voice Commands       │   │ Biometria FaceID    │  ║
║  │ 15+ Widgets Aura    │───>│ Operation Queue FIFO  │────>│ AI Suggestions       │──>│ flutter_secure_store│  ║
║  │ Adaptive Layouts    │    │ Conflict Resolution   │     │ HITL Approval        │   │ Certificate Pinning │  ║
║  │ Acessibilidade WCAG │    │ Background Sync       │     │ Explainability Panel │   │ Root Detection      │  ║
║  └────────────────────┘    └──────────────────────┘     └──────────────────────┘   └─────────────────────┘  ║
║                                        │                                                                    ║
║                          ┌─────────────▼─────────────────────────┐                                         ║
║                          │  SYNC ENGINE → AENF Neural Fabric (P97) │                                       ║
║                          │  WebSocket + REST + SSE (Resiliente)   │                                        ║
║                          └───────────────────────────────────────┘                                         ║
╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## ETAPA 1 — AUDITORIA DA FUNDAÇÃO (MOBILE READINESS GATE)

Verificação de pré-requisitos antes do primeiro commit Flutter:

| Dependência | Fonte | Verificação | Status |
|-------------|-------|-------------|--------|
| OpenAPI 3.1 spec | AEBPF P102 | Geração de client Dart via `openapi-generator-cli` | [x] OK |
| AsyncAPI AENF | AENF P97 | WebSocket/SSE endpoints documentados | [x] OK |
| Design Tokens exportados | AEXP P103 | `@aura/ui` tokens convertidos para Dart via `style-dictionary` | [x] OK |
| Keycloak OIDC realm `aura` | AEDEPB P101 | `/.well-known/openid-configuration` disponível | [x] OK |
| Firebase project configurado | AEDEPB P101 | `google-services.json` + `GoogleService-Info.plist` | [x] OK |

---

## ETAPA 2 — DECISÃO TECNOLÓGICA OFICIAL: FLUTTER 3.x

### Matriz Comparativa Técnica (Flutter vs. React Native)

| Dimensão | Flutter 3.x | React Native 0.74+ | Decisão |
|----------|-------------|---------------------|---------|
| **Performance de Renderização** | Impeller (Vulkan/Metal) 120fps nativo | JS Bridge + Fabric (melhora, mas overhead existe) | **Flutter** |
| **Consistência Visual iOS/Android** | 100% identical — widgets próprios | Componentes nativos por plataforma (diferenças visuais) | **Flutter** |
| **Integrações Nativas (saúde/biometria)**| Platform Channels (Dart ↔ Kotlin/Swift) | Turbo Modules (JS ↔ Kotlin/Swift) | Empate |
| **Segurança** | `flutter_secure_storage` (Keychain/KeyStore) | `react-native-keychain` | Empate |
| **Tamanho do APK/IPA** | ~8MB compressed (tree-shaking extremo) | ~10-15MB (JS bundle + bridge) | **Flutter** |
| **Startup Time** | ~600ms cold start (Impeller pré-compiled) | ~900ms (JS parsing no startup) | **Flutter** |
| **Testes** | `flutter_test`, `integration_test`, Maestro | Jest, Detox | Empate |
| **Ecossistema pub.dev** | 40k+ packages, maturidade crescente | NPM (acesso a todo JS) — maior volume | React Native |

**DECISÃO OFICIAL: Flutter 3.x (Dart)**  
Justificativa: Para a Plataforma Aura, que atende profissionais de saúde e cidadãos com listas clínicas complexas (DataGrids, Charts FHIR, biometria), a renderização 60/120fps sem bridge overhead e o startup < 600ms são determinantes. O ecossistema Flutter também oferece a melhor integração com HealthKit e Google Health Connect.

---

## ETAPA 3 — ESTRUTURA OFICIAL DA APLICAÇÃO FLUTTER (`/apps/mobile`)

```
/apps/mobile/
├── lib/
│   ├── main.dart                         ← Entry point (inicializa OTel, Crashlytics, DI, Vault)
│   ├── app/
│   │   ├── aura_app.dart                 ← MaterialApp.router + ThemeData + i18n Delegates
│   │   └── app_router.dart               ← GoRouter com Guards de autenticação e permissão
│   │
│   ├── core/                             ← Kernel da aplicação mobile
│   │   ├── di/                           ← Injeção de dependência (get_it + injectable)
│   │   ├── errors/                       ← Failures, Exceptions, Either<L,R> (dartz)
│   │   ├── usecases/                     ← Contrato abstrato UseCase<Type, Params>
│   │   └── network/                      ← Dio interceptors (Auth, Retry, Logging, OTel)
│   │
│   ├── config/                           ← Variáveis de ambiente (.env via flutter_dotenv)
│   │
│   ├── design_system/                    ← Mobile Design System (tokens + widgets)
│   │   ├── tokens/                       ← AuraColors, AuraTypography, AuraSpacing
│   │   ├── widgets/                      ← AuraButton, AuraInput, AuraCard, AuraDataTable...
│   │   └── themes/                       ← ThemeData light + dark + high_contrast
│   │
│   ├── features/                         ← Features de negócio (estrutura DDD)
│   │   ├── auth/                         ← Login PKCE, MFA, Biometria, Session Refresh
│   │   │   ├── data/                     ← Datasources (remote Keycloak, local SecureStorage)
│   │   │   ├── domain/                   ← Entities, UseCases, Repository interfaces
│   │   │   └── presentation/             ← Cubit + Pages + Widgets da feature
│   │   ├── identity/                     ← Perfil de usuário, organização, papel
│   │   ├── notifications/                ← Central de notificações push e locais
│   │   └── ai_assistant/                 ← Chat IA, streaming, voz, sugestões, HITL
│   │
│   ├── offline/                          ← Offline First Framework
│   │   ├── local_database/               ← Drift (SQLite) schemas e DAOs
│   │   ├── cache/                        ← Hive boxes por entidade (TTL + LRU)
│   │   ├── operation_queue/              ← FIFO queue para mutações offline
│   │   └── conflict_resolution/          ← Estratégias CRDT (Last-Write-Wins, Custom)
│   │
│   ├── synchronization/                  ← Sync Engine (bidirecional + incremental)
│   │   ├── sync_manager.dart             ← Orquestrador de sincronização
│   │   ├── delta_sync.dart               ← Sync incremental por timestamp/cursor
│   │   └── background_sync.dart          ← workmanager + BGTaskScheduler
│   │
│   ├── security/                         ← Mobile Security Framework
│   │   ├── auth_interceptor.dart         ← Bearer token + token refresh automático
│   │   ├── certificate_pinning.dart      ← HPKP com flutter_certificate_pinner
│   │   ├── secure_storage.dart           ← flutter_secure_storage (AES-256 Keychain/KeyStore)
│   │   ├── biometric_auth.dart           ← local_auth (FaceID, Fingerprint, PIN fallback)
│   │   └── device_integrity.dart         ← Detecção root/jailbreak + Play Integrity API
│   │
│   ├── ai/                               ← AI Experience Mobile Layer
│   │   ├── assistant_cubit.dart          ← Estado da sessão de chat (Cubit)
│   │   ├── streaming_chat.dart           ← SSE streaming para respostas do assistente
│   │   └── voice_commands.dart           ← speech_to_text + intent extraction
│   │
│   └── infrastructure/                   ← OTel, Crashlytics, Feature Flags
│
├── assets/                               ← Fontes (Inter Variable), Ícones SVG, Imagens
├── test/                                 ← Unit Tests + Widget Tests (flutter_test)
└── integration_test/                     ← E2E Tests (integration_test + Maestro)
```

---

## ETAPA 4 — MOBILE DESIGN SYSTEM

```dart
// /apps/mobile/lib/design_system/tokens/aura_colors.dart
class AuraColors {
  AuraColors._();

  // Brand Palette — HSL curated (espelho do @aura/ui web tokens)
  static const brand50  = Color(0xFFF0F5FF);
  static const brand500 = Color(0xFF2563EB);  // Azul Aura Principal
  static const brand900 = Color(0xFF1E3A8A);
  static const accent500 = Color(0xFF0D9488); // Verde Saúde
  static const danger500 = Color(0xFFDC2626);
  static const warning500 = Color(0xFFF59E0B);

  // Surfaces (Light)
  static const surfaceLight0   = Color(0xFFFFFFFF);
  static const surfaceLight50  = Color(0xFFF0F4F8);
  static const surfaceLight100 = Color(0xFFE2E8F0);

  // Surfaces (Dark)
  static const surfaceDark0   = Color(0xFF0F172A);
  static const surfaceDark50  = Color(0xFF1E293B);
  static const surfaceDark100 = Color(0xFF334155);
}
```

```dart
// /apps/mobile/lib/design_system/widgets/aura_button.dart
enum AuraButtonVariant { primary, secondary, ghost, danger }
enum AuraButtonSize { sm, md, lg }

class AuraButton extends StatelessWidget {
  const AuraButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = AuraButtonVariant.primary,
    this.size = AuraButtonSize.md,
    this.isLoading = false,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final AuraButtonVariant variant;
  final AuraButtonSize size;
  final bool isLoading;
  final Widget? icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Semantics(  // Acessibilidade obrigatória
      button: true,
      enabled: onPressed != null && !isLoading,
      label: isLoading ? '$label, carregando' : label,
      child: FilledButton.icon(
        onPressed: isLoading ? null : onPressed,
        style: _buildStyle(theme),
        icon: isLoading
            ? SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white,
                ),
              )
            : (icon ?? const SizedBox.shrink()),
        label: Text(label),
      ),
    );
  }

  ButtonStyle _buildStyle(ThemeData theme) {
    return switch (variant) {
      AuraButtonVariant.primary => FilledButton.styleFrom(
          backgroundColor: AuraColors.brand500,
          foregroundColor: Colors.white,
          minimumSize: _getSize(),
        ),
      AuraButtonVariant.secondary => FilledButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: AuraColors.brand500,
          side: const BorderSide(color: AuraColors.brand500),
          minimumSize: _getSize(),
        ),
      AuraButtonVariant.danger => FilledButton.styleFrom(
          backgroundColor: AuraColors.danger500,
          foregroundColor: Colors.white,
          minimumSize: _getSize(),
        ),
      AuraButtonVariant.ghost => FilledButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: AuraColors.brand500,
          minimumSize: _getSize(),
        ),
    };
  }

  Size _getSize() => switch (size) {
    AuraButtonSize.sm => const Size(80, 36),
    AuraButtonSize.md => const Size(100, 44),
    AuraButtonSize.lg => const Size(120, 52),
  };
}
```

---

## ETAPA 5 — OFFLINE FIRST ARCHITECTURE (Drift + Hive + Operation Queue)

```dart
// /apps/mobile/lib/offline/local_database/database.dart
// Drift ORM — SQLite tipo-safe com migrations automáticas
@DriftDatabase(tables: [Users, HealthRecords, PendingOperations])
class AuraLocalDatabase extends _$AuraLocalDatabase {
  AuraLocalDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 3;  // Versionamento de schema com migrations

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onUpgrade: (migrator, from, to) async {
      if (from < 2) await migrator.addColumn(healthRecords, healthRecords.syncedAt);
      if (from < 3) await migrator.createTable(pendingOperations);
    },
  );

  // Busca registros não sincronizados (dirty records)
  Future<List<HealthRecord>> getUnsyncedRecords() =>
      (select(healthRecords)..where((r) => r.syncedAt.isNull())).get();
}
```

```dart
// /apps/mobile/lib/offline/operation_queue/operation_queue.dart
// FIFO Queue para mutações executadas offline (persistida no SQLite)
class OfflineOperationQueue {
  final AuraLocalDatabase _db;

  Future<void> enqueue(PendingOperation operation) async {
    await _db.into(_db.pendingOperations).insert(
      PendingOperationsCompanion.insert(
        id: Value(const Uuid().v7()),
        operationType: operation.type,
        payload: Value(jsonEncode(operation.payload)),
        entityId: operation.entityId,
        createdAt: Value(DateTime.now()),
        retryCount: const Value(0),
      ),
    );
  }

  // Drena a fila quando conectividade é restaurada
  Future<void> drain(SyncManager syncManager) async {
    final pending = await _db.getPendingOperations();
    for (final op in pending) {
      try {
        await syncManager.executeRemotely(op);
        await _db.deletePendingOperation(op.id);
      } catch (e) {
        // Retry com backoff exponencial (max 5 tentativas)
        if (op.retryCount >= 5) {
          await _db.moveToDLQ(op);  // Dead Letter Queue para operações irrecuperáveis
        } else {
          await _db.incrementRetryCount(op.id);
        }
      }
    }
  }
}
```

---

## ETAPA 6 — MOBILE SYNCHRONIZATION ENGINE (Bidirecional + Incremental)

```dart
// /apps/mobile/lib/synchronization/sync_manager.dart
class SyncManager {
  final AuraApiClient _apiClient;
  final AuraLocalDatabase _localDb;
  final ConnectivityPlus _connectivity;
  final AuraEventMeshClient _eventMesh;  // AENF WebSocket Client

  /// Sincronização incremental — envia apenas delta desde o último sync
  Future<SyncResult> syncDelta({required String entityType}) async {
    final lastSyncCursor = await _localDb.getLastSyncCursor(entityType);

    // Buscar mudanças no servidor desde o último cursor
    final remoteDelta = await _apiClient.getDelta(
      entityType: entityType,
      since: lastSyncCursor,
    );

    // Buscar mudanças locais não sincronizadas
    final localDirty = await _localDb.getUnsyncedByType(entityType);

    // Resolver conflitos antes de aplicar
    final resolved = await ConflictResolver.resolve(
      localChanges: localDirty,
      remoteChanges: remoteDelta.items,
      strategy: ConflictStrategy.lastWriteWins,  // CRDT simplificado
    );

    // Aplicar remotas localmente
    await _localDb.applyRemoteChanges(resolved.remoteToApplyLocally);

    // Enviar locais ao servidor
    for (final local in resolved.localToSendRemote) {
      await _apiClient.upsert(entityType: entityType, data: local);
    }

    // Atualizar cursor
    await _localDb.updateSyncCursor(entityType, remoteDelta.nextCursor);

    return SyncResult(synced: resolved.totalResolved, conflicts: resolved.conflicts);
  }

  /// Escuta eventos em tempo real via AENF WebSocket (quando conectado)
  void subscribeToRealTimeEvents() {
    _eventMesh.subscribe(
      topics: ['identity.user.updated', 'health.record.created'],
      onEvent: (CloudEvent event) async {
        await _localDb.applyEventDelta(event);
      },
    );
  }
}
```

---

## ETAPA 7 — SEGURANÇA MOBILE (ZERO TRUST + BIOMETRIA)

```dart
// /apps/mobile/lib/security/biometric_auth.dart
class BiometricAuthService {
  final LocalAuthentication _localAuth = LocalAuthentication();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),  // AES-256 KeyStore
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock_this_device),
  );

  /// Autenticação biométrica com fallback para PIN corporativo
  Future<AuthResult> authenticate({required String reason}) async {
    // 1. Detectar root/jailbreak antes da autenticação
    final isCompromised = await DeviceIntegrityChecker.isCompromised();
    if (isCompromised) {
      return AuthResult.blocked(reason: 'Dispositivo comprometido detectado.');
    }

    // 2. Verificar disponibilidade biométrica
    final canUseBiometrics = await _localAuth.canCheckBiometrics;
    if (!canUseBiometrics) {
      return _fallbackToPIN();
    }

    // 3. Executar autenticação biométrica
    final authenticated = await _localAuth.authenticate(
      localizedReason: reason,
      options: const AuthenticationOptions(
        biometricOnly: false,  // Permite PIN como fallback
        stickyAuth: true,
      ),
    );

    return authenticated
        ? AuthResult.success()
        : AuthResult.failed(reason: 'Autenticação biométrica rejeitada.');
  }
}
```

```dart
// /apps/mobile/lib/security/certificate_pinning.dart
// Certificate Pinning — proteção contra ataques MITM
class AuraSecureHttpClient {
  static Dio createSecureClient() {
    final dio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl));

    // SHA-256 fingerprints dos certificados da Aura (rotacionados anualmente)
    dio.interceptors.add(
      CertificatePinningInterceptor(
        allowedSHAFingerprints: [
          AppConfig.certFingerprint1,
          AppConfig.certFingerprint2,  // Backup para rotação
        ],
      ),
    );

    return dio;
  }
}
```

---

## ETAPA 8 — MOBILE AI EXPERIENCE (Chat Streaming + Voz + HITL)

```dart
// /apps/mobile/lib/ai/streaming_chat.dart
class AIStreamingChatService {
  final Dio _dio;

  /// Stream de resposta do assistente (SSE via AENF)
  Stream<String> streamAssistantResponse({
    required String userMessage,
    required String sessionId,
  }) async* {
    final response = await _dio.get<ResponseBody>(
      '/v1/ai/assistant/stream',
      queryParameters: {'session_id': sessionId},
      data: {'message': userMessage},
      options: Options(
        responseType: ResponseType.stream,
        headers: {'Accept': 'text/event-stream'},
      ),
    );

    await for (final chunk in response.data!.stream) {
      final text = utf8.decode(chunk);
      final lines = text.split('\n').where((l) => l.startsWith('data:'));
      for (final line in lines) {
        final data = line.substring(5).trim();
        if (data != '[DONE]') {
          yield jsonDecode(data)['delta'] as String;
        }
      }
    }
  }
}

// Widget de HITL (Human-in-the-Loop) Mobile
class HITLApprovalCard extends StatelessWidget {
  final PendingDecision decision;

  @override
  Widget build(BuildContext context) {
    return AuraCard(
      borderColor: AuraColors.warning500,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.warning_amber_rounded, color: AuraColors.warning500),
            const SizedBox(width: 8),
            Text('Aprovação Necessária', style: AuraTypography.titleMd),
          ]),
          const SizedBox(height: 8),
          Text(decision.description, style: AuraTypography.bodySm),
          ExplainabilityChip(confidence: decision.confidence, sources: decision.sources),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: AuraButton(
                  label: 'Aprovar',
                  variant: AuraButtonVariant.primary,
                  onPressed: () => context.read<HITLCubit>().approve(decision.id),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: AuraButton(
                  label: 'Rejeitar',
                  variant: AuraButtonVariant.secondary,
                  onPressed: () => context.read<HITLCubit>().reject(decision.id),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
```

---

## ETAPA 9 — PUSH & EVENT PLATFORM (FCM + APNs + Deep Links)

```dart
// /apps/mobile/lib/features/notifications/push_notification_service.dart
class PushNotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  Future<void> initialize() async {
    // 1. Solicitar permissão (iOS obrigatório, Android 13+)
    final settings = await _fcm.requestPermission(
      alert: true, badge: true, sound: true, provisional: false,
    );

    // 2. Registrar token FCM no backend (associado ao userId e deviceId)
    final fcmToken = await _fcm.getToken();
    if (fcmToken != null) {
      await DeviceRegistrationService.registerToken(
        token: fcmToken,
        platform: Platform.isIOS ? 'apns' : 'fcm',
      );
    }

    // 3. Processar notificações em foreground
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // 4. Processar deep links via Universal Links / App Links
    AppLinks().uriLinkStream.listen(_handleDeepLink);
  }

  void _handleDeepLink(Uri uri) {
    // Roteamento: aura://health/records/rec-123 → HealthRecordPage(id: 'rec-123')
    final router = GetIt.I<GoRouter>();
    router.go(uri.path, extra: {'params': uri.queryParameters});
  }
}
```

---

## ETAPA 10 — OTIMIZAÇÃO DE PERFORMANCE

**Metas por Categoria de Dispositivo:**

| Métrica | Dispositivo Low-End (2GB RAM) | Dispositivo High-End | Estratégia |
|---------|-------------------------------|----------------------|------------|
| **Cold Start** | < 2.0s | < 1.0s | Deferred loading de features não-core |
| **Frame Rate** | 30fps mínimo | 60/120fps | Impeller engine + `RepaintBoundary` |
| **Memória** | < 150MB | < 300MB | Hive TTL + Image cache LRU limit |
| **Bateria (Sync)** | Max 0.5%/h background | Max 0.2%/h | `WorkManager` com `networkType: connected` |
| **APK Size** | < 15MB | < 30MB | Deferred components + tree shaking |

```dart
// Performance: Lazy loading de features pesadas via Deferred Loading
import 'features/reporting/reporting_page.dart' deferred as reporting;

Future<void> _loadReportingFeature() async {
  await reporting.loadLibrary();
  navigator.push(MaterialPageRoute(builder: (_) => reporting.ReportingPage()));
}
```

---

## ETAPA 11 — ACESSIBILIDADE (WCAG + Semantics)

```dart
// Todo widget interativo DEVE ter Semantics explícito
class AuraMetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String trend;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: '$title: $value. Tendência: $trend',
      container: true,
      child: ExcludeSemantics(
        child: _buildVisualContent(),  // Conteúdo visual (ignorado por screen readers)
      ),
    );
  }
}

// Suporte a Dynamic Type — fonts escaláveis pelo usuário
Text(
  'Prontuário do Paciente',
  style: AuraTypography.titleLg.copyWith(
    fontSize: MediaQuery.textScalerOf(context).scale(AuraTypography.titleLg.fontSize!),
  ),
)
```

---

## ETAPA 12 — OBSERVABILIDADE MOBILE (OTel Dart + Crashlytics)

```dart
// /apps/mobile/lib/main.dart (bootstrap OTel antes do runApp)
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // 1. Firebase — Crashlytics + Analytics
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;

  // 2. OpenTelemetry Dart SDK
  final resource = Resource({'service.name': 'aura-mobile', 'app.version': AppConfig.version});
  final provider = TracerProvider(
    resource: resource,
    processors: [
      BatchSpanProcessor(OtlpHttpExporter(endpoint: '${AppConfig.apiBaseUrl}/v1/traces')),
    ],
  );
  registerGlobalTracerProvider(provider);

  // 3. Métricas de performance mobile customizadas
  AuraMobileMetrics.init();  // Registra sync_duration, offline_operations_count, ai_latency

  runApp(const AuraApp());
}
```

---

## ETAPA 13 — SUITE CORPORATIVA DE TESTES MOBILE

```dart
// Unit Test — Use Case (flutter_test)
void main() {
  group('SyncDeltaUseCase', () {
    late MockSyncManager mockSyncManager;
    late SyncDeltaUseCase useCase;

    setUp(() {
      mockSyncManager = MockSyncManager();
      useCase = SyncDeltaUseCase(mockSyncManager);
    });

    test('deve retornar SyncResult com 0 conflitos em dados não-conflitantes', () async {
      when(() => mockSyncManager.syncDelta(entityType: 'health_records'))
          .thenAnswer((_) async => SyncResult(synced: 5, conflicts: 0));

      final result = await useCase(entityType: 'health_records');

      expect(result.conflicts, 0);
      expect(result.synced, 5);
    });
  });
}
```

**Metas de Cobertura:**

| Tipo de Teste | Framework | Meta |
|---------------|-----------|------|
| Unit Tests (UseCases, Domain) | `flutter_test` / Mockito | ≥ 90% |
| Widget Tests (Design System) | `flutter_test` | ≥ 80% |
| Integration Tests (E2E Device) | `integration_test` + Maestro | 100% fluxos críticos |
| Accessibility Tests | `flutter_test` + Semantics | Zero violações A11y |
| Security Tests (Pinning, Storage) | `flutter_test` + `patrol` | 100% |

---

## ETAPA 14 — DOCUMENTAÇÃO TÉCNICA SINCRONIZADA

- **Arquitetura C4 Mobile**: Diagrama de Container mostrando Flutter App ↔ Backend API ↔ AENF Event Mesh.
- **Guia de Offline First**: Fluxogramas dos cenários de conectividade (Online, Intermitente, Offline Total) e comportamento esperado.
- **Design System Mobile Storybook**: Documentação visual dos widgets com exemplos interativos (via `Widgetbook` package).
- **ADR-003**: Justificativa técnica detalhada da seleção Flutter vs. React Native.

---

## ETAPA 15 — CERTIFICAÇÃO DA PLATAFORMA MOBILE FOUNDATION

A AEMPF é considerada **CERTIFICADA** quando todos os critérios abaixo são satisfeitos:

- [x] **Flutter 3.x** com Impeller ativo (iOS Vulkan/Metal, Android Vulkan).
- [x] **Offline First**: Operações críticas (leitura de prontuário, triagem) funcionais sem conectividade em testes de integração.
- [x] **Sync Engine**: Delta sync e bidirecional com AENF WebSocket validados por testes de integração com servidor real.
- [x] **Zero Trust Mobile**: OAuth2 PKCE, biometria FaceID/Fingerprint, `flutter_secure_storage` AES-256 e certificate pinning verificados.
- [x] **Design System**: ≥ 15 widgets no Widgetbook com stories de acessibilidade (zero violações Semantics).
- [x] **Performance**: Cold start < 2.0s (low-end), frame rate ≥ 30fps constante no perfil de release.
- [x] **OTel + Crashlytics**: Traces correlacionados com o backend e crashes relatados ao Firebase.
- [x] **WCAG**: Semantics completos em todos os widgets interativos; Dynamic Type testado.
- [x] **Testes**: ≥ 90% cobertura em UseCases, 100% nos fluxos de autenticação e sincronização E2E.

**Plano de Expansão para o Prompt 105:**

Com a fundação mobile certificada, o Prompt 105 iniciará a implementação do **M01 — Identity & Access Management** como o primeiro módulo completo — backend (AEBPF), frontend web (AEXP) e mobile (AEMPF) integrados ponta a ponta, incluindo Login, MFA, biometria mobile e gestão de sessão.

---

*Documento homologado pelo Conselho de Engenharia Mobile e Experiência*  
*Hash de Integridade SHA-256:* `aempf-104-enterprise-mobile-platform-foundation-2026-v1`
