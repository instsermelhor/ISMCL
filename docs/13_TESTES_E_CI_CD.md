# ESTRATÉGIA DE TESTES E CI/CD PIPELINE
## PROJETO AURA - INSTITUTO SER MELHOR

**Data:** Junho 2026
**Foco:** Garantia de Qualidade (QA), Testes de Carga e Integração Contínua (GitOps)

---

## 1. PIRÂMIDE DE TESTES

A plataforma lida com saúde mental e proteção social. Regressões em regras de permissão (um voluntário A enxergar o prontuário do voluntário B) são inaceitáveis.

*   **Testes Unitários (Jest):** Cobrem lógica pura (Hashing, Validação de JWT, Cálculo de Idades). Meta: 85% coverage.
*   **Testes de Integração (Supertest):** Testam as APIs junto a uma base de dados efêmera (PostgreSQL rodando no Docker/Testcontainers).
*   **Testes E2E (Playwright/Cypress):** Simulam a navegação real. Ex: O fluxo de agendamento de um paciente -> Geração de Ficha -> Atendimento Clínico.
*   **Testes de Segurança (SAST/DAST):** Trivy (análise de imagens Docker), SonarQube (Quality Gate no PR) e OWASP ZAP (ataques simulados de injeção/bypass).

---

## 2. TESTE DE CARGA PARA TELEMEDICINA (k6)

Como a plataforma almeja picos de acesso (ex: plantões sociais, aulas ao vivo), validamos a infraestrutura (LiveKit + NestJS) simulando carga via script `k6`.

```javascript
// scripts/load-tests/telehealth-sim.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 500 },  // Ramp-up: 500 profissionais fazendo login
    { duration: '5m', target: 5000 }, // Ramp-up: 5000 pacientes acessando a sala de espera
    { duration: '1m', target: 0 },    // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% das requests < 300ms
    http_req_failed: ['rate<0.01'],   // Erros (5xx) abaixo de 1%
  },
};

export default function () {
  // Simulação de Polling na Sala de Espera (Buscando status do vídeo)
  const url = 'https://api-dev.institutosermelhor.org.br/v1/telehealth/room-status';
  const res = http.get(url);
  
  check(res, {
    'status 200': (r) => r.status === 200,
    'tempo de resposta OK': (r) => r.timings.duration < 250,
  });
  sleep(1);
}
```

---

## 3. PIPELINE DE CI/CD (GitHub Actions YAML)

O pipeline orquestra desde o lint até o provisionamento Helm no K8s.

```yaml
name: Aura CI/CD Production
on:
  push:
    branches: [ "main" ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node
        uses: actions/setup-node@v3
        with: { node-version: '20' }
        
      - name: Install dependencies
        run: npm ci
        
      - name: Lint & Unit Tests
        run: npm run test:unit
        
      - name: Run E2E Tests
        run: npm run test:e2e
        
      - name: SAST Security Scan
        uses: snyk/actions/node@master
        
  deploy-production:
    needs: build-and-test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v1
        
      - name: Login ECR & Build Docker Image
        run: |
          docker build -t aura-api:latest ./apps/api-gateway
          docker push XXXXX.dkr.ecr.sa-east-1.amazonaws.com/aura-api:latest
          
      - name: Deploy to EKS (Helm Upgrade)
        run: |
          helm upgrade --install aura-backend ./infra/k8s/aura-api \
          --set image.tag=latest \
          --namespace production
```
