import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BreakGlassService } from './break-glass.service';
import { AuditService } from '../../audit/audit.service';
import { EventBusService } from '../../events/event-bus.service';
import { EmergencyType, BreakGlassStatus } from './dto/break-glass.dto';

// ── Mocks ────────────────────────────────────────────────────────────────────

const MOCK_PROFESSIONAL_ID = 'prof-001';
const MOCK_BENEFICIARY_ID = 'ben-001';
const MOCK_SESSION_ID = 'session-001';
const MOCK_AUDIT_LOG_ID = 'audit-001';

function buildPrismaMock(overrides: Partial<any> = {}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const defaultBeneficiary = { id: MOCK_BENEFICIARY_ID, fullName: 'Maria da Silva' };
  const defaultProfessional = { id: MOCK_PROFESSIONAL_ID, fullName: 'Dr. João Souza' };
  const defaultSession = {
    id: MOCK_SESSION_ID,
    professionalId: MOCK_PROFESSIONAL_ID,
    professionalName: 'Dr. João Souza',
    beneficiaryId: MOCK_BENEFICIARY_ID,
    beneficiaryName: 'Maria da Silva',
    justification: 'Paciente em risco de vida imediato — overdose confirmada na UPA.',
    emergencyType: EmergencyType.RISCO_VIDA,
    status: BreakGlassStatus.ACTIVE,
    requestedAt: now,
    approvedAt: now,
    expiresAt,
    revokedAt: null,
    revokedById: null,
    ipAddress: '10.0.0.1',
    userAgent: 'Test/1.0',
    tenantId: 'default',
    auditLogId: MOCK_AUDIT_LOG_ID,
    notificationSentAt: now,
    createdAt: now,
    updatedAt: now,
  };

  return {
    beneficiary: {
      findUnique: jest.fn().mockResolvedValue(defaultBeneficiary),
    },
    professional: {
      findUnique: jest.fn().mockResolvedValue(defaultProfessional),
    },
    breakGlassSession: {
      findFirst: jest.fn().mockResolvedValue(null), // Sem sessão ativa prévia
      create: jest.fn().mockResolvedValue({ ...defaultSession, status: BreakGlassStatus.PENDING }),
      update: jest.fn().mockResolvedValue(defaultSession),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      findUnique: jest.fn().mockResolvedValue(defaultSession),
      findMany: jest.fn().mockResolvedValue([defaultSession]),
    },
    ...overrides,
  };
}

const mockAuditService = {
  log: jest.fn().mockResolvedValue(MOCK_AUDIT_LOG_ID),
};

const mockEventBus = {
  publish: jest.fn().mockResolvedValue({ id: 'event-001', type: 'aura.security.break_glass.initiated.v1' }),
};

// ── Testes ───────────────────────────────────────────────────────────────────

describe('BreakGlassService — GAP-P1-04 (Notificação Break-Glass em Tempo Real)', () => {
  let service: BreakGlassService;
  let prismaMock: ReturnType<typeof buildPrismaMock>;

  const validDto = {
    beneficiaryId: MOCK_BENEFICIARY_ID,
    justification: 'Paciente em risco de vida imediato — overdose confirmada na UPA.',
    emergencyType: EmergencyType.RISCO_VIDA,
  };

  beforeEach(async () => {
    prismaMock = buildPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BreakGlassService,
        { provide: 'PrismaService', useValue: prismaMock },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    })
      .overrideProvider(BreakGlassService)
      .useFactory({
        factory: () =>
          new BreakGlassService(
            prismaMock as any,
            mockAuditService as any,
            mockEventBus as any,
          ),
      })
      .compile();

    service = module.get<BreakGlassService>(BreakGlassService);
    jest.clearAllMocks();
  });

  describe('requestAccess()', () => {
    it('deve criar sessão Break-Glass ACTIVE para profissional válido', async () => {
      const result = await service.requestAccess(
        MOCK_PROFESSIONAL_ID,
        validDto,
        '10.0.0.1',
        'Jest/Test',
      );

      expect(result.status).toBe(BreakGlassStatus.ACTIVE);
      expect(result.beneficiaryId).toBe(MOCK_BENEFICIARY_ID);
      expect(result.professionalId).toBe(MOCK_PROFESSIONAL_ID);
      expect(result.auditLogId).toBe(MOCK_AUDIT_LOG_ID);
      expect(result.expiresAt).not.toBeNull();
    });

    it('deve registrar no AuditLog imutável com action=BREAK_GLASS_OVERRIDE', async () => {
      await service.requestAccess(MOCK_PROFESSIONAL_ID, validDto, '10.0.0.1', 'Jest/Test');

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: MOCK_PROFESSIONAL_ID,
          action: 'BREAK_GLASS_OVERRIDE',
          targetEntity: 'BENEFICIARY',
          targetEntityId: MOCK_BENEFICIARY_ID,
        }),
      );
    });

    it('deve publicar evento aura.security.break_glass.initiated.v1 no EventBus', async () => {
      await service.requestAccess(MOCK_PROFESSIONAL_ID, validDto, '10.0.0.1', 'Jest/Test');

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.security.break_glass.initiated.v1',
        expect.objectContaining({
          professionalId: MOCK_PROFESSIONAL_ID,
          beneficiaryId: MOCK_BENEFICIARY_ID,
          emergencyType: EmergencyType.RISCO_VIDA,
        }),
        expect.any(String),
        expect.objectContaining({ subject: MOCK_BENEFICIARY_ID }),
      );
    });

    it('deve lançar NotFoundException se beneficiário não existir', async () => {
      prismaMock.beneficiary.findUnique.mockResolvedValue(null);

      await expect(
        service.requestAccess(MOCK_PROFESSIONAL_ID, validDto, '10.0.0.1', 'Jest/Test'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se profissional não existir', async () => {
      prismaMock.professional.findUnique.mockResolvedValue(null);

      await expect(
        service.requestAccess(MOCK_PROFESSIONAL_ID, validDto, '10.0.0.1', 'Jest/Test'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve reutilizar sessão ACTIVE existente sem criar nova', async () => {
      const activeSession = {
        id: 'existing-session',
        status: BreakGlassStatus.ACTIVE,
        beneficiaryId: MOCK_BENEFICIARY_ID,
        professionalId: MOCK_PROFESSIONAL_ID,
        emergencyType: EmergencyType.RISCO_VIDA,
        justification: validDto.justification,
        approvedAt: new Date(),
        expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
        auditLogId: MOCK_AUDIT_LOG_ID,
        notificationSentAt: new Date(),
      };

      prismaMock.breakGlassSession.findFirst.mockResolvedValue(activeSession);

      const result = await service.requestAccess(
        MOCK_PROFESSIONAL_ID,
        validDto,
        '10.0.0.1',
        'Jest/Test',
      );

      expect(result.sessionId).toBe('existing-session');
      // Não deve criar nova sessão
      expect(prismaMock.breakGlassSession.create).not.toHaveBeenCalled();
    });
  });

  describe('revokeSession()', () => {
    it('deve revogar sessão ACTIVE com sucesso', async () => {
      await service.revokeSession(MOCK_SESSION_ID, 'gestor-001', '10.0.0.2', 'Admin/1.0');

      expect(prismaMock.breakGlassSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: MOCK_SESSION_ID },
          data: expect.objectContaining({ status: BreakGlassStatus.REVOKED }),
        }),
      );
    });

    it('deve lançar NotFoundException se sessão não existir', async () => {
      prismaMock.breakGlassSession.findUnique.mockResolvedValue(null);

      await expect(
        service.revokeSession('session-inexistente', 'gestor-001', '10.0.0.2', 'Admin/1.0'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se sessão não estiver ACTIVE', async () => {
      prismaMock.breakGlassSession.findUnique.mockResolvedValue({
        id: MOCK_SESSION_ID,
        status: BreakGlassStatus.EXPIRED,
        tenantId: 'default',
        beneficiaryId: MOCK_BENEFICIARY_ID,
      });

      await expect(
        service.revokeSession(MOCK_SESSION_ID, 'gestor-001', '10.0.0.2', 'Admin/1.0'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('hasActiveSession()', () => {
    it('deve retornar true se sessão ACTIVE existe', async () => {
      prismaMock.breakGlassSession.findFirst.mockResolvedValue({ id: MOCK_SESSION_ID });

      const result = await service.hasActiveSession(MOCK_PROFESSIONAL_ID, MOCK_BENEFICIARY_ID);
      expect(result).toBe(true);
    });

    it('deve retornar false se não há sessão ACTIVE', async () => {
      prismaMock.breakGlassSession.findFirst.mockResolvedValue(null);

      const result = await service.hasActiveSession(MOCK_PROFESSIONAL_ID, MOCK_BENEFICIARY_ID);
      expect(result).toBe(false);
    });
  });

  describe('expireStaleSessions()', () => {
    it('deve expirar sessões vencidas e retornar contagem', async () => {
      prismaMock.breakGlassSession.updateMany.mockResolvedValue({ count: 3 });

      const count = await service.expireStaleSessions();
      expect(count).toBe(3);
      expect(prismaMock.breakGlassSession.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: BreakGlassStatus.ACTIVE }),
          data: { status: BreakGlassStatus.EXPIRED },
        }),
      );
    });
  });
});
