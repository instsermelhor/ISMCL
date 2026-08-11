import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventBusService } from './event-bus.service';

describe('EventBusService — Dual-Write Redis Streams (ANO-009)', () => {
  let service: EventBusService;
  let eventEmitter: EventEmitter2;
  let cacheMock: any;
  let xaddMock: jest.Mock;
  let xrangeMock: jest.Mock;

  beforeEach(async () => {
    xaddMock = jest.fn().mockResolvedValue('1600000000000-0');
    xrangeMock = jest.fn().mockResolvedValue([]);

    cacheMock = {
      store: {
        client: {
          xadd: xaddMock,
          xrange: xrangeMock,
        },
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventBusService,
        EventEmitter2,
        { provide: CACHE_MANAGER, useValue: cacheMock },
      ],
    }).compile();

    service = module.get<EventBusService>(EventBusService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('deve publicar eventos normais via EventEmitter2 sem dual-write', async () => {
    const handler = jest.fn();
    service.subscribe('aura.clinical.patient.created.v1', handler);

    const event = await service.publish(
      'aura.clinical.patient.created.v1',
      { patientId: 'p-100' },
      'tenant-default',
    );

    expect(event).toBeDefined();
    expect(event.type).toBe('aura.clinical.patient.created.v1');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(xaddMock).not.toHaveBeenCalled();
  });

  it('deve realizar dual-write no Redis Streams para eventos críticos (ANO-009)', async () => {
    const handler = jest.fn();
    service.subscribe('aura.security.breakglass.requested.v1', handler);

    const event = await service.publish(
      'aura.security.breakglass.requested.v1',
      { beneficiaryId: 'b-200', justification: 'Emergência Nível 4' },
      'tenant-default',
    );

    expect(event).toBeDefined();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(xaddMock).toHaveBeenCalledWith(
      'stream:aura:events',
      'MAXLEN',
      '~',
      10000,
      '*',
      'type',
      'aura.security.breakglass.requested.v1',
      'tenantId',
      'tenant-default',
      'correlationId',
      expect.any(String),
      'payload',
      expect.any(String),
    );
  });

  it('deve realizar dual-write para eventos financeiros e de auditoria', async () => {
    await service.publish(
      'aura.financial.transaction.approved.v1',
      { transactionId: 'tx-500', amount: 15000 },
      'tenant-default',
    );

    expect(xaddMock).toHaveBeenCalledWith(
      'stream:aura:events',
      'MAXLEN',
      '~',
      10000,
      '*',
      'type',
      'aura.financial.transaction.approved.v1',
      'tenantId',
      'tenant-default',
      'correlationId',
      expect.any(String),
      'payload',
      expect.any(String),
    );
  });

  it('deve lidar com falha do Redis (graceful degradation) sem travar a emissão in-process', async () => {
    xaddMock.mockRejectedValueOnce(new Error('Redis connection lost'));

    const handler = jest.fn();
    service.subscribe('aura.audit.log.created.v1', handler);

    const event = await service.publish(
      'aura.audit.log.created.v1',
      { action: 'BREAK_GLASS' },
      'tenant-default',
    );

    expect(event).toBeDefined();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('deve permitir consumir o stream para replay via consumeStream()', async () => {
    const mockPayload = {
      specversion: '1.0',
      id: 'evt-1',
      type: 'aura.security.breakglass.requested.v1',
      data: { beneficiaryId: 'b-1' },
    };

    xrangeMock.mockResolvedValueOnce([
      ['1600000000000-0', ['type', 'aura.security.breakglass.requested.v1', 'payload', JSON.stringify(mockPayload)]],
    ]);

    const events = await service.consumeStream('0', 10);
    expect(events.length).toBe(1);
    expect(events[0].id).toBe('evt-1');
  });
});
