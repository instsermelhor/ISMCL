import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthenticationService } from './authentication.service';
import { SessionManagementService } from './session-management.service';
import { MfaService } from './mfa.service';
import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../prisma/prisma.service';

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-uuid-001',
  email: 'aurainstitutosermelhor@gmail.com',
  name: 'Super Administrador Aura',
  passwordHash: '$2b$10$hashedpassword',
  role: 'SUPER_USER_UNIVERSAL',
  status: 'ACTIVE',
  mfaEnabled: false,
  mfaSecret: null,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
};

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

const mockJwt = {
  signAsync: jest.fn().mockResolvedValue('mock.jwt.token'),
  verifyAsync: jest.fn(),
};

const mockConfig = {
  get: jest.fn((key: string, def?: unknown) => {
    const map: Record<string, unknown> = {
      JWT_SECRET: 'aura_dev_secret_CHANGE_IN_PRODUCTION_minimum_32_chars',
      JWT_EXPIRY: '15m',
      JWT_REFRESH_EXPIRY: '7d',
    };
    return map[key] ?? def;
  }),
};

const mockSession = {
  createSession: jest.fn().mockResolvedValue({ sessionId: 'session-001' }),
  validateSession: jest.fn().mockResolvedValue(true),
  revokeSession: jest.fn().mockResolvedValue(undefined),
};

const mockMfa = {
  verifyTotp: jest.fn().mockReturnValue(true),
  decryptSecret: jest.fn().mockImplementation((sec: string) => sec),
  encryptSecret: jest.fn().mockImplementation((sec: string) => `enc:gcm:v1:mock:${sec}`),
};

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

// ── Utilitário: mock de verificação de senha ──────────────────────────────────

jest.mock('../../../shared/utils/crypto.utils', () => ({
  verifyPassword: jest.fn().mockResolvedValue(true),
  hashPassword: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
}));

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('AuthenticationService — P107/P128/P132', () => {
  let service: AuthenticationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
        { provide: SessionManagementService, useValue: mockSession },
        { provide: MfaService, useValue: mockMfa },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
    jest.clearAllMocks();
  });

  // ── Login com sucesso ──────────────────────────────────────────────────────

  describe('login()', () => {
    it('deve retornar accessToken e perfil IAMUser no login bem-sucedido', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockSession.createSession.mockResolvedValue({ sessionId: 'sess-001' });

      const result = await service.login(
        { email: 'aurainstitutosermelhor@gmail.com', password: 'Aura@2026!FirstAccess' },
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(result.mfaRequired).toBe(false);
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.refreshToken).toBe('mock.jwt.token');
      expect(result.user!.email).toBe('aurainstitutosermelhor@gmail.com');
      expect(result.user!.primaryRole).toBe('super_user_universal');
      expect(result.user!.initials).toBe('SA');
    });

    it('deve publicar evento aura.auth.login.succeeded.v1 no login bem-sucedido', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await service.login(
        { email: mockUser.email, password: 'Aura@2025!' },
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.auth.login.succeeded.v1',
        expect.objectContaining({ userId: mockUser.id, email: mockUser.email }),
        'default',
        expect.any(Object),
      );
    });

    it('deve lançar UnauthorizedException se usuário não encontrado', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'wrong' }, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar ForbiddenException se conta está inativa', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, status: 'DISABLED' });

      await expect(
        service.login({ email: mockUser.email, password: 'Aura@2025!' }, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar UnauthorizedException se senha incorreta', async () => {
      const { verifyPassword } = require('../../../shared/utils/crypto.utils');
      verifyPassword.mockResolvedValueOnce(false);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.login({ email: mockUser.email, password: 'wrong_password' }, '127.0.0.1', 'Mozilla'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve publicar aura.auth.login.failed.v1 em caso de falha', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      try {
        await service.login({ email: 'hacker@evil.com', password: 'wrong' }, '10.0.0.1', 'bot');
      } catch {}

      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.auth.login.failed.v1',
        expect.objectContaining({ email: 'hacker@evil.com' }),
        'default',
      );
    });

    it('deve retornar mfaRequired=true quando MFA está habilitado e código não fornecido', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, mfaEnabled: true, mfaSecret: 'JBSWY3DPEHPK3PXP' });
      const { verifyPassword } = require('../../../shared/utils/crypto.utils');
      verifyPassword.mockResolvedValueOnce(true);

      const result = await service.login(
        { email: mockUser.email, password: 'Aura@2025!' },
        '127.0.0.1',
        'Mozilla',
      );

      expect((result as any).mfaRequired).toBe(true);
    });

    it('deve lançar UnauthorizedException se código MFA inválido', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, mfaEnabled: true, mfaSecret: 'JBSWY3DPEHPK3PXP' });
      const { verifyPassword } = require('../../../shared/utils/crypto.utils');
      verifyPassword.mockResolvedValueOnce(true);
      mockMfa.verifyTotp.mockReturnValueOnce(false);

      await expect(
        service.login(
          { email: mockUser.email, password: 'Aura@2025!', mfaCode: '000000' },
          '127.0.0.1',
          'Mozilla',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ── refreshToken() ─────────────────────────────────────────────────────────

  describe('refreshToken()', () => {
    it('deve renovar tokens com refresh token válido', async () => {
      mockJwt.verifyAsync.mockResolvedValue({ sub: mockUser.id, sessionId: 'sess-001' });
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const tokens = await service.refreshToken('valid.refresh.token');

      expect(tokens.accessToken).toBe('mock.jwt.token');
      expect(tokens.tokenType).toBe('Bearer');
    });

    it('deve lançar UnauthorizedException se refresh token inválido', async () => {
      mockJwt.verifyAsync.mockRejectedValue(new Error('invalid'));

      await expect(service.refreshToken('expired.token')).rejects.toThrow(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException se usuário foi desativado após emissão do refresh token', async () => {
      mockJwt.verifyAsync.mockResolvedValue({ sub: mockUser.id, sessionId: 'sess-001' });
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, status: 'DISABLED' });

      await expect(service.refreshToken('valid.refresh.token')).rejects.toThrow(UnauthorizedException);
    });
  });
});
