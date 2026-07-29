import { IntegrationHubService } from './integration-hub.service';
import { ApiWebhookManagementService } from './api-webhook-management.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  ConnectorCategory,
  IntegrationStatus,
  IntegrationType,
  SyncMode,
} from '../dto/integration.dto';

describe('IntegrationHubService', () => {
  let hubService: IntegrationHubService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    hubService = new IntegrationHubService(eventBusMock as EventBusService);
  });

  it('should have pre-seeded institutional connectors in ACTIVE status', () => {
    const connectors = hubService.listConnectors();
    expect(connectors.length).toBeGreaterThanOrEqual(4);
    const gov = connectors.find((c) => c.category === ConnectorCategory.GOVERNMENT);
    expect(gov).toBeDefined();
    expect(gov?.status).toBe(IntegrationStatus.ACTIVE);
  });

  it('should install connector in HOMOLOGATING status and approve for production', async () => {
    const installed = await hubService.installConnector({
      connectorName: 'Conector de Assinatura ICP-Brasil Certisign',
      category: ConnectorCategory.INSTITUTIONAL,
      version: '1.0.0',
    });

    expect(installed.connectorCode).toMatch(/^CNT-\d{4}-\d{4,5}$/);
    expect(installed.status).toBe(IntegrationStatus.HOMOLOGATING);

    const approved = await hubService.approveConnector(installed.connectorId);
    expect(approved.status).toBe(IntegrationStatus.ACTIVE);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.integration.connector.approved.v1',
      expect.objectContaining({ connectorCode: installed.connectorCode }),
      'default',
      expect.anything(),
    );
  });

  it('should trigger data synchronization and process records successfully', async () => {
    const connectors = hubService.listConnectors();
    const target = connectors[0];

    const syncJob = await hubService.triggerSynchronization({
      connectorId: target.connectorId,
      syncMode: SyncMode.INCREMENTAL,
    });

    expect(syncJob.status).toBe('SUCCESS');
    expect(syncJob.recordsProcessed).toBeGreaterThan(0);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.integration.sync.completed.v1',
      expect.objectContaining({ syncMode: SyncMode.INCREMENTAL }),
      'default',
      expect.anything(),
    );
  });
});

describe('ApiWebhookManagementService', () => {
  let apimService: ApiWebhookManagementService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    apimService = new ApiWebhookManagementService(eventBusMock as EventBusService);
  });

  it('should register managed API into APIM catalog', async () => {
    const api = await apimService.registerApi({
      apiName: 'Aura Telehealth WebRTC Signaling API',
      type: IntegrationType.WEBSOCKET,
      version: 'v2',
      endpointUrl: 'wss://telehealth.ser-melhor.org.br/v2',
    });

    expect(api.apiCode).toMatch(/^API-\d{4}-\d{4,5}$/);
    expect(api.dailyQuota).toBe(100000);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.integration.api.published.v1',
      expect.objectContaining({ name: expect.stringContaining('Telehealth') }),
      'default',
      expect.anything(),
    );
  });

  it('should register webhook and dispatch event with HMAC SHA-256 signature', async () => {
    const webhook = await apimService.registerWebhook({
      targetName: 'Sistema Interno de Prontuários (Notificação)',
      targetUrl: 'https://internal.ser-melhor.org.br/webhooks/ehr',
      eventTopic: 'aura.ecm.document.created.v1',
    });

    expect(webhook.active).toBe(true);

    const dispatchResult = await apimService.dispatchWebhook(webhook.webhookId, { documentId: 'doc-123' });
    expect(dispatchResult.statusCode).toBe(200);
    expect(dispatchResult.payloadSignatureHMAC).toHaveLength(64); // HMAC SHA-256
  });
});
