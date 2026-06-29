import { Test, TestingModule } from '@nestjs/testing';
import { EmrEvolutionService } from './emr-evolution.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

// Mocks
class MockEncryptionService {
  async encrypt(text: string, options: any) {
    return `ENCRYPTED_${text}`;
  }
}

class MockAuditLogService {
  async logStrict(data: any) {}
}

const mockDb = {
  clinicalEvolution: {
    upsert: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  },
  caseProfessional: {
    findUnique: jest.fn(),
  }
};

describe('EmrEvolutionService', () => {
  let service: EmrEvolutionService;
  let db: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmrEvolutionService,
        { provide: 'db', useValue: mockDb },
        { provide: 'EncryptionService', useClass: MockEncryptionService },
        { provide: 'AuditLogService', useClass: MockAuditLogService }
      ],
    }).compile();

    service = module.get<EmrEvolutionService>(EmrEvolutionService);
    db = module.get('db');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveDraft', () => {
    it('deve bloquear a tentativa de salvar se o voluntário não for alocado ao caso', async () => {
      // Setup: DB não retorna vínculo
      db.caseProfessional.findUnique.mockResolvedValue(null);

      await expect(
        service.saveDraft('case-1', 'vol-1', 'ben-1', 'Conteúdo da Sessão')
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve criptografar o conteúdo e salvar o rascunho com sucesso', async () => {
      // Setup: DB retorna vínculo
      db.caseProfessional.findUnique.mockResolvedValue({ caseId: 'case-1', professionalId: 'vol-1' });
      db.clinicalEvolution.upsert.mockResolvedValue({ id: 'evo-1', status: 'DRAFT' });

      const result = await service.saveDraft('case-1', 'vol-1', 'ben-1', 'Conteúdo Limpo');

      expect(db.clinicalEvolution.upsert).toHaveBeenCalledWith(expect.objectContaining({
        create: expect.objectContaining({
          contentEncrypted: 'ENCRYPTED_Conteúdo Limpo',
          visibility: 'PRIVATE_TO_AUTHOR'
        })
      }));
      expect(result).toEqual({ id: 'evo-1', status: 'DRAFT' });
    });
  });

  describe('signAndLockEvolution', () => {
    it('deve bloquear a assinatura se a evolução já não for rascunho', async () => {
      db.clinicalEvolution.findById.mockResolvedValue({ id: 'evo-1', status: 'SIGNED', professionalId: 'vol-1' });

      await expect(
        service.signAndLockEvolution('evo-1', 'vol-1', 'Conteúdo Final')
      ).rejects.toThrow(BadRequestException);
    });

    it('deve bloquear a assinatura se o profissional não for o autor', async () => {
      db.clinicalEvolution.findById.mockResolvedValue({ id: 'evo-1', status: 'DRAFT', professionalId: 'vol-2' });

      await expect(
        service.signAndLockEvolution('evo-1', 'vol-1', 'Conteúdo Final')
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
