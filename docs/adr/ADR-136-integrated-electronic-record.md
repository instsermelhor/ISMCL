# ADR-136: Aura Integrated Electronic Health & Social Record (AIEHSR)

**Status:** ACEITO  
**Data:** 2026-07-27  
**Autores:** Chief Medical Information Officer (CMIO), Chief Clinical Information Officer (CCIO), Chief Social Care Officer (CSCO)  
**Referência:** Prompt 136 (AIEHSR), Technical Baseline P120, OSS P129, Prompt 131 AFPI, Prompt 132 AIFI, Prompt 133 AAIRP, Prompt 134 AIWSP, Prompt 135 AECMP

---

## Contexto

O atendimento integrado do Projeto Aura conecta assistência social, psicologia, psiquiatria e medicina em um único prontuário longitudinal (`PEP-YYYY-XXXXX`). O registro de saúde e assistência social exige sigilo profissional absoluto, suporte à LGPD, conformidade com o MCSI e capacidade de compartilhamento normatizado via padrão HL7 FHIR R4.

## Decisão

### 1. Imutabilidade e Assinatura Eletrônica das Evoluções

**Decisão:** O domínio `@domain/ehr` foi projetado com o **ClinicalNotesService**, garantindo que:
- Todas as evoluções clínicas/psicológicas/sociais utilizem o formato estruturado **SOAP** (Subjetivo, Objetivo, Avaliação, Plano).
- Após a assinatura eletrônica com hash SHA-256, o registro torna-se **bloqueado e imutável**.
- Retificações geram uma nova versão apontando para a versão anterior.

### 2. Política Break Glass de Acesso Emergencial

**Decisão:** Em emergências médicas ou psiquiátricas graves onde o profissional não possua permissão direta, o recurso **Break Glass** permite acesso imediato mediante justificativa clínica obrigatória (mínimo 10 caracteres), gerando log imutável e alerta automático ao SOC (Security Operations Center).

### 3. Interoperabilidade Internacional HL7 FHIR R4

**Decisão:** A camada de interoperabilidade **FhirAdapter** expõe conversores nativos para transformar os registros do beneficiário nos formatos FHIR R4 `Patient` e `ClinicalImpression`.

### 4. Event-Driven EHR Lifecycle

**Decisão:** Publicação de eventos padronizados no formato CloudEvents v1.0.3:
- `aura.ehr.created.v1`
- `aura.ehr.note.signed.v1`
- `aura.ehr.breakglass.used.v1`

## Consequências

- ✅ Total conformidade com a LGPD (Art. 7/11) e normas dos Conselhos Federais de Medicina, Psicologia e Serviço Social.
- ✅ Rastreabilidade completa de quem acessou o prontuário e quando.
- ✅ Interoperabilidade nativa com a Rede Nacional de Dados em Saúde (RNDS/SUS).

---

*Homologado pelo Clinical & Ethics Governance Board — AIEHSR Prompt 136*
