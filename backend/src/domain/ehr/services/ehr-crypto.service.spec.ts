import { EhrCryptoService } from './ehr-crypto.service';

/**
 * Testes Unitários — EhrCryptoService (ANO-007: Key Versioning & Rotation)
 *
 * Cobre:
 * 1. Criptografia e descriptografia básica (caminho feliz)
 * 2. Retrocompatibilidade com formato v1 legado
 * 3. Criptografia com v2 (nova versão de chave)
 * 4. Detecção automática de versão no decrypt
 * 5. Idempotência (não re-criptografa dado já criptografado)
 * 6. rotateKey() — migração de v1 para v2
 * 7. Tratamento de null/undefined
 * 8. encryptFields / decryptFields em objetos
 */
describe('EhrCryptoService — ANO-007 Key Versioning', () => {
  let service: EhrCryptoService;

  beforeEach(() => {
    // Configura v1 e v2 via env para testes
    process.env.EHR_ENCRYPTION_KEY = 'a'.repeat(64); // 64 hex chars = 32 bytes
    process.env.EHR_ENCRYPTION_KEY_v2 = 'b'.repeat(64);
    process.env.EHR_ENCRYPTION_KEY_ACTIVE = 'v2';
    service = new EhrCryptoService();
  });

  afterEach(() => {
    delete process.env.EHR_ENCRYPTION_KEY;
    delete process.env.EHR_ENCRYPTION_KEY_v2;
    delete process.env.EHR_ENCRYPTION_KEY_ACTIVE;
  });

  // ── 1. Criptografia básica ──────────────────────────────────────────────────

  it('deve criptografar e descriptografar um texto com sucesso', () => {
    const plaintext = 'Paciente relata episódios de ansiedade intensa.';
    const cipher = service.encrypt(plaintext);

    expect(cipher).toBeTruthy();
    expect(cipher).not.toBe(plaintext);
    expect(cipher!.startsWith('enc:gcm:')).toBe(true);

    const decrypted = service.decrypt(cipher);
    expect(decrypted).toBe(plaintext);
  });

  // ── 2. Versão ativa ─────────────────────────────────────────────────────────

  it('deve usar v2 como versão ativa quando EHR_ENCRYPTION_KEY_ACTIVE=v2', () => {
    const cipher = service.encrypt('dado clínico');
    expect(cipher!.startsWith('enc:gcm:v2:')).toBe(true);
    expect(service.getActiveVersion()).toBe('v2');
  });

  it('deve listar as versões disponíveis', () => {
    const versions = service.getAvailableVersions();
    expect(versions).toContain('v1');
    expect(versions).toContain('v2');
  });

  // ── 3. Retrocompatibilidade com v1 ─────────────────────────────────────────

  it('deve descriptografar corretamente um ciphertext v1 legado', () => {
    // Cria instância apenas com v1 para simular dado legado
    delete process.env.EHR_ENCRYPTION_KEY_v2;
    delete process.env.EHR_ENCRYPTION_KEY_ACTIVE;
    const serviceV1Only = new EhrCryptoService();

    const plaintext = 'Nota clínica legada em v1';
    const cipherV1 = serviceV1Only.encrypt(plaintext);
    expect(cipherV1!.startsWith('enc:gcm:v1:')).toBe(true);

    // Serviço atual (com v1 e v2) deve conseguir descriptografar v1
    process.env.EHR_ENCRYPTION_KEY_v2 = 'b'.repeat(64);
    process.env.EHR_ENCRYPTION_KEY_ACTIVE = 'v2';
    const serviceBoth = new EhrCryptoService();
    const decrypted = serviceBoth.decrypt(cipherV1);
    expect(decrypted).toBe(plaintext);
  });

  it('deve descriptografar ciphertext v2 com chave v2', () => {
    const plaintext = 'Dado clínico novo em v2';
    const cipherV2 = service.encrypt(plaintext);
    expect(cipherV2!.startsWith('enc:gcm:v2:')).toBe(true);

    const decrypted = service.decrypt(cipherV2);
    expect(decrypted).toBe(plaintext);
  });

  // ── 4. Idempotência ─────────────────────────────────────────────────────────

  it('não deve re-criptografar um dado já criptografado (idempotente)', () => {
    const plaintext = 'Texto clínico';
    const cipher1 = service.encrypt(plaintext);
    const cipher2 = service.encrypt(cipher1!);
    expect(cipher2).toBe(cipher1);
  });

  // ── 5. rotateKey() ──────────────────────────────────────────────────────────

  it('rotateKey deve migrar ciphertext v1 para v2 (versão ativa)', () => {
    // Gera ciphertext v1
    delete process.env.EHR_ENCRYPTION_KEY_v2;
    delete process.env.EHR_ENCRYPTION_KEY_ACTIVE;
    const serviceV1 = new EhrCryptoService();
    const plaintext = 'Dado para rotacionar';
    const cipherV1 = serviceV1.encrypt(plaintext)!;
    expect(cipherV1.startsWith('enc:gcm:v1:')).toBe(true);

    // Serviço com v2 ativo rotaciona
    process.env.EHR_ENCRYPTION_KEY_v2 = 'b'.repeat(64);
    process.env.EHR_ENCRYPTION_KEY_ACTIVE = 'v2';
    const serviceBoth = new EhrCryptoService();
    const rotated = serviceBoth.rotateKey(cipherV1);

    expect(rotated).not.toBe(cipherV1);
    expect(rotated!.startsWith('enc:gcm:v2:')).toBe(true);

    // Dados devem ser idênticos após rotação
    const decryptedAfterRotation = serviceBoth.decrypt(rotated);
    expect(decryptedAfterRotation).toBe(plaintext);
  });

  it('rotateKey não deve modificar ciphertext já na versão ativa', () => {
    const plaintext = 'Dado já em v2';
    const cipherV2 = service.encrypt(plaintext)!;
    const result = service.rotateKey(cipherV2);
    expect(result).toBe(cipherV2); // Sem modificação
  });

  it('rotateKey deve retornar null para entrada null', () => {
    expect(service.rotateKey(null)).toBeNull();
    expect(service.rotateKey(undefined)).toBeNull();
  });

  // ── 6. null / undefined ─────────────────────────────────────────────────────

  it('encrypt deve retornar null para inputs nulos/vazios', () => {
    expect(service.encrypt(null)).toBeNull();
    expect(service.encrypt(undefined)).toBeNull();
    expect(service.encrypt('')).toBeNull();
  });

  it('decrypt deve retornar null para inputs nulos/vazios', () => {
    expect(service.decrypt(null)).toBeNull();
    expect(service.decrypt(undefined)).toBeNull();
  });

  it('decrypt deve retornar o texto original se não estiver criptografado', () => {
    const plaintext = 'texto sem prefixo';
    expect(service.decrypt(plaintext)).toBe(plaintext);
  });

  // ── 7. encryptFields / decryptFields ────────────────────────────────────────

  it('encryptFields deve criptografar apenas os campos indicados', () => {
    const record = {
      id: 'rec-001',
      chiefComplaint: 'Queixa principal sensível',
      professionalId: 'prof-001',
    };

    const encrypted = service.encryptFields(record, ['chiefComplaint']);

    expect(encrypted.id).toBe('rec-001');
    expect(encrypted.professionalId).toBe('prof-001');
    expect(encrypted.chiefComplaint.startsWith('enc:gcm:')).toBe(true);
  });

  it('decryptFields deve descriptografar apenas os campos indicados', () => {
    const record = {
      id: 'rec-002',
      chiefComplaint: service.encrypt('Queixa descriptografável')!,
      professionalId: 'prof-002',
    };

    const decrypted = service.decryptFields(record, ['chiefComplaint']);

    expect(decrypted.chiefComplaint).toBe('Queixa descriptografável');
    expect(decrypted.id).toBe('rec-002');
  });
});
