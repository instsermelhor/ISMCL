import { AuditService } from './audit.service';
import * as crypto from 'crypto';

describe('AuditService — GAP-P1-03 (Log Imutável com Hash Chain)', () => {
  let service: AuditService;
  let mockDb: any;
  let auditLogs: any[];
  let auditSignatures: any[];

  beforeEach(() => {
    auditLogs = [];
    auditSignatures = [];

    mockDb = {
      securityAuditLog: {
        create: jest.fn().mockImplementation(({ data }) => {
          const newLog = {
            id: `log-${auditLogs.length + 1}`,
            ...data,
            timestamp: new Date(),
          };
          auditLogs.push(newLog);
          return Promise.resolve(newLog);
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          const found = auditLogs.find((l) => l.id === where.id);
          return Promise.resolve(found || null);
        }),
      },
      auditLogSignature: {
        findFirst: jest.fn().mockImplementation(({ orderBy }) => {
          if (auditSignatures.length === 0) return Promise.resolve(null);
          return Promise.resolve(auditSignatures[auditSignatures.length - 1]);
        }),
        findMany: jest.fn().mockImplementation(() => Promise.resolve([...auditSignatures])),
        create: jest.fn().mockImplementation(({ data }) => {
          const newSig = {
            id: `sig-${auditSignatures.length + 1}`,
            ...data,
            createdAt: new Date(),
          };
          auditSignatures.push(newSig);
          return Promise.resolve(newSig);
        }),
      },
    };

    service = new AuditService(mockDb);
  });

  it('deve ser instanciado corretamente', () => {
    expect(service).toBeDefined();
  });

  describe('log & hash chain', () => {
    it('deve criar o primeiro log de auditoria com hash de gênese (64 zeros)', async () => {
      const logId = await service.log({
        actorId: 'user-001',
        actorName: 'Dr. Silva',
        role: 'CLINICIAN',
        action: 'READ_RECORD',
        targetEntity: 'BENEFICIARY',
        targetEntityId: 'ben-001',
        ipAddress: '127.0.0.1',
        userAgent: 'JestTestBrowser',
      });

      expect(logId).toEqual('log-1');
      expect(auditLogs.length).toEqual(1);
      expect(auditSignatures.length).toEqual(1);

      const sig = auditSignatures[0];
      expect(sig.previousLogHash).toEqual('0000000000000000000000000000000000000000000000000000000000000000');
      expect(sig.logHash).toBeDefined();
      expect(sig.signature).toBeDefined();
    });

    it('deve encadear o segundo log apontando o previousLogHash para o logHash do primeiro', async () => {
      await service.log({
        actorId: 'user-001',
        action: 'READ_RECORD',
        targetEntity: 'BENEFICIARY',
        targetEntityId: 'ben-001',
        ipAddress: '127.0.0.1',
        userAgent: 'Jest',
      });

      const firstSig = auditSignatures[0];

      await service.log({
        actorId: 'user-002',
        action: 'BREAK_GLASS',
        targetEntity: 'BENEFICIARY',
        targetEntityId: 'ben-002',
        justification: 'Atendimento emergencial na UTI',
        ipAddress: '192.168.1.1',
        userAgent: 'Jest',
      });

      const secondSig = auditSignatures[1];

      expect(secondSig.previousLogHash).toEqual(firstSig.logHash);
    });

    it('deve validar com sucesso a integridade da cadeia de logs íntegra', async () => {
      await service.log({
        actorId: 'user-001',
        action: 'VIEW_VAULT',
        targetEntity: 'BENEFICIARY',
        targetEntityId: 'ben-100',
        ipAddress: '10.0.0.1',
        userAgent: 'Jest',
      });

      await service.log({
        actorId: 'user-003',
        action: 'EXPORT',
        targetEntity: 'PRONTUARIO',
        targetEntityId: 'ben-100',
        ipAddress: '10.0.0.2',
        userAgent: 'Jest',
      });

      const integrity = await service.verifyChainIntegrity();

      expect(integrity.isValid).toBe(true);
      expect(integrity.brokenLogId).toBeNull();
      expect(integrity.message).toContain('100% íntegra');
    });

    it('deve detectar adulteração no conteúdo do log se alterado no banco', async () => {
      await service.log({
        actorId: 'user-001',
        action: 'VIEW_VAULT',
        targetEntity: 'BENEFICIARY',
        targetEntityId: 'ben-100',
        ipAddress: '10.0.0.1',
        userAgent: 'Jest',
      });

      // Adultera o log diretamente na memória/banco
      auditLogs[0].action = 'ACTION_TAMPERED';

      const integrity = await service.verifyChainIntegrity();

      expect(integrity.isValid).toBe(false);
      expect(integrity.brokenLogId).toEqual('log-1');
      expect(integrity.message).toContain('Adulteração detectada');
    });

    it('deve detectar deleção de log na cadeia de auditoria', async () => {
      await service.log({
        actorId: 'user-001',
        action: 'READ',
        targetEntity: 'BENEFICIARY',
        targetEntityId: 'ben-1',
        ipAddress: '127.0.0.1',
        userAgent: 'Jest',
      });

      // Exclui o log original do banco
      auditLogs.shift();

      const integrity = await service.verifyChainIntegrity();

      expect(integrity.isValid).toBe(false);
      expect(integrity.brokenLogId).toEqual('log-1');
      expect(integrity.message).toContain('excluído do banco');
    });
  });
});
