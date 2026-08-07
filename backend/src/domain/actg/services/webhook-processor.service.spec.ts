import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { WebhookProcessorService } from './webhook-processor.service';
import { ProviderRegistryService } from './provider-registry.service';
import { EventBusService } from '../../../events/event-bus.service';
import { createHmac } from 'crypto';

const WEBHOOK_SECRET = 'test-secret-key-for-unit-tests';

const mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };
const mockConfig = {
  get: jest.fn((key: string, def?: string) => {
    if (key === 'ACTG_WEBHOOK_SECRET') return WEBHOOK_SECRET;
    if (key === 'NODE_ENV') return 'test';
    return def;
  }),
};
const mockWhatsAppProvider = {
  providerType: 'WHATSAPP_BUSINESS',
  processWebhook: jest.fn().mockResolvedValue({
    eventType: 'delivered',
    externalMeetingId: 'wa-msg-001',
    status: 'delivered',
  }),
};
const mockRegistry = {
  getProvider: jest.fn().mockReturnValue(mockWhatsAppProvider),
};

function makeSignature(payload: Record<string, unknown>, secret: string): string {
  const hash = createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
  return `sha256=${hash}`;
}

describe('WebhookProcessorService', () => {
  let service: WebhookProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookProcessorService,
        { provide: ProviderRegistryService, useValue: mockRegistry },
        { provide: EventBusService, useValue: mockEventBus },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get<WebhookProcessorService>(WebhookProcessorService);
    jest.clearAllMocks();
    mockConfig.get.mockImplementation((key: string, def?: string) => {
      if (key === 'ACTG_WEBHOOK_SECRET') return WEBHOOK_SECRET;
      if (key === 'NODE_ENV') return 'test';
      return def;
    });
  });

  it('deve processar webhook com assinatura válida', async () => {
    const payload = { entry: [{ changes: [{ value: { statuses: [{ id: 'msg-001', status: 'delivered' }] } }] }] };
    const signature = makeSignature(payload, WEBHOOK_SECRET);

    const result = await service.process('WHATSAPP_BUSINESS', payload, signature, 'evt-001');

    expect(result.processed).toBe(true);
    expect(result.eventType).toBe('delivered');
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      'aura.actg.webhook.processed.v1',
      expect.objectContaining({ providerType: 'WHATSAPP_BUSINESS', eventType: 'delivered' }),
      'default',
      expect.any(Object),
    );
  });

  it('deve rejeitar webhook com assinatura inválida', async () => {
    const payload = { entry: [] };
    const result = await service.process('WHATSAPP_BUSINESS', payload, 'sha256=invalidsignature', 'evt-002');
    expect(result.processed).toBe(false);
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('deve garantir idempotência — não reprocessar evento com mesmo ID', async () => {
    const payload = { entry: [{ changes: [{ value: { statuses: [{ id: 'msg-002', status: 'read' }] } }] }] };
    const signature = makeSignature(payload, WEBHOOK_SECRET);

    await service.process('WHATSAPP_BUSINESS', payload, signature, 'evt-003');
    const result2 = await service.process('WHATSAPP_BUSINESS', payload, signature, 'evt-003');

    expect(result2.processed).toBe(false);
    // Provider deve ter sido chamado apenas uma vez
    expect(mockWhatsAppProvider.processWebhook).toHaveBeenCalledTimes(1);
  });

  it('deve retornar false para provedor sem suporte a webhooks', async () => {
    const providerSemWebhook = { providerType: 'ZOOM' }; // Sem processWebhook
    mockRegistry.getProvider.mockReturnValueOnce(providerSemWebhook);

    const payload = {};
    const signature = makeSignature(payload, WEBHOOK_SECRET);
    const result = await service.process('ZOOM', payload, signature);

    expect(result.processed).toBe(false);
  });

  it('deve processar sem externalEventId (sem idempotência)', async () => {
    const payload = { entry: [{ changes: [{ value: { statuses: [{ id: 'msg-003', status: 'failed' }] } }] }] };
    const signature = makeSignature(payload, WEBHOOK_SECRET);

    // Sem externalEventId — pode ser processado múltiplas vezes
    const r1 = await service.process('WHATSAPP_BUSINESS', payload, signature);
    const r2 = await service.process('WHATSAPP_BUSINESS', payload, signature);

    expect(r1.processed).toBe(true);
    expect(r2.processed).toBe(true);
  });
});
