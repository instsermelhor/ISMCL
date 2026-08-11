import { softDeleteMiddleware } from './soft-delete.middleware';

describe('softDeleteMiddleware — ANO-008 Soft Delete LGPD', () => {
  let nextMock: jest.Mock;

  beforeEach(() => {
    nextMock = jest.fn().mockImplementation((params) => Promise.resolve({ success: true, params }));
  });

  it('deve converter delete em update com deletedAt', async () => {
    const params: any = {
      model: 'User',
      action: 'delete',
      args: { where: { id: 'u-1' } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.action).toBe('update');
    expect(params.args.data.deletedAt).toBeInstanceOf(Date);
  });

  it('deve converter deleteMany em updateMany com deletedAt', async () => {
    const params: any = {
      model: 'Beneficiary',
      action: 'deleteMany',
      args: { where: { status: 'INACTIVE' } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.action).toBe('updateMany');
    expect(params.args.data.deletedAt).toBeInstanceOf(Date);
  });

  it('deve injetar deletedAt: null no findMany', async () => {
    const params: any = {
      model: 'Case',
      action: 'findMany',
      args: { where: { status: 'ACTIVE' } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.args.where.deletedAt).toBeNull();
    expect(params.args.where.status).toBe('ACTIVE');
  });

  it('deve converter findUnique em findFirst com deletedAt: null', async () => {
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

  it('não deve alterar operações em modelos fora do escopo de soft delete', async () => {
    const params: any = {
      model: 'AuditLogSignature', // Não está em SOFT_DELETE_MODELS
      action: 'delete',
      args: { where: { id: 'log-1' } },
    };

    await softDeleteMiddleware(params, nextMock);

    expect(params.action).toBe('delete'); // Mantém delete original
  });
});
