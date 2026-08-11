import { OfflineSyncService } from './offline-sync.service';

describe('OfflineSyncService — LWW Conflict Resolution & Batch Processing (Pilar 4)', () => {
  let service: OfflineSyncService;
  let prismaMock: any;
  let eventBusMock: any;

  beforeEach(() => {
    prismaMock = {
      offlineSyncBatch: {
        create: jest.fn().mockResolvedValue({ id: 'batch-100' }),
        update: jest.fn().mockResolvedValue({ id: 'batch-100', status: 'COMPLETED' }),
      },
      offlineSyncLog: {
        create: jest.fn().mockResolvedValue({ id: 'log-100' }),
      },
    };

    eventBusMock = {
      publish: jest.fn().mockResolvedValue({} as any),
    };

    service = new OfflineSyncService(prismaMock, eventBusMock);
  });

  describe('resolveConflictLww', () => {
    it('deve declarar CLIENT como vencedor quando não existir registro prévio no servidor', () => {
      const result = service.resolveConflictLww('2026-08-11T14:00:00Z', null);
      expect(result.winner).toBe('CLIENT');
      expect(result.isConflict).toBe(false);
    });

    it('deve declarar CLIENT como vencedor quando o timestamp do cliente for mais recente que o do servidor', () => {
      const clientTime = '2026-08-11T14:30:00Z';
      const serverTime = '2026-08-11T14:00:00Z';

      const result = service.resolveConflictLww(clientTime, serverTime);
      expect(result.winner).toBe('CLIENT');
      expect(result.isConflict).toBe(true);
    });

    it('deve declarar SERVER como vencedor quando o timestamp do servidor for mais recente que o do cliente', () => {
      const clientTime = '2026-08-11T12:00:00Z';
      const serverTime = '2026-08-11T14:00:00Z';

      const result = service.resolveConflictLww(clientTime, serverTime);
      expect(result.winner).toBe('SERVER');
      expect(result.isConflict).toBe(true);
    });
  });

  describe('processBatch', () => {
    it('deve processar lote de sincronização offline e publicar evento', async () => {
      const result = await service.processBatch({
        deviceId: 'dev-001',
        agentId: 'agent-001',
        items: [
          {
            localId: 'local-1',
            type: 'TRIAGE',
            data: { beneficiaryName: 'Paciente Teste' },
            clientTime: '2026-08-11T14:00:00Z',
          },
        ],
      });

      expect(result).toBeDefined();
      expect(prismaMock.offlineSyncBatch.create).toHaveBeenCalled();
      expect(prismaMock.offlineSyncLog.create).toHaveBeenCalled();
      expect(eventBusMock.publish).toHaveBeenCalledWith(
        'aura.offline.sync.completed.v1',
        expect.objectContaining({ batchId: 'batch-100' }),
        'default',
      );
    });
  });
});
