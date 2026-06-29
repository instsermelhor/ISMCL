# ESTRUTURA DE INFRAESTRUTURA E MONOREPO (SCAFFOLD)
## PROJETO AURA - ECOSSISTEMA INSTITUTO SER MELHOR

Este documento descreve a infraestrutura como código (IaC) e a estrutura do Monorepo, arquitetada e adaptada especificamente para o ecossistema de cuidado social e saúde mental da ONG Instituto Ser Melhor.

---

## 1. ESTRUTURA DO MONOREPO

A separação lógica respeita os limites de contexto exigidos para proteção de dados, captação e operação multidisciplinar.

```text
aura-social-platform/
├── apps/
│   ├── web-portal/           # Portal Público (Next.js - Institucional, Projetos, Doações, Transparência)
│   ├── app-dashboard/        # Área Logada (React/Vite - Gestores, Voluntários, Beneficiários)
│   ├── api-gateway/          # Backend Entrypoint (NestJS - Auth, OIDC, Rate Limiting)
│   ├── ms-social-care/       # Microsserviço de Beneficiários, Casos e Projetos Sociais
│   ├── ms-clinical/          # Microsserviço Multidisciplinar (Prontuários, Evolução, Sigilo)
│   ├── ms-scheduling/        # Microsserviço de Agenda e Gestão de Voluntários
│   ├── ms-telehealth/        # Serviços WebRTC, Chat e Integração WhatsApp API
│   ├── ms-education/         # EAD, Trilhas Formativas e Biblioteca
│   └── ms-fundraising/       # Captação de Recursos, Financeiro Institucional e Indicadores de Impacto
├── packages/
│   ├── aura-ui/              # Design System (Tailwind, focado em Acessibilidade WCAG AA, Baixo Atrito)
│   ├── database/             # PostgreSQL Schema, Migrations e DTOs (Beneficiaries, Cases, Donations)
│   ├── logger/               # Biblioteca de Observabilidade & Auditoria estrita LGPD
│   └── shared-types/         # Interfaces TypeScript
├── infra/
│   ├── docker/               # Docker Compose Local (Postgres, Redis, RabbitMQ, LocalStack)
│   ├── terraform/            # AWS / Azure IaC
│   └── k8s/                  # Helm Charts (Deploy declarativo GitOps)
└── .github/workflows/        # CI/CD Pipelines
```

---

## 2. ARQUITETURA CLOUD E SEGURANÇA (AWS / AZURE)

Dado o escopo sem fins lucrativos (SaaS para uso interno e de beneficiários da ONG), a infraestrutura foi planejada buscando otimização de custos (OPEX) sem, no entanto, abrir qualquer concessão na segurança cibernética e privacidade de dados hipersensíveis.

### 2.1. Componentes Principais
- **Orquestração:** Kubernetes (EKS/AKS) para alta resiliência, auto-healing e facilidade na gestão de microsserviços.
- **Banco de Dados Relacional:** PostgreSQL Gerenciado (RDS/Azure Database) para dados estruturados (Beneficiários, Casos, Prontuários). Sigilo clínico garantido via *Application-Level Encryption* para os campos de conteúdo das evoluções e anamneses.
- **Armazenamento Seguro:** S3 / Blob Storage protegido via KMS para uploads de anexos (medidas protetivas, laudos, arquivos de rede de proteção). Acesso validado via *Presigned URLs* de vida curta.
- **Integração WhatsApp:** Fila no RabbitMQ processa mensagens assistenciais e notificações. É **imperativo e documentado** o uso de fallback para as chamadas de vídeo: as videochamadas operam prioritariamente em WebRTC seguro hospedado na própria plataforma (via Mediasoup/LiveKit), sendo o WhatsApp usado unicamente para o envio de links de acesso autenticados, contornando a limitação nativa da API do WhatsApp para videochamadas empresariais criptografadas de ponta a ponta que exijam gravação/auditoria.

### 2.2. Observabilidade e Relatórios de Impacto Social
- **Prometheus + Grafana:** Dashboards técnicos (Latência, Uptime, Taxa de Erros).
- **Painéis de Impacto Social (Metabase/Superset):** Ferramentas de BI conectadas a uma réplica de leitura do banco de dados (estritamente com dados anonimizados/pseudonimizados). Geração automatizada de relatórios cobrindo métricas institucionais (total de acolhimentos, número de horas doadas por voluntários, diversidade demográfica, evolução de casos) garantindo a prestação de contas com total anonimato dos beneficiários.

---

## 3. PLANO DE CONTINUIDADE E DESASTRE (DR) E IMPLANTAÇÃO
- **Backup e Retenção Legal:** Rotinas de backup automatizadas diárias. Os dados médicos e sociais possuem política de retenção estendida (conforme exigências dos Conselhos e da Lei), enviados periodicamente para armazenamento a frio (Glacier) em uma região secundária (Georredundância).
- **Runbooks de Recuperação:** Scripts de DR totalmente testáveis, permitindo a recriação da infraestrutura via Terraform e restauração pontual (Point-in-Time Recovery) do RDS em menos de 1 hora (RTO < 1h).
- **Pipelines GitOps:** O provisionamento contínuo utiliza ferramentas como ArgoCD, garantindo que as versões de produção reflitam exclusivamente as configurações validadas nos repositórios, provendo um "Audit Trail" técnico indestrutível.
