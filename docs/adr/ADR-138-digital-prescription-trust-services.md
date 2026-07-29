# ADR-138: Aura Digital Prescription, Clinical Documents & Trust Services Platform (ADPCDT)

**Status:** ACEITO  
**Data:** 2026-07-29  
**Autores:** Chief Medical Information Officer (CMIO), Chief Clinical Information Officer (CCIO), Principal Trust Services Architect, Principal PKI Architect  
**Referência:** Prompt 138 (ADPCDT), P136 AIEHSR, P137 AISTCOP, CFM 2.299/2021, CFP 15/2021, MP 2.200-2/2001

---

## Contexto

A Plataforma Aura necessita de uma camada de documentação clínica com validade jurídica, respeitando as normas dos Conselhos Federais de Medicina (CFM 2.299/2021), Psicologia (CFP 15/2021) e Serviço Social, além da infraestrutura ICP-Brasil (MP 2.200-2/2001). Os documentos emitidos devem ser imutáveis após assinatura, verificáveis publicamente e integrados ao Prontuário Eletrônico e à Gestão de Casos.

## Decisão

### 1. Código Sequencial Único por Documento

**Decisão:** Todos os documentos clínicos recebem um identificador sequencial imutável no formato `DOC-YYYY-XXXXX`, garantindo rastreabilidade humana sem expor UUIDs internos.

### 2. Conteúdo Imutável após Assinatura + Hash SHA-256

**Decisão:** O `DigitalPrescriptionService` gera o `contentHash` (SHA-256) no momento da emissão. Após a primeira assinatura, o conteúdo do documento não pode ser alterado. Retificações geram nova versão com `previousDocumentId`.

### 3. Carimbo do Tempo (TSA) Automático

**Decisão:** Ao concluir todas as assinaturas obrigatórias, o `TrustServicesEngine` emite automaticamente um `TimestampToken` compatível com RFC 3161 / ICP-Brasil, com código de verificação HMAC-SHA256 público e auditável.

### 4. Modos de Assinatura Configuráveis

**Decisão:** Cada documento suporta três modos:
- **SEQUENTIAL**: Assinaturas obrigatoriamente em ordem (ex: residente → supervisor)
- **PARALLEL**: Qualquer ordem entre os signatários
- **COSIGNATURE**: Assinaturas simultâneas de múltiplos profissionais

### 5. Templates Corporativos Versionados e Parametrizáveis

**Decisão:** O `TemplateManagementService` provê templates com interpolação de variáveis `{{variavel}}` para todos os tipos de documento, administráveis exclusivamente pelo `SUPER_ADMIN`. Templates padrão são pré-carregados no bootstrap da plataforma.

### 6. Distribuição Multicanal com Rastreabilidade

**Decisão:** O `DocumentDeliveryService` suporta distribuição via Portal, E-mail, WhatsApp Business API e Download Autenticado, registrando confirmação de entrega e log imutável de acesso.

### 7. Event-Driven Document Lifecycle (CloudEvents v1.0.3)

**Decisão:** Eventos publicados:
- `aura.documents.issued.v1`
- `aura.documents.signed.v1`
- `aura.documents.validated.v1`
- `aura.documents.delivered.v1`

## Consequências

- ✅ Conformidade com CFM 2.299/2021, CFP 15/2021, LGPD e MP 2.200-2/2001.
- ✅ Documentos com validade jurídica, verificáveis publicamente via código de verificação HMAC.
- ✅ Arquitetura preparada para integração com ICP-Brasil sem lock-in de fornecedor.

---

*Homologado pelo Clinical Legal & Trust Governance Board — ADPCDT Prompt 138*
