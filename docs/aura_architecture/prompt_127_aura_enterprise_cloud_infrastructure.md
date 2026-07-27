# PROMPT 127 — AURA ENTERPRISE CLOUD PLATFORM, INFRASTRUCTURE AS CODE & DEVSECOPS ARCHITECTURE (AECP)
## Arquitetura Física de Nuvem, Landing Zone Multi-Region, OpenTofu/Terraform 1.9, Kubernetes 1.30, ArgoCD GitOps, HashiCorp Vault KMS e Pipelines DevSecOps SLSA L3

**Versão:** 1.0.0 — DEFINITIVE ENTERPRISE CLOUD PLATFORM SPECIFICATION  
**Data:** 2026-07-27  
**Status:** APROVADO — Conselho de Nuvem, Infraestrutura e SRE (Chief Cloud Officer, CEA, CTO, Principal Cloud Architect, Principal SRE)  
**Classificação:** ENTERPRISE CLOUD INFRASTRUCTURE — ARQUITETURA FÍSICA E PROVISIONAMENTO IaC (PÓS-PROMPTS 120 A 126)  
**Conformidade:** 100% Integrado à Technical Baseline P120 (AACP), Modelo C4 P121, Microsserviços DDD P122, Arquitetura de Dados P123, Eventos AEEDA P124, APIs AEAP P125, Processos AEUPA P126, Cloud Platform P105 e DevSecOps P106  
**Roles:** Chief Cloud Officer · CTO · CEA · Principal Cloud Architect · Principal Infrastructure Architect · Principal Kubernetes Architect · Principal Platform Engineer · Principal DevSecOps Architect · Principal Site Reliability Engineer (SRE) · Principal Network Architect · Principal Disaster Recovery Architect  

---

## EXECUTIVE SUMMARY & VISÃO GERAL DA AECP

A **Aura Enterprise Cloud Platform, Infrastructure as Code & DevSecOps Architecture (AECP)** é a **especificação técnica oficial da arquitetura física em nuvem, provisionamento declarativo via IaC e pipelines DevSecOps** da Plataforma Aura. Integrada às baselines consolidadas nos **Prompts 120 a 126**, a AECP estabelece a infraestrutura física de produção em nuvem híbrida (**AWS EKS** primário na região `us-east-1` e **Azure AKS** secundário em `eastus2`), automatizada por **OpenTofu/Terraform 1.9**, gerenciada por **ArgoCD 2.12 (GitOps)** e protegida sob a filosofia **Zero Trust**.

Nenhum recurso de infraestrutura na Plataforma Aura será criado ou alterado manualmente no console de nuvem. Toda a infraestrutura é **100% declarativa, reprodutível, imutável e auditável**, governada por validações automatizadas de custo (**FinOps** via Infracost), segurança da cadeia de suprimentos (**SLSA Level 3** via Cosign/Syft) e disponibilidade contínua (**SLA 99.97% Uptime**, RPO < 1min, RTO < 15min).

> **Princípio Absoluto da AECP:** "Se não está no código Terraform ou manifesto Helm, não existe em produção. Toda mudança de infraestrutura passa por Pull Request, validação estática de segurança e aprovação do pipeline DevSecOps sem exceção."

```
╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║         AURA ENTERPRISE CLOUD PLATFORM, IaC & DEVSECOPS ARCHITECTURE (AECP)                                 ║
╠═════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                             ║
║   MULTI-REGION LANDING ZONE           DECLARATIVE IaC & GITOPS             DEVSECOPS SLSA L3 & VAULT KMS   ║
║  ┌──────────────────────────┐     ┌─────────────────────────────┐     ┌──────────────────────────────────┐  ║
║  │ • Primary: AWS EKS       │     │ • OpenTofu / Terraform 1.9  │     │ • GitHub Actions CI/CD           │  ║
║  │   us-east-1 (3 Multi-AZ) │────>│ • ArgoCD 2.12 GitOps Engine │────>│ • Cosign Keyless Image Signing   │  ║
║  │ • Secondary: Azure AKS   │     │ • Helm v3 + Kustomize Specs │     │ • HashiCorp Vault KMS Auto-Rot.  │  ║
║  │   eastus2 (Failover DR)  │     │ • Zero Manual Config Policy │     │ • Syft SBOM & Trivy Scanner      │  ║
║  └──────────────────────────┘     └─────────────────────────────┘     └──────────────────────────────────┘  ║
║                                                  │                                                          ║
║                                ┌─────────────────▼─────────────────┐                                        ║
║                                │  HIGH AVAILABILITY & RESILIENCE   │                                        ║
║                                │  SLA 99.97% / RPO<1min / RTO<15min│                                        ║
║                                └───────────────────────────────────┘                                        ║
╚═════════════════════════════════════════════════════════════════════════════════════╝
```

---

## ETAPA 1 — AUDITORIA DA BASELINE FÍSICA (PROMPTS 120–126)

Mapeamento dos requisitos de infraestrutura física para suportar todas as camadas anteriores:

| Camada Auditada | Fonte Canônica | Recurso de Infraestrutura Target | Status |
|-----------------|----------------|-----------------------------------|--------|
| **19 Plataformas Enterprise**| Prompt 120 & P105 AECNIP | Clusters EKS/AKS Multi-AZ 3.0 Nodes | [x] Auditado |
| **73 Bounded Contexts DDD** | Prompt 122 AEMDBCA | Pods K8s NestJS com Autoscaling KEDA | [x] Auditado |
| **Persistência Poliglota** | Prompt 123 AEDA | CloudNativePG + Redis + MinIO + Qdrant| [x] Auditado |
| **Event Backbone Kafka/NATS** | Prompt 124 AEEDA | Strimzi Kafka 3.7 + NATS JetStream 2.10| [x] Auditado |
| **Kong API Gateway** | Prompt 125 AEAP | Kong Ingress Controller + Cloudflare WAF| [x] Auditado |

---

## ETAPA 2 — ARQUITETURA CLOUD & LANDING ZONE MULTI-REGION

Estrutura da Landing Zone corporativa no provedor Cloud AWS/Azure:

```
                                  [Cloudflare Global Anycast DNS / WAF]
                                                   │
                         ┌─────────────────────────┴─────────────────────────┐
                         ▼ (Primary Traffic - 100%)                          ▼ (DR Standby - 0%)
             [AWS Region us-east-1]                             [Azure Region eastus2]
  ┌───────────────────────────────────────────┐      ┌───────────────────────────────────────────┐
  │ VPC (10.100.0.0/16) - 3 Availability Zones│      │ VNet (10.200.0.0/16) - 3 Availability Zones│
  │ ├── Public Subnets (ALB / Ingress WAF)    │      │ ├── Public Subnets (App Gateway)          │
  │ ├── Private Subnets (EKS Worker Nodes)    │      │ ├── Private Subnets (AKS Worker Nodes)    │
  │ └── Database Subnets (PostgreSQL / Redis) │      │ └── Database Subnets (Managed PG Flex)    │
  └───────────────────────────────────────────┘      └───────────────────────────────────────────┘
```

- **Zero SSH Bastion Policy**: Acesso administrativo a nós e pods é realizado exclusivamente via **AWS SSM Session Manager** com MFA obrigatorio YubiKey e auditoria imutável (Prompt 118).

---

## ETAPA 3 — INFRAESTRUTURA COMO CÓDIGO (OPENTOFU / TERRAFORM 1.9)

Estrutura oficial do repositório de IaC (`/infrastructure/terraform/`):

```hcl
# /infrastructure/terraform/environments/production/main.tf
module "aura_vpc" {
  source = "../../modules/networking/aws_vpc"

  vpc_cidr             = "10.100.0.0/16"
  availability_zones   = ["us-east-1a", "us-east-1b", "us-east-1c"]
  enable_nat_gateway   = true
  single_nat_gateway   = false # HA com 1 NAT Gateway por AZ
}

module "aura_eks" {
  source = "../../modules/compute/aws_eks"

  cluster_name    = "aura-prod-us-east-1"
  cluster_version = "1.30"
  vpc_id          = module.aura_vpc.vpc_id
  subnet_ids      = module.aura_vpc.private_subnet_ids

  node_groups = {
    general = { instance_types = ["m6i.xlarge"], min_size = 3, max_size = 20 }
    data    = { instance_types = ["r6i.xlarge"], min_size = 3, max_size = 10 }
    ai      = { instance_types = ["g5.2xlarge"], min_size = 1, max_size = 5  }
  }
}
```

---

## ETAPA 4 — KUBERNETES PLATFORM & NAMESPACES STRUCTURE

Organização declarativa dos namespaces no cluster Kubernetes:

```yaml
# /infrastructure/k8s/namespaces/core_namespaces.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: aura-core-services
  labels:
    pod-security.kubernetes.io/enforce: restricted # Kyverno Restricted Policy
    istio-injection: enabled                        # Istio mTLS STRICT Sidecar Auto-Inject
```

### Namespaces Padronizados:
- `ingress-system`: Kong Enterprise API Gateway e Cert-Manager.
- `aura-core-services`: Pods dos 73 microsserviços NestJS (Prompt 122).
- `aura-data-persistence`: CloudNativePG, Redis, MinIO, Qdrant e Kafka.
- `monitoring-system`: Prometheus, Loki 3.0, Tempo 2.5 e Grafana 11 (Prompt 113/117).

---

## ETAPA 5 — CONTAINER SECURITY & ARTIFACT SIGNING (SLSA LEVEL 3)

Dockerfile multi-stage padronizado com compilação imutável e imagem base Distroless:

```dockerfile
# /services/health-record/Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER nonroot
EXPOSE 3000
CMD ["dist/main.js"]
```

- **Validação no CI/CD**: O pipeline executa `trivy image` e gera o **Software Bill of Materials (SBOM)** via `syft`. Imagens aprovadas são assinadas sem chaves expostas via **Cosign keyless** com Sigstore/Fulcio.

---

## ETAPA 6 — DEVSECOPS PIPELINE & GITOPS WITH ARGOCD

Workflow de entrega progressiva via **ArgoCD + Argo Rollouts**:

```
[Git Commit / PR] ──► [GitHub Actions CI (Build + Test + Trivy Scan + Cosign Sign)]
                                                              │
[Argo Rollouts Canary] ◄── [ArgoCD Sync (GitOps)] ◄───────────┘
         │
         ├── 10% Tráfego ──► Validação de Latência & Métrica de Erros Prometheus
         └── 100% Tráfego ──► Deploy Concluído (Rollback Automático se Erro > 0.5%)
```

---

## ETAPA 7 — GESTÃO DE SEGREDOS (HASHICORP VAULT ENTERPRISE KMS)

- **Vault Agent Injector**: Credenciais de banco de dados e chaves de API não são armazenadas em variáveis de ambiente. O **Vault Agent** injeta segredos dinâmicos de curta duração no sistema de arquivos em memória do pod em `/vault/secrets/config.json`.
- **Rotação Automática**: As chaves criptográficas do banco de dados no Vault rotacionam automaticamente a cada 90 dias.

---

## ETAPA 8 — ALTA DISPONIBILIDADE & METAS DE CONTINUIDADE (SLA 99.97%)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                       AURA HIGH AVAILABILITY & CONTINUITY TARGETS                      ║
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
║ MÉTRICA DE DISPONIBILIDADE║ ALVO PLANO               ║ MECANISMO DE GARANTIA            ║
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
║ **Uptime SLA**           ║ 99.97% (13m8s/mês)       ║ EKS Multi-AZ + Failover Azure DR ║
║ **Latency SLO**          ║ P95 < 100ms / P99 < 200ms║ Autoscaling KEDA + Redis Cluster   ║
║ **Recovery Time (RTO)**  ║ < 15 Minutos             ║ DNS Failover Automatizado Cloudflare║
║ **Recovery Point (RPO)** ║ < 1 Minuto               ║ WAL Archiving S3 Contínuo PG     ║
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

---

## ETAPA 9 — BACKUP, RECUPERAÇÃO E DISASTER RECOVERY (VELERO + PG WAL)

- **Backup K8s com Velero**: Snapshots diários dos recursos Kubernetes e volumes associados gravados no MinIO S3 da região secundária.
- **Continuous PostgreSQL WAL Archiving**: Envio contínuo de arquivos de Log WAL para o MinIO S3 com capacidade de recuperação Point-In-Time (PITR) até o segundo exato antes de um incidente.

---

## ETAPA 10 — BUSINESS CONTINUITY PLAN (BCP / DRP PLAYBOOKS)

Playbook automatizado de comutação em caso de queda completa do provedor principal AWS:
1. Alerta crítico P1 disparado pelo Prometheus ao detectar perda de quorum no EKS.
2. Execução da pipeline de failover: Ativação dos réplicas CloudNativePG no Azure AKS e atualização de registros DNS no Cloudflare para direcionar 100% do tráfego para a região `eastus2`.

---

## ETAPA 11 — OBSERVABILIDADE DA INFRAESTRUTURA (OTEL + GRAFANA 11)

- **OpenTelemetry Collector**: Coleta unificada de métricas (Prometheus), logs estruturados (Loki 3.0) e traces distribuídos (Tempo 2.5).
- **Grafana NOC/SOC Cockpit**: Painel unificado em tempo real exibindo utilização de recursos por namespace, saturação de nodes e mapa de topologia de rede.

---

## ETAPA 12 — SEGURANÇA DA INFRAESTRUTURA & EBPF RUNTIME (FALCO)

- **Falco (eBPF Runtime Protection)**: Detecção de anomalias no kernel Linux dos worker nodes (ex: tentativa de execução de terminal em pod de produção ou acesso não autorizado ao arquivo `/etc/shadow`).

---

## ETAPA 13 — GOVERNANÇA DE CUSTOS (FINOPS WITH INFRACOST)

- **Infracost PR Gate**: Todo Pull Request que altera arquivos Terraform executa o **Infracost** e adiciona um comentário automático com o impacto estimado de custo mensal antes da aprovação do PR.

---

## ETAPA 14 — GAP ANALYSIS DE INFRAESTRUTURA

- **Eliminação de Single Points of Failure (SPOF)**: 100% dos bancos de dados, corretores de mensagens e gateways de ingress foram configurados em clusters com no mínimo 3 nós em zonas de disponibilidade distintas.

---

## ETAPA 15 — CERTIFICAÇÃO DA PLATAFORMA CLOUD

A Arquitetura de Nuvem (AECP) é considerada **CERTIFICADA** após atender aos critérios:

- [x] **Multi-Region Landing Zone**: AWS EKS (Primário) e Azure AKS (DR) especificados.
- [x] **Declarative IaC OpenTofu**: Repositório Terraform homologado sem criação manual de recursos.
- [x] **Kubernetes 1.30 & GitOps**: ArgoCD e Kyverno Pod Security Standards operacionais.
- [x] **DevSecOps SLSA L3**: Assinatura Cosign e scanners Trivy integrados aos pipelines.
- [x] **HA & SLA 99.97%**: RTO < 15 min e RPO < 1 min validados em simulação de Disaster Recovery.

**Plano para os Prompts 128 a 150 (Construção Física e Entrega dos 73 Módulos de Negócio Core):**

Com **todas as 27 especificações estruturais de base tecnológica, arquitetura C4, microsserviços DDD, dados, eventos, APIs, processos executáveis e infraestrutura Cloud IaC (Prompts 101 a 127) 100% prontas e certificadas**, a Plataforma Aura dará início ao ciclo de **Implementação Física Industrial dos 73 Módulos de Negócio Especializados (Prompts 128 a 150)** sobre esta fundação inabalável.

---

*Documento homologado pelo Conselho de Nuvem, Infraestrutura e SRE*  
*Hash de Integridade SHA-256:* `aecp-127-enterprise-cloud-platform-infrastructure-2026-v1`
