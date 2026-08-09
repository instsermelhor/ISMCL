import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../prisma/prisma.service';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockUserRecord = {
  id: 'uuid-identity-001',
  name: 'Ana Paula Souza',
  email: 'ana.souza@institutosm.org.br',
  cpf: '12345678901',
  phone: '(11) 98765-4321',
  role: 'PROFESSIONAL',
  status: 'ACTIVE',
  mfaEnabled: false,
  organizationId: 'org-ism-001',
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date('2025-01-15'),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
};

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

// Mocks de validadores e crypto
jest.mock('../../../shared/utils/validators', () => ({
  isValidEmail: jest.fn((email: string) => email.includes('@') && email.includes('.')),
  isValidCPF: jest.fn(() => true),
}));

jest.mock('../../../shared/utils/crypto.utils', () => ({
  hashPassword: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  verifyPassword: jest.fn().mockResolvedValue(true),
}));

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('IdentityService — P107/P123/P132', () => {
  let service: IdentityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<IdentityService>(IdentityService);
    jest.clearAllMocks();
  });

  // ── registerUser() ─────────────────────────────────────────────────────────

  describe('registerUser()', () => {
    it('deve registrar nova identidade e publicar evento CloudEvents', async () => {
      (mockPrisma.user as any).findFirst = jest.fn().mockResolvedValue(null);
      (mockPrisma.user as any).create = jest.fn().mockResolvedValue(mockUserRecord);

      const result = await service.registerUser({
        email: 'ana.souza@institutosm.org.br',
        cpf: '123.456.789-01',
        password: 'SenhaSegura@2025',
        fullName: 'Ana Paula Souza',
        phone: '(11) 98765-4321',
        organizationId: 'org-ism-001',
      });

      expect(result.id).toBe('uuid-identity-001');
      expect(result.email).toBe('ana.souza@institutosm.org.br');
      expect(result.role).toBe('PROFESSIONAL');

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.identity.user.created.v1',
        expect.objectContaining({ userId: 'uuid-identity-001', email: 'ana.souza@institutosm.org.br' }),
        'default',
        expect.any(Object),
      );
    });
  });

  // ── findById() ─────────────────────────────────────────────────────────────

  describe('findById()', () => {
    it('deve retornar usuário por ID com campos selecionados', async () => {
      (mockPrisma.user as any).findUnique = jest.fn().mockResolvedValue(mockUserRecord);

      const user = await service.findById('uuid-identity-001');

      expect(user.id).toBe('uuid-identity-001');
      expect(user.email).toBe('ana.souza@institutosm.org.br');
      expect((mockPrisma.user as any).findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'uuid-identity-001' } }),
      );
    });

    it('deve lançar NotFoundException se usuário não existe', async () => {
      (mockPrisma.user as any).findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.findById('uuid-inexistente')).rejects.toThrow(NotFoundException);
    });
  });

  // ── disableUser() ─────────────────────────────────────────────────────────

  describe('disableUser()', () => {
    it('deve desativar conta e publicar evento aura.identity.user.disabled.v1', async () => {
      mockPrisma.user.update.mockResolvedValue({ ...mockUserRecord, status: 'DISABLED' });

      const result = await service.disableUser('uuid-identity-001', 'Violação de conduta', 'ism-tenant');

      expect(result.status).toBe('DISABLED');
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.identity.user.disabled.v1',
        expect.objectContaining({ userId: 'uuid-identity-001', reason: 'Violação de conduta' }),
        'ism-tenant',
        expect.any(Object),
      );
    });
  });
});
