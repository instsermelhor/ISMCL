# ESPECIFICAÇÃO TÉCNICA — INFRAESTRUTURA DE NUVEM
## PROJETO AURA - INSTITUTO SER MELHOR

**Data:** Junho 2026
**Foco:** Alta Disponibilidade, Segurança LGPD/HIPAA e Custos Otimizados

---

## 1. ARQUITETURA CLOUD NATIVE (AWS / GCP)

Devido à necessidade de escala variável (picos de acessos durante campanhas) e orçamento limitado (ONG), a infraestrutura baseia-se fortemente em componentes Serverless e Managed Services.

### 1.1. Orquestração e Computação
*   **Contêineres:** Backend NestJS e Frontend React construídos em imagens Docker.
*   **Google Cloud Run / AWS Fargate:** Serviço de computação Serverless que escala para zero quando não há acesso (reduzindo custo noturno) e escala horizontalmente em segundos durante picos de campanha.
*   **Balanceador de Carga:** Cloud Load Balancing (GCP) com mitigação DDoS embutida (Cloud Armor) e Web Application Firewall (WAF) focado em bloquear Injeção de SQL e XSS.

### 1.2. Camada de Dados (Persistência)
*   **Banco de Dados Relacional:** PostgreSQL Gerenciado (Cloud SQL no GCP ou RDS na AWS). Instância privada (sem IP público), acessível apenas pelos microsserviços via VPC Peering.
*   **Backups Automatizados (Disaster Recovery):** Snapshots incrementais diários e arquivamento em Cold Storage (Glacier) para retenção de logs de auditoria por 5 anos (Exigência do Conselho Federal de Medicina/Psicologia).

### 1.3. Armazenamento de Arquivos e Laudos (BLOB)
*   **Storage (S3 / GCS):** Todos os documentos anexados (laudos anteriores, receitas) são guardados em buckets bloqueados.
*   **Acesso Temporário (Pre-Signed URLs):** O Frontend nunca baixa o arquivo diretamente de um servidor público. O backend gera um link temporário (expira em 2 minutos) apenas se o profissional tiver permissão ativa (ABAC).

### 1.4. Telemedicina (WebRTC)
*   **Servidores TURN/STUN:** Utilização de serviços gerenciados (como Twilio Network Traversal) ou implantação de Coturn em instâncias mínimas para garantir que o vídeo funcione mesmo se o paciente estiver atrás de firewalls corporativos restritos ou redes 3G complexas.
*   **Criptografia:** O canal WebRTC (P2P) é nativamente criptografado por DTLS/SRTP. Nenhum dado de vídeo transita de forma descriptografada nos servidores do Instituto.

---

## 2. CI/CD (INTEGRAÇÃO E ENTREGA CONTÍNUA)

*   **Repositório:** GitHub / GitLab com branch protection rules (nenhum commit direto na `main`).
*   **Pipelines (Actions/CI):**
    *   *Lint & Testes:* Executa unit tests (Jest) a cada PR.
    *   *Scan de Segurança (SAST/DAST):* SonarQube e Trivy checam se há vulnerabilidades conhecidas (CVEs) em pacotes npm (ex: React, NestJS) antes do build.
    *   *Deploy Automático:* Aprovação de PR na `main` dispara build da imagem Docker, push para o Registry e deploy sem indisponibilidade (Blue/Green Deployment) no Cloud Run.

---

## 3. MONITORAMENTO E OBSERVABILIDADE

*   **APM e Logs Centrais:** Datadog ou Elastic Stack (ELK). Todos os logs do backend, incluindo as trilhas de auditoria (AuditLog), convergem para um repositório central inalterável.
*   **Métricas e Alertas:** Alertas no Slack da equipe de TI caso a fila de triagem trave, a latência do banco aumente repentinamente, ou ocorram falhas consecutivas de login (prevenção de Brute Force).
