import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventBusService, AuraCloudEvent } from './event-bus.service';

describe('EventBusService', () => {
  let service: EventBusService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventBusService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
            on: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EventBusService>(EventBusService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('publish()', () => {
    it('should publish a CloudEvents v1.0.3 envelope', async () => {
      const eventType = 'aura.beneficiary.created.v1';
      const tenantId = 'tenant-123';
      const data = { id: 'beneficiary-456', name: 'João Silva' };

      const event = await service.publish(eventType, data, tenantId);

      expect(event).toBeDefined();
      expect(event.specversion).toBe('1.0');
      expect(event.type).toBe(eventType);
      expect(event.tenantid).toBe(tenantId);
      expect(event.data).toEqual(data);
      expect(event.datacontenttype).toBe('application/json');
      expect(event.id).toBeDefined();
      expect(event.time).toBeDefined();
      expect(event.source).toBeDefined();
    });

    it('should emit the event via EventEmitter2', async () => {
      const emitSpy = jest.spyOn(eventEmitter, 'emit');
      const eventType = 'aura.clinical.encounter.closed.v1';

      await service.publish(eventType, { encounterId: 'enc-789' }, 'tenant-abc');

      expect(emitSpy).toHaveBeenCalledWith(
        eventType,
        expect.objectContaining({ type: eventType }),
      );
    });

    it('should include correlationId when provided', async () => {
      const correlationId = 'corr-xyz-123';
      const event = await service.publish(
        'aura.social.case.opened.v1',
        {},
        'tenant-001',
        { correlationId },
      );

      expect(event.correlationid).toBe(correlationId);
    });

    it('should add failed events to DLQ on emit failure', async () => {
      jest.spyOn(eventEmitter, 'emit').mockImplementation(() => {
        throw new Error('Simulated emit failure');
      });

      await service.publish('aura.test.event.v1', {}, 'tenant-fail');

      const dlq = service.getDlq();
      expect(dlq).toHaveLength(1);
      expect(dlq[0].type).toBe('aura.test.event.v1');
    });
  });

  describe('subscribe()', () => {
    it('should register an event handler via EventEmitter2', () => {
      const onSpy = jest.spyOn(eventEmitter, 'on');
      const handler = jest.fn();

      service.subscribe('aura.beneficiary.*.v1', handler);

      expect(onSpy).toHaveBeenCalledWith('aura.beneficiary.*.v1', handler);
    });
  });

  describe('getDlq()', () => {
    it('should return empty array when DLQ is empty', () => {
      expect(service.getDlq()).toEqual([]);
    });
  });

  describe('replayDlq()', () => {
    it('should replay and clear DLQ events', async () => {
      // Força um evento no DLQ
      jest.spyOn(eventEmitter, 'emit')
        .mockImplementationOnce(() => { throw new Error('fail'); })
        .mockImplementation(() => true);

      await service.publish('aura.test.dlq.v1', {}, 'tenant-dlq');
      expect(service.getDlq()).toHaveLength(1);

      const replayed = await service.replayDlq();
      expect(replayed).toBe(1);
      expect(service.getDlq()).toHaveLength(0);
    });
  });
});
