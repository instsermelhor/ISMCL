# SEGURANÇA, LGPD E PLANO DE CONTINUIDADE (DR)
## PROJETO AURA - INSTITUTO SER MELHOR

**Data:** Junho 2026
**Foco:** Adequação LGPD, Criptografia, Disaster Recovery e Gestão de Incidentes

---

## 1. ADEQUAÇÃO À LGPD E DADOS SENSÍVEIS (SAÚDE)
O Instituto Ser Melhor lida com dados categorizados como **Dados Sensíveis** pela LGPD (Art. 5º, II - referentes à saúde e vida sexual). A plataforma Aura foi arquitetada sob o princípio de *Privacy by Design*.

### 1.1. Gestão de Consentimentos (Termos)
*   **Aceite Granular:** Ao invés de um único "Li e Aceito", o sistema possui Termos de Consentimento modulares armazenados na tabela `beneficiary_consents`.
    *   Consentimento para Tratamento de Dados (Obrigatório).
    *   Consentimento para Contato via WhatsApp (Opcional).
    *   Autorização de Interconsulta Multidisciplinar (Opcional - "Permito que meu psicólogo converse com o serviço social").
*   **Revogação Simplificada:** O paciente pode revogar o consentimento. Revogar o Tratamento de Dados dispara o processo de pseudonimização.

### 1.2. Retenção e Descarte (Pseudonimização vs Deleção)
*   *Prontuários Médicos/Psicológicos não podem ser apagados* se o paciente solicitar (Legislação Federal e Resoluções CFM/CRP sobrepõem o direito de exclusão da LGPD - retenção mínima de 20 anos).
*   Se o paciente solicitar deleção (Right to be Forgotten), os dados comerciais/sociais são apagados ou truncados. Os dados clínicos são **pseudonimizados**: o ID do paciente é dissociado do nome limpo e mantido em base fria apenas para auditoria legal.

---

## 2. POLÍTICA DE BACKUP E DISASTER RECOVERY (DR)

### 2.1. RTO e RPO
*   **RPO (Recovery Point Objective):** 5 Minutos. Aceitamos perder no máximo 5 minutos de dados de sessão.
*   **RTO (Recovery Time Objective):** 2 Horas. O sistema deve voltar ao ar em infraestrutura secundária em menos de 2 horas após um apagão total (Tier-1 Outage).

### 2.2. Arquitetura de Backup Multi-Região (AWS)
*   **Bancos de Dados (RDS PostgreSQL):** Replicação transacional Multi-AZ ativa na região Primária (ex: `sa-east-1` São Paulo). Snapshots diários e logs WAL (Point-in-Time Recovery) replicados para região Secundária (ex: `us-east-1` Virginia).
*   **Anexos (S3):** Bucket versionado com replicação Cross-Region (CRR). Os PDFs e Laudos nunca são sobrescritos, sempre ganham versão nova (Imutabilidade).
*   **Criptografia em Repouso:** Os discos do banco de dados utilizam AES-256 via AWS KMS. A chave KMS principal possui rotação anual automática.

---

## 3. PLANO DE OBSERVABILIDADE E SUPORTE (SRE)

Para manter a plataforma resiliente sem uma equipe gigante de TI, usamos pilares consolidados de observabilidade.

### 3.1. Telemetria e Logs (ELK / Datadog)
*   **Métricas:** Monitoramento do cluster EKS via Prometheus/Grafana. Alertas no Slack da equipe se a CPU passar de 80% ou houver rejeição de conexão no Banco.
*   **Tracing Distribuído:** OpenTelemetry em todos os microsserviços. Conseguimos rastrear desde o clique do botão no React, passando pelo API Gateway, até a query lenta no PostgreSQL.
*   **Logs Estruturados:** Formato JSON. O PII (Personal Identifiable Information - como CPFs e Nomes) é mascarado no log agent *antes* de ser enviado ao ElasticSearch. NUNCA logamos senhas, tokens, ou conteúdos de evolução clínica.

### 3.2. Níveis de Suporte (SLA)
*   **Nível 1 (Triagem Voluntária):** Equipe administrativa do Instituto atendendo tickets via WhatsApp e Helpdesk interno. (Dúvidas de senha, reagendamentos).
*   **Nível 2 (Sustentação):** Analistas de Suporte (Infra/Redes) atuam em falhas locais (Acesso negado indevido, problemas com câmera/microfone no WebRTC).
*   **Nível 3 (Engenharia):** Escalamento crítico. Falha no banco, bugs de produção, indisponibilidade do Cloud Provider.

---

## 4. RUNBOOKS OPERACIONAIS (EXEMPLOS)

### 4.1. Runbook: Incidente de Violação de Sigilo Suspeito
**Sintoma:** Alarme dispara no Datadog alertando "Acesso Break-Glass de Prontuário" detectado na Auditoria.
**Ação Imediata (N2/N3):**
1. Checar o log `strict_audit_logs` e verificar o campo `justification`.
2. Validar se o `actor_id` (quem acessou) tem autorização legal (ex: Super Admin ou DPO).
3. Entrar em contato telefônico imediato com a gestão de enfermagem/clínica para confirmar se houve ordem judicial para o acesso.
4. Se confirmado um ataque interno, suspender imediatamente a sessão do usuário (Revogar Refresh Token) via CLI de admin e isolar conta.
