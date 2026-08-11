import { softDeleteMiddleware } from './soft-delete.middleware';

describe('softDeleteMiddleware — ANO-008 Soft Delete LGPD (Sprint R4 + R5)', () => {
  let nextMock: jest.Mock;

  beforeEach(() => {
    nextMock = jest.fn().mockImplementation((params) => Promise.resolve({ success: true, params }));
  });

  // ─── Sprint R4 — modelos originais ──────────────────────────────────────────

  it('deve converter delete em update com deletedAt (User)', async () => {
    const params: any = {
      model: 'User',
      action: 'delete',
      args: { where: { id: 'u-1' } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.action).toBe('update');
    expect(params.args.data.deletedAt).toBeInstanceOf(Date);
  });

  it('deve converter deleteMany em updateMany com deletedAt (Beneficiary)', async () => {
    const params: any = {
      model: 'Beneficiary',
      action: 'deleteMany',
      args: { where: { status: 'INACTIVE' } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.action).toBe('updateMany');
    expect(params.args.data.deletedAt).toBeInstanceOf(Date);
  });

  it('deve injetar deletedAt: null no findMany (Case)', async () => {
    const params: any = {
      model: 'Case',
      action: 'findMany',
      args: { where: { status: 'ACTIVE' } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.args.where.deletedAt).toBeNull();
    expect(params.args.where.status).toBe('ACTIVE');
  });

  it('deve converter findUnique em findFirst com deletedAt: null (ClinicalEvolution)', async () => {
    const params: any = {
      model: 'ClinicalEvolution',
      action: 'findUnique',
      args: { where: { id: 'evo-100' } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.action).toBe('findFirst');
    expect(params.args.where.deletedAt).toBeNull();
    expect(params.args.where.id).toBe('evo-100');
  });

  it('não deve alterar operações em modelos fora do escopo de soft delete (AuditLogSignature)', async () => {
    const params: any = {
      model: 'AuditLogSignature', // imutável — não está em SOFT_DELETE_MODELS
      action: 'delete',
      args: { where: { id: 'log-1' } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.action).toBe('delete'); // Mantém delete original
  });

  // ─── Sprint R5 — novos modelos ───────────────────────────────────────────────

  it('deve aplicar soft delete em Anamnesis (dado clínico sensível)', async () => {
    const params: any = {
      model: 'Anamnesis',
      action: 'delete',
      args: { where: { id: 'ana-001' } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.action).toBe('update');
    expect(params.args.data.deletedAt).toBeInstanceOf(Date);
  });

  it('deve aplicar soft delete em Donor (dados pessoais — CPF, e-mail)', async () => {
    const params: any = {
      model: 'Donor',
      action: 'delete',
      args: { where: { id: 'donor-001' } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.action).toBe('update');
    expect(params.args.data.deletedAt).toBeInstanceOf(Date);
  });

  it('deve filtrar DataConsent excluídos no findMany (base legal ativa)', async () => {
    const params: any = {
      model: 'DataConsent',
      action: 'findMany',
      args: { where: { entityType: 'BENEFICIARY', isActive: true } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.args.where.deletedAt).toBeNull();
    expect(params.args.where.entityType).toBe('BENEFICIARY');
  });

  it('deve aplicar soft delete em DataSubjectRequest (requisição titular LGPD)', async () => {
    const params: any = {
      model: 'DataSubjectRequest',
      action: 'delete',
      args: { where: { id: 'dsr-001' } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.action).toBe('update');
    expect(params.args.data.deletedAt).toBeInstanceOf(Date);
  });

  it('deve aplicar soft delete em ProtectedProfile (perfil altamente sensível)', async () => {
    const params: any = {
      model: 'ProtectedProfile',
      action: 'delete',
      args: { where: { id: 'pp-001' } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.action).toBe('update');
    expect(params.args.data.deletedAt).toBeInstanceOf(Date);
  });

  it('deve aplicar soft delete em SocialProgram (programa institucional)', async () => {
    const params: any = {
      model: 'SocialProgram',
      action: 'delete',
      args: { where: { id: 'sp-001' } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.action).toBe('update');
    expect(params.args.data.deletedAt).toBeInstanceOf(Date);
  });

  it('não deve alterar modelos de log imutável no escopo R5 (DataProcessingLog)', async () => {
    const params: any = {
      model: 'DataProcessingLog', // log imutável — não deve ter soft delete
      action: 'delete',
      args: { where: { id: 'dpl-001' } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.action).toBe('delete'); // permanece inalterado
  });
});
