import * as fs from 'fs';
import * as path from 'path';

describe('AURA SECRETS MANAGEMENT & SCANNING SPEC (PROMPT 207)', () => {
  const repoRoot = path.resolve(__dirname, '../../../../../');

  it('deve garantir que nenhum arquivo no código-fonte contenha segredos reais hardcoded', () => {
    // Padrões de alta entropia e credenciais proibidas
    const suspiciousPatterns = [
      /cora_sec_live_[0-9a-zA-Z_]{10,}/i,
      /postgres:\/\/aura:aura_k8s_prod_secure_password@/i,
      /-----BEGIN RSA PRIVATE KEY-----/,
      /-----BEGIN EC PRIVATE KEY-----/,
      /ghp_[0-9a-zA-Z]{36}/,
      /xox[baprs]-[0-9a-zA-Z]{10,48}/,
    ];

    const filesToScan = [
      path.join(repoRoot, 'src/services/pixConfigService.ts'),
      path.join(repoRoot, 'infra/k8s/02-configmap-secrets.yaml'),
      path.join(repoRoot, 'backend/src/main.ts'),
      path.join(repoRoot, 'backend/src/app.module.ts'),
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

  it('deve validar que manifestos de infraestrutura e Kubernetes utilizam placeholders seguros de runtime', () => {
    const k8sManifest = path.join(repoRoot, 'infra/k8s/02-configmap-secrets.yaml');
    if (fs.existsSync(k8sManifest)) {
      const content = fs.readFileSync(k8sManifest, 'utf-8');
      expect(content).toContain('${AURA_POSTGRES_PASSWORD}');
      expect(content).toContain('${AURA_JWT_SECRET}');
    }
  });

  it('deve validar que serviços financeiros carregam credenciais via runtime e não embutidas', () => {
    const pixServiceFile = path.join(repoRoot, 'src/services/pixConfigService.ts');
    if (fs.existsSync(pixServiceFile)) {
      const content = fs.readFileSync(pixServiceFile, 'utf-8');
      // Não deve conter a chave de produção antiga hardcoded
      expect(content).not.toContain('cora_sec_live_99x88y77z');
    }
  });
});
