import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { MfaService } from './mfa.service';

describe('MfaService — GAP-P2-02 (Fluxo Completo MFA TOTP e Criptografia AES-256-GCM)', () => {
  let service: MfaService;
  let prismaMock: any;

  const mockUser = {
    id: 'user-mfa-001',
    email: 'profissional@sermelhor.org.br',
    mfaEnabled: false,
    mfaSecret: null as string | null,
  };

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn().mockImplementation(() => Promise.resolve({ ...mockUser })),
        update: jest.fn().mockImplementation(({ data }) => {
          Object.assign(mockUser, data);
          return Promise.resolve({ ...mockUser });
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MfaService,
        { provide: 'PrismaService', useValue: prismaMock },
      ],
    })
      .overrideProvider(MfaService)
      .useFactory({
        factory: () => new MfaService(prismaMock),
      })
      .compile();

    service = module.get<MfaService>(MfaService);
    mockUser.mfaEnabled = false;
    mockUser.mfaSecret = null;
    jest.clearAllMocks();
  });

  describe('Criptografia AES-256-GCM (encryptSecret / decryptSecret)', () => {
    it('deve cifrar o segredo TOTP com prefixo enc:gcm:v1:', () => {
      const rawSecret = 'JBSWY3DPEHPK3PXP';
      const encrypted = service.encryptSecret(rawSecret);

      expect(encrypted).not.toBe(rawSecret);
      expect(encrypted.startsWith('enc:gcm:v1:')).toBe(true);
    });

    it('deve descriptografar o segredo cifrado retornando o segredo original', () => {
      const rawSecret = 'JBSWY3DPEHPK3PXP';
      const encrypted = service.encryptSecret(rawSecret);
      const decrypted = service.decryptSecret(encrypted);

      expect(decrypted).toBe(rawSecret);
    });

    it('deve retornar a string original se for legada em texto plano', () => {
      const rawPlainSecret = 'JBSWY3DPEHPK3PXP';
      const decrypted = service.decryptSecret(rawPlainSecret);

      expect(decrypted).toBe(rawPlainSecret);
    });
  });

  describe('generateMfaSetup()', () => {
    it('deve gerar segredo Base32, URL QR-Code OTPAuth e 10 códigos de recuperação', () => {
      const setup = service.generateMfaSetup('teste@sermelhor.org.br');

      expect(setup.secret).toBeDefined();
      expect(setup.secret.length).toBeGreaterThanOrEqual(16);
      expect(setup.qrCodeUrl).toContain('otpauth://totp/');
      expect(setup.qrCodeUrl).toContain('teste%40sermelhor.org.br');
      expect(setup.recoveryCodes).toHaveLength(10);
    });
  });

  describe('setupMfaForUser()', () => {
    it('deve salvar o segredo TOTP cifrado no banco de dados', async () => {
      const setup = await service.setupMfaForUser(mockUser.id, mockUser.email);

      expect(setup.secret).toBeDefined();
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUser.id },
          data: expect.objectContaining({
            mfaSecret: expect.stringMatching(/^enc:gcm:v1:/),
          }),
        }),
      );
    });
  });

  describe('verifyAndEnableMfa()', () => {
    it('deve ativar mfaEnabled = true ao fornecer o código TOTP correto', async () => {
      const setup = await service.setupMfaForUser(mockUser.id, mockUser.email);
      // Gera token TOTP válido para o segredo recém gerado
      const validCode = (service as any).generateTotpToken(
        setup.secret,
        Math.floor(Date.now() / 1000 / 30),
      );

      const result = await service.verifyAndEnableMfa(mockUser.id, validCode, setup.secret);

      expect(result.valid).toBe(true);
      expect(result.mfaEnabled).toBe(true);
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ mfaEnabled: true }),
        }),
      );
    });

    it('deve rejeitar código TOTP incorreto com BadRequestException', async () => {
      await service.setupMfaForUser(mockUser.id, mockUser.email);

      await expect(
        service.verifyAndEnableMfa(mockUser.id, '000000', 'JBSWY3DPEHPK3PXP'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyTotp()', () => {
    it('deve retornar false para códigos nulos, vazios ou com menos de 6 dígitos', () => {
      expect(service.verifyTotp('JBSWY3DPEHPK3PXP', '')).toBe(false);
      expect(service.verifyTotp('JBSWY3DPEHPK3PXP', '12345')).toBe(false);
      expect(service.verifyTotp('JBSWY3DPEHPK3PXP', 'abc123')).toBe(false);
    });
  });

  describe('disableMfaForUser()', () => {
    it('deve desativar o MFA ao receber o código correto', async () => {
      const setup = await service.setupMfaForUser(mockUser.id, mockUser.email);
      mockUser.mfaEnabled = true;

      const validCode = (service as any).generateTotpToken(
        setup.secret,
        Math.floor(Date.now() / 1000 / 30),
      );

      const result = await service.disableMfaForUser(mockUser.id, validCode);

      expect(result.mfaEnabled).toBe(false);
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { mfaEnabled: false, mfaSecret: null },
        }),
      );
    });

    it('deve rejeitar a desativação se o código estiver incorreto', async () => {
      await service.setupMfaForUser(mockUser.id, mockUser.email);
      mockUser.mfaEnabled = true;

      await expect(service.disableMfaForUser(mockUser.id, '999999')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
