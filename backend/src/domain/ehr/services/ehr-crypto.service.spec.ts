import { EhrCryptoService } from './ehr-crypto.service';

describe('EhrCryptoService — GAP-P1-02 (Criptografia AES-256-GCM em Repouso)', () => {
  let service: EhrCryptoService;

  beforeEach(() => {
    service = new EhrCryptoService();
  });

  it('deve ser instanciado corretamente', () => {
    expect(service).toBeDefined();
  });

  describe('encrypt & decrypt', () => {
    it('deve criptografar um texto claro adicionando o prefixo enc:gcm:v1:', () => {
      const plaintext = 'Paciente relata episódios de ansiedade intensa e insônia.';
      const encrypted = service.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(encrypted).not.toEqual(plaintext);
      expect(encrypted?.startsWith('enc:gcm:v1:')).toBe(true);
    });

    it('deve descriptografar corretamente um texto cifrado de volta ao formato original', () => {
      const originalText = 'Evolução psicológica: paciente apresentou melhora no quadro depressivo após intervenção.';
      const encrypted = service.encrypt(originalText);
      const decrypted = service.decrypt(encrypted);

      expect(decrypted).toEqual(originalText);
    });

    it('deve retornar a própria string se o texto já for legível e sem prefixo', () => {
      const unencryptedText = 'Texto legível antigo';
      const result = service.decrypt(unencryptedText);

      expect(result).toEqual(unencryptedText);
    });

    it('deve lidar com entradas nulas ou vazias de forma segura', () => {
      expect(service.encrypt(null)).toBeNull();
      expect(service.encrypt('')).toBeNull();
      expect(service.decrypt(null)).toBeNull();
      expect(service.decrypt('')).toBeNull();
    });
  });

  describe('encryptFields & decryptFields', () => {
    it('deve criptografar e descriptografar múltiplos campos de um objeto de evolução clínica', () => {
      const clinicalRecord = {
        id: 'note-123',
        beneficiaryId: 'patient-456',
        subjective: 'Paciente com alta vulnerabilidade social.',
        assessment: 'Encaminhamento para acolhimento psicológico.',
      };

      const encryptedRecord = service.encryptFields(clinicalRecord, ['subjective', 'assessment']);

      expect(encryptedRecord.subjective.startsWith('enc:gcm:v1:')).toBe(true);
      expect(encryptedRecord.assessment.startsWith('enc:gcm:v1:')).toBe(true);
      expect(encryptedRecord.id).toEqual('note-123');

      const decryptedRecord = service.decryptFields(encryptedRecord, ['subjective', 'assessment']);

      expect(decryptedRecord.subjective).toEqual(clinicalRecord.subjective);
      expect(decryptedRecord.assessment).toEqual(clinicalRecord.assessment);
    });
  });
});
