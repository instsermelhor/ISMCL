# DOMAIN MODEL MASTER (DDD COMPLETO) — PROMPT 47
## Plataforma Integrada Aura — Instituto Ser Melhor (ISMCL)
### Bloco 1: Arquitetura Core — Sprint Técnica 47

---

## 1. LINGUAGEM UBÍQUA FORMAL (UBIQUITOUS LANGUAGE DICTIONARY)

Para garantir o alinhamento absoluto entre especialistas de domínio (psicólogos, assistentes sociais, advogados, diretores financeiros) e engenheiros de software, estabelece-se o dicionário de **Linguagem Ubíqua**:

| Termo do Domínio | Definição Formal no Contexto do ISMCL | Conceito DDD Equivalente |
|---|---|---|
| **Beneficiário** | Pessoa física atendida pelo Instituto Ser Melhor em situação de vulnerabilidade. | Agregado `Beneficiary` |
| **Perfil Protegido** | Beneficiário com grau especial de vulnerabilidade (policiais, vítimas de violência) sujeito a sigilo reforçado. | Agregado `ProtectedProfile` |
| **Dossiê SATAI** | Conjunto de dados de acolhimento analisado pela IA para geração do Score IIP e priorização assistencial. | Agregado `TriageDossier` |
| **Score IIP** | Índice de Intensidade de Proteção (0 a 100) calculado pelo modelo preditivo SATAI. | Value Object `IIPScore` |
| **Caso Clínico / PIC** | Plano Individual de Cuidado com metas multidisciplinares e equipe responsável. | Agregado `ClinicalCase` |
| **Prontuário (PEP)** | Histórico cronológico e imutável de evoluções de atendimento em padrão FHIR/TISS. | Agregado `ClinicalRecord` |
| **Override de Sigilo** | Ato motivado e auditável em que um usuário qualificado acessa dados de Nível 4 por emergência. | Evento `PrivilegeOverrideTriggered` |
| **Escala de RH** | Grade de disponibilidades semanais e horas doadas pelos profissionais e voluntários. | Agregado `ProfessionalSchedule` |
| **Doação PIX EMV BR** | Doação financeira instantânea gerada com TXID único e conciliação bancária automática. | Agregado `PixDonation` |

---

## 2. MAPA DE CONTEXTOS (CONTEXT MAPPING & BOUNDED CONTEXTS)

```mermaid
graph TD
    subgraph Upstream - Domínios de Identidade e Segurança
        IAM_BC[IAM Bounded Context]
        MCSI_BC[MCSI Security & Audit Bounded Context]
    end

    subgraph Core Assistencial e Clínico (Downstream de IAM/MCSI)
        Beneficiary_BC[Beneficiários Bounded Context]
        SATAI_BC[SATAI Triagem & IA Bounded Context]
        Clinical_BC[Prontuário & PEP Bounded Context]
        Schedule_BC[Agenda & RH Bounded Context]
    end

    subgraph Financeiro e Captação
        Financial_BC[Financeiro & PIX Bounded Context]
    end

    subgraph Suporte e Notificação
        Notif_BC[Notificações Bounded Context]
    end

    IAM_BC -- "Customer-Supplier / Upstream" --> Beneficiary_BC
    IAM_BC -- "Customer-Supplier / Upstream" --> Clinical_BC
    MCSI_BC -- "Anti-Corruption Layer (ACL)" --> Beneficiary_BC
    
    Beneficiary_BC -- "Shared Kernel (BeneficiaryId)" --> SATAI_BC
    SATAI_BC -- "Domain Events" --> Clinical_BC
    Clinical_BC -- "Customer-Supplier" --> Schedule_BC

    Financial_BC -- "Async Integration Events" --> Notif_BC
    SATAI_BC -- "Async Integration Events" --> Notif_BC
```

### 2.1 Relações de Contexto (Context Relationships):
- **IAM $\rightarrow$ Beneficiary / Clinical**: **Customer-Supplier** (IAM fornece identidade e credenciais válidas).
- **MCSI $\rightarrow$ Beneficiary**: **Anti-Corruption Layer (ACL)** (O MCSI intercepta qualquer acesso aos dados de beneficiários protegidos para mascarar PII e validar níveis de sigilo Nível 0 a 4).
- **Beneficiary $\leftrightarrow$ SATAI**: **Shared Kernel** (Compartilham os Value Objects `BeneficiaryId` e `RiskLevel`).
- **SATAI $\rightarrow$ Clinical**: **Event-Driven** (Disparo de eventos assíncronos `TriageEvaluatedEvent` para abertura de casos no Kanban).

---

## 3. ESPECIFICAÇÃO DE AGREGADOS, ENTIDADES E VALUE OBJECTS (DDD SPECIFICATION)

### 3.1 Agregado: `Beneficiary` (Contexto de Beneficiários)

```
[ Beneficiary Aggregate Root ]
 ├── Entidade: Beneficiary (ID, Name, Status)
 ├── Entidade: EmergencyContact (Name, Phone, Relationship)
 ├── Value Object: CPF (Value, isValid, format)
 ├── Value Object: VulnerabilityScore (Score, Category)
 └── Value Object: ContactAddress (Street, City, CEP, Coordinates)
```

#### Código Conceitual da Entidade e Value Objects (TypeScript DDD):
```typescript
// libs/domain/src/beneficiary/value-objects/cpf.vo.ts
export class CPF {
  private readonly value: string;

  constructor(rawCpf: string) {
    const sanitized = rawCpf.replace(/\D/g, '');
    if (!CPF.validate(sanitized)) {
      throw new InvalidCpfException('CPF inválido de acordo com a regra de validação nacional.');
    }
    this.value = sanitized;
  }

  public getValue(): string {
    return this.value;
  }

  public getFormatted(): string {
    return this.value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private static validate(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    // Validação matemática do dígito verificador
    return true;
  }
}

// libs/domain/src/beneficiary/aggregates/beneficiary.aggregate.ts
export class BeneficiaryAggregate extends AggregateRoot {
  private _id: string;
  private _name: string;
  private _cpf: CPF;
  private _status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

  private constructor(id: string, name: string, cpf: CPF) {
    super();
    this._id = id;
    this._name = name;
    this._cpf = cpf;
    this._status = 'ACTIVE';
  }

  public static create(name: string, rawCpf: string): BeneficiaryAggregate {
    const cpf = new CPF(rawCpf);
    const id = `BEN-${Date.now()}`;
    const beneficiary = new BeneficiaryAggregate(id, name, cpf);

    // Dispara Evento de Domínio
    beneficiary.addDomainEvent(new BeneficiaryCreatedEvent(id, name, cpf.getValue()));
    return beneficiary;
  }
}
```

---

### 3.2 Agregado: `ProtectedProfile` (Contexto MCSI & Sigilo)

```
[ ProtectedProfile Aggregate Root ]
 ├── Entidade: ProtectedProfile (InternalCode: ISM-0000000000)
 ├── Entidade: Guardian (FullName, CustodyType, Relationship)
 ├── Entidade: ProtectiveMeasure (ProcessNumber, Authority, ExpirationDate)
 ├── Value Object: SensitivityLevel (0..4)
 └── Value Object: EncryptedVaultData (EncryptedCpf, EncryptedAddress, IV, AuthTag)
```

---

## 4. EVENTOS DE DOMÍNIO E INVARIANTES DE DOMÍNIO (DOMAIN EVENTS & INVARIANTS)

### 4.1 Invariantes de Domínio (Domain Invariants — Regras Imutáveis):
1. **Regra de Sigilo MCSI (INV-001)**: Nenhum usuário com `clearanceLevel < 4` pode visualizar o CPF ou endereço real de um beneficiário cujo `ProtectedProfile.sensitivityLevel === 4`, a menos que um `PrivilegeOverrideTriggered` seja emitido com justificativa ética.
2. **Regra de Triagem SATAI (INV-002)**: Um dossiê de triagem com queixa de violência física ou risco iminente DEVE ser atribuído automaticamente com `priorityLevel = EMERGENCY` e notificado em menos de 60 segundos.
3. **Regra de Doação PIX (INV-003)**: O valor de uma doação PIX não pode ser negativo ou zero. Doações acima de R$ 10.000,00 disparam um evento de compliance LGPD/COAF.

### 4.2 Tabela de Eventos de Domínio (Domain Events Catalogue)

| Nome do Evento | Emissor | Payload | Efeito colateral / Reação |
|---|---|---|---|
| `BeneficiaryRegisteredEvent` | Beneficiary-BC | `{ beneficiaryId, name, cpf }` | Inicia dossiê pendente no SATAI-BC |
| `TriageEvaluatedEvent` | SATAI-BC | `{ dossierId, iipScore, riskLevel }` | Cria card no Kanban em `clinical_cases_list` |
| `PrivilegeOverrideTriggered` | MCSI-BC | `{ userId, targetId, reason, timestamp }` | Registra no AuditLog e envia alerta de TI |
| `PixDonationPaidEvent` | Financial-BC | `{ txid, amount, programId }` | Atualiza KPIs do Dashboard em tempo real |

---

## 5. GOVERNANÇA DE DADOS & COMPLIANCE LGPD (DATA OWNERSHIP & LINEAGE)

### 5.1 Matriz de Classificação de Dados (Data Classification Matrix)

| Atributo de Dado | Classificação LGPD | Sensibilidade | Retenção Legal | Política de Descarte |
|---|---|---|---|---|
| **Nome Completo** | PII (Dado Pessoal) | Nível 1 | 5 anos pós-alta | Anonimização (Hashing) |
| **CPF / RG** | PII Sensível | Nível 2 / Nível 4 | 5 anos pós-alta | Criptografia AES-256 / Expurgo |
| **Histórico de Violência** | Dado Sensível (Saúde/Proteção) | Nível 4 (Máximo) | 20 anos (ECA / Justiça) | Cofre Forte Encerrado |
| **Evolução Médica SOAP** | Dado Médico (Resoluções CFM) | Nível 3 | 20 anos (Prontuário PEP) | Arquivo Morto Criptografado |
| **Valor de Doação PIX** | Dado Financeiro | Nível 1 | 5 anos (Receita Federal) | Retenção Contábil |

---

## 6. CONTRATOS DE INTEGRAÇÃO (ORQUESTRAÇÃO VS. COREOGRAFIA)

O **Aura Core Server** adota **Coreografia Baseada em Eventos (Event Choreography)** para desacoplamento de microsserviços e **Orquestração Saga** para processos de negócio complexos que exigem transações compensatórias.

### 6.1 Schema do Evento de Integração `TriageEvaluatedEvent` (JSON Schema Standard):
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "TriageEvaluatedEvent",
  "type": "object",
  "properties": {
    "eventId": { "type": "string", "format": "uuid" },
    "eventType": { "type": "string", "const": "SATAI_TRIAGE_EVALUATED" },
    "eventTimestamp": { "type": "string", "format": "date-time" },
    "payload": {
      "type": "object",
      "properties": {
        "dossierId": { "type": "string" },
        "beneficiaryId": { "type": "string" },
        "iipScore": { "type": "number", "minimum": 0, "maximum": 100 },
        "riskLevel": { "type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "EMERGENCY"] }
      },
      "required": ["dossierId", "beneficiaryId", "iipScore", "riskLevel"]
    }
  },
  "required": ["eventId", "eventType", "eventTimestamp", "payload"]
}
```

---

## 7. PRÓXIMOS PASSO DO ROADMAP DE PROMPT

- **Prompt 48**: Enterprise Backend (Arquitetura NestJS em Produção com Injeção de Dependência do Modelo DDD).
- **Prompt 49**: PostgreSQL + Prisma + Modelagem Física Integrada com os Agregados DDD.
- **Prompt 50**: API Contracts (Swagger OpenAPI 3.0, Zod DTOs, Versionamento `/v1`, `/v2`).
