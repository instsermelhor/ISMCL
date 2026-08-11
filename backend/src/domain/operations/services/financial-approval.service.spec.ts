import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { FinancialApprovalService } from './financial-approval.service';
import {
  CreateFinancialTransactionDto,
  ApproveFinancialTransactionDto,
  RejectFinancialTransactionDto,
  FinancialTransactionCategory,
  FinancialTransactionStatus,
} from '../dto/financial-approval.dto';

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

// ── Helpers de fixture ────────────────────────────────────────────────────────

const makeTxDto = (amount: number): CreateFinancialTransactionDto =>
  Object.assign(new CreateFinancialTransactionDto(), {
    description: 'Aquisição de licenças',
    amount,
    category: FinancialTransactionCategory.SOFTWARE_LICENSE,
    costCenter: 'CC-TI-001',
  });

const makeApproveDto = (justification?: string): ApproveFinancialTransactionDto =>
  Object.assign(new ApproveFinancialTransactionDto(), { justification });

const makeRejectDto = (reason: string): RejectFinancialTransactionDto =>
  Object.assign(new RejectFinancialTransactionDto(), { reason });

// ── Suite principal ───────────────────────────────────────────────────────────

describe('FinancialApprovalService', () => {
  let service: FinancialApprovalService;

  beforeEach(async () => {
    mockEventBus.publish.mockClear();
    mockAuditService.log.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialApprovalService,
        { provide: 'EventBusService', useValue: mockEventBus },
        { provide: 'AuditService', useValue: mockAuditService },
      ],
    })
      .overrideProvider(FinancialApprovalService)
      .useFactory({
        factory: () =>
          new (FinancialApprovalService as any)(mockEventBus, mockAuditService),
      })
      .compile();

    service = module.get<FinancialApprovalService>(FinancialApprovalService);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // checkAuthority
  // ────────────────────────────────────────────────────────────────────────────

  describe('checkAuthority()', () => {
    it('deve permitir OPERADOR para R$ 4.999 (abaixo do limite de R$ 5.000)', () => {
      const result = service.checkAuthority('OPERADOR', 4999);
      expect(result.allowed).toBe(true);
      expect(result.maxLimitAllowed).toBe(5000);
      expect(result.dualApprovalRequired).toBe(false);
    });

    it('deve bloquear OPERADOR para R$ 5.001 (acima do limite de R$ 5.000)', () => {
      const result = service.checkAuthority('OPERADOR', 5001);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Alçada insuficiente');
    });

    it('deve permitir COORDENADOR para exatamente R$ 10.000 (no limite)', () => {
      const result = service.checkAuthority('COORDENADOR', 10000);
      expect(result.allowed).toBe(true);
      expect(result.dualApprovalRequired).toBe(false);
    });

    it('deve bloquear COORDENADOR para R$ 10.001 (acima do limite)', () => {
      const result = service.checkAuthority('COORDENADOR', 10001);
      expect(result.allowed).toBe(false);
    });

    it('deve exigir dupla aprovação para qualquer valor > R$ 10.000', () => {
      const result = service.checkAuthority('GESTOR', 15000);
      expect(result.allowed).toBe(true);
      expect(result.dualApprovalRequired).toBe(true);
      expect(result.requiredApprovalsCount).toBe(2);
    });

    it('SUPER_ADMIN deve ter limite ilimitado (Infinity)', () => {
      const result = service.checkAuthority('SUPER_ADMIN', 999_999_999);
      expect(result.allowed).toBe(true);
      expect(result.maxLimitAllowed).toBe(Infinity);
    });

    it('papel desconhecido deve ter limite R$ 0 (negado qualquer valor > 0)', () => {
      const result = service.checkAuthority('ESTAGIARIO', 1);
      expect(result.allowed).toBe(false);
      expect(result.maxLimitAllowed).toBe(0);
    });

    it('deve ser case-insensitive para o papel (gestor === GESTOR)', () => {
      const lower = service.checkAuthority('gestor', 30000);
      const upper = service.checkAuthority('GESTOR', 30000);
      expect(lower.allowed).toBe(upper.allowed);
      expect(lower.maxLimitAllowed).toBe(upper.maxLimitAllowed);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // createTransaction
  // ────────────────────────────────────────────────────────────────────────────

  describe('createTransaction()', () => {
    it('deve criar transação com status PENDING e publicar evento', async () => {
      const dto = makeTxDto(3000);
      const record = await service.createTransaction(dto, 'user-001', 'Ana Silva', 'tenant-01');

      expect(record.id).toMatch(/^tx-/);
      expect(record.status).toBe(FinancialTransactionStatus.PENDING);
      expect(record.amount).toBe(3000);
      expect(record.requestedById).toBe('user-001');
      expect(record.tenantId).toBe('tenant-01');
      expect(record.approvals).toHaveLength(0);

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.financial.transaction.created.v1',
        expect.objectContaining({ transactionId: record.id, amount: 3000 }),
        'tenant-01',
        expect.any(Object),
      );
    });

    it('deve usar CC-GENERAL como costCenter padrão quando não informado', async () => {
      const dto = makeTxDto(500);
      dto.costCenter = undefined;
      const record = await service.createTransaction(dto, 'user-002', 'Carlos', 'default');
      expect(record.costCenter).toBe('CC-GENERAL');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // approveTransaction — fluxo de aprovação simples (< R$ 10.000)
  // ────────────────────────────────────────────────────────────────────────────

  describe('approveTransaction() — valor ≤ R$ 10.000 (aprovação única)', () => {
    it('deve completar a transação com uma única aprovação de COORDENADOR', async () => {
      const tx = await service.createTransaction(makeTxDto(8000), 'user-A', 'Alice', 'ten-1');

      const result = await service.approveTransaction(
        tx.id,
        makeApproveDto('Aprovado conforme orçamento Q3'),
        'coord-001',
        'COORDENADOR',
        'Beatriz Coord',
      );

      expect(result.status).toBe(FinancialTransactionStatus.COMPLETED);
      expect(result.approvals).toHaveLength(1);
      expect(result.approvals[0].approverId).toBe('coord-001');

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'FINANCIAL_TRANSACTION_APPROVED' }),
      );
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.financial.transaction.completed.v1',
        expect.objectContaining({ transactionId: tx.id }),
        'ten-1',
        expect.any(Object),
      );
    });

    it('deve bloquear OPERADOR tentando aprovar transação de R$ 7.000 (acima do seu limite)', async () => {
      const tx = await service.createTransaction(makeTxDto(7000), 'user-B', 'Bruno', 'ten-1');

      await expect(
        service.approveTransaction(tx.id, makeApproveDto(), 'op-001', 'OPERADOR', 'Carlos Op'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UNAUTHORIZED_FINANCIAL_APPROVAL_ATTEMPT' }),
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // approveTransaction — dupla aprovação (> R$ 10.000)
  // ────────────────────────────────────────────────────────────────────────────

  describe('approveTransaction() — valor > R$ 10.000 (dupla aprovação)', () => {
    it('deve mover para PENDING_SECOND_APPROVAL após 1ª aprovação', async () => {
      const tx = await service.createTransaction(makeTxDto(25000), 'user-C', 'Carla', 'ten-2');

      const result = await service.approveTransaction(
        tx.id,
        makeApproveDto('1ª aprovação gestora'),
        'gestor-001',
        'GESTOR',
        'Daniela Gestora',
      );

      expect(result.status).toBe(FinancialTransactionStatus.PENDING_SECOND_APPROVAL);
      expect(result.approvals).toHaveLength(1);

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.financial.transaction.partially_approved.v1',
        expect.objectContaining({ approvalsCount: 1, requiredApprovalsCount: 2 }),
        'ten-2',
        expect.any(Object),
      );
    });

    it('deve CONCLUIR a transação com 2 aprovadores distintos', async () => {
      const tx = await service.createTransaction(makeTxDto(20000), 'user-D', 'Diego', 'ten-2');

      // 1ª aprovação
      await service.approveTransaction(
        tx.id,
        makeApproveDto('1ª aprovação'),
        'gestor-001',
        'GESTOR',
        'Eva Gestora',
      );

      // 2ª aprovação — aprovador diferente
      const final = await service.approveTransaction(
        tx.id,
        makeApproveDto('2ª aprovação complementar'),
        'gestor-002',
        'GESTOR',
        'Fábio Gestor',
      );

      expect(final.status).toBe(FinancialTransactionStatus.COMPLETED);
      expect(final.approvals).toHaveLength(2);
      expect(final.approvals.map((a) => a.approverId)).toEqual(['gestor-001', 'gestor-002']);
    });

    it('deve bloquear auto-aprovação dupla (mesmo aprovador 2x)', async () => {
      const tx = await service.createTransaction(makeTxDto(15000), 'user-E', 'Elisa', 'ten-3');

      await service.approveTransaction(
        tx.id,
        makeApproveDto(),
        'gestor-AAA',
        'GESTOR',
        'Gustavo',
      );

      await expect(
        service.approveTransaction(
          tx.id,
          makeApproveDto('Tentativa de auto-aprovação dupla'),
          'gestor-AAA', // mesmo ID!
          'GESTOR',
          'Gustavo',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve bloquear COORDENADOR tentando aprovar transação de R$ 15.000 (acima do limite)', async () => {
      const tx = await service.createTransaction(makeTxDto(15000), 'user-F', 'Felipe', 'ten-3');

      await expect(
        service.approveTransaction(tx.id, makeApproveDto(), 'coord-002', 'COORDENADOR', 'Hana Coord'),
      ).rejects.toThrow(ForbiddenException);

      // Deve gerar audit log da tentativa não autorizada
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'UNAUTHORIZED_FINANCIAL_APPROVAL_ATTEMPT' }),
      );
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // approveTransaction — edge cases
  // ────────────────────────────────────────────────────────────────────────────

  describe('approveTransaction() — edge cases', () => {
    it('deve lançar NotFoundException para transactionId inexistente', async () => {
      await expect(
        service.approveTransaction('tx-INVALIDO', makeApproveDto(), 'u1', 'GESTOR', 'Igor'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException ao tentar aprovar transação já COMPLETED', async () => {
      const tx = await service.createTransaction(makeTxDto(3000), 'user-G', 'Giovana', 'ten-4');

      // Completa a transação
      await service.approveTransaction(tx.id, makeApproveDto(), 'gestor-X', 'GESTOR', 'Xisto');

      // Tenta aprovar novamente após concluída
      await expect(
        service.approveTransaction(tx.id, makeApproveDto(), 'gestor-Y', 'GESTOR', 'Yolanda'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException ao aprovar transação REJECTED', async () => {
      const tx = await service.createTransaction(makeTxDto(2000), 'user-H', 'Helena', 'ten-5');
      await service.rejectTransaction(tx.id, makeRejectDto('Sem orçamento'), 'u-rej', 'GESTOR', 'Igor Rej');

      await expect(
        service.approveTransaction(tx.id, makeApproveDto(), 'gestor-Z', 'GESTOR', 'Zeno'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // rejectTransaction
  // ────────────────────────────────────────────────────────────────────────────

  describe('rejectTransaction()', () => {
    it('deve rejeitar transação e publicar evento de rejeição', async () => {
      const tx = await service.createTransaction(makeTxDto(5000), 'user-I', 'Inês', 'ten-6');

      const rejected = await service.rejectTransaction(
        tx.id,
        makeRejectDto('Fora do escopo do projeto'),
        'gestor-rej',
        'GESTOR',
        'Joaquim Gestor',
      );

      expect(rejected.status).toBe(FinancialTransactionStatus.REJECTED);
      expect(rejected.rejectionReason).toBe('Fora do escopo do projeto');

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.financial.approval.rejected.v1',
        expect.objectContaining({ transactionId: tx.id }),
        'ten-6',
        expect.any(Object),
      );
    });

    it('deve lançar NotFoundException para transactionId inexistente', async () => {
      await expect(
        service.rejectTransaction('tx-NAO-EXISTE', makeRejectDto('Motivo'), 'u1', 'GESTOR', 'Karen'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // listTransactions / getTransactionById
  // ────────────────────────────────────────────────────────────────────────────

  describe('listTransactions() / getTransactionById()', () => {
    it('deve retornar lista vazia inicialmente', async () => {
      const list = await service.listTransactions();
      expect(list).toEqual([]);
    });

    it('deve retornar múltiplas transações em ordem cronológica inversa', async () => {
      await service.createTransaction(makeTxDto(1000), 'u1', 'User1', 't1');
      await service.createTransaction(makeTxDto(2000), 'u2', 'User2', 't1');

      const list = await service.listTransactions();
      expect(list).toHaveLength(2);
      // Mais recente primeiro
      expect(list[0].amount).toBe(2000);
      expect(list[1].amount).toBe(1000);
    });

    it('deve recuperar transação específica por ID', async () => {
      const tx = await service.createTransaction(makeTxDto(777), 'u3', 'User3', 't2');
      const found = await service.getTransactionById(tx.id);
      expect(found.id).toBe(tx.id);
      expect(found.amount).toBe(777);
    });

    it('deve lançar NotFoundException para ID inexistente em getTransactionById', async () => {
      await expect(service.getTransactionById('tx-FANTASMA')).rejects.toThrow(NotFoundException);
    });
  });
});
