import * as fs from 'fs';
import * as path from 'path';

describe('AURA SECRETS MANAGEMENT & SCANNING SPEC (PROMPT 203)', () => {
  const repoRoot = path.resolve(__dirname, '../../../../../');

  it('deve garantir que nenhum arquivo no código-fonte contenha segredos reais hardcoded', () => {
    // JavaScript regex: use /pattern/i flag instead of (?i) PCRE inline flag
    const suspiciousPatterns = [
      /cora_sec_live_[0-9a-zA-Z_]{10,}/i,
      /postgres:\/\/aura:aura_k8s_prod_secure_password@/i,
      /-----BEGIN RSA PRIVATE KEY-----/,
    ];

    const filesToScan = [
      path.join(repoRoot, 'src/services/pixConfigService.ts'),
      path.join(repoRoot, 'infra/k8s/02-configmap-secrets.yaml'),
    ];

    for (const filePath of filesToScan) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        for (const pattern of suspiciousPatterns) {
          const match = content.match(pattern);
          expect(match).toBeNull();
        }
      }
    }
  });

  it('deve validar que variáveis de ambiente em produção utilizam placeholders seguros', () => {
    const k8sManifest = path.join(repoRoot, 'infra/k8s/02-configmap-secrets.yaml');
    if (fs.existsSync(k8sManifest)) {
      const content = fs.readFileSync(k8sManifest, 'utf-8');
      expect(content).toContain('${AURA_POSTGRES_PASSWORD}');
      expect(content).toContain('${AURA_JWT_SECRET}');
    }
  });
});
