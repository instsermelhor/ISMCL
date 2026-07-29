# ADR-145: Aura Enterprise Content Management, Digital Archives & Knowledge Governance Platform (AECM-KG)

**Status:** ACEITO  
**Data:** 2026-07-29  
**Autores:** Chief Information Officer (CIO), Chief Knowledge Officer (CKO), Principal ECM Architect, Principal Records Management Architect  
**Referência:** Prompt 145 (AECM-KG), P115 AEDM, LGPD, MCSI, Zero Trust

---

## Contexto

O Instituto Ser Melhor necessita de uma solução corporativa de Enterprise Content Management (ECM), responsável pela gestão unificada de todo o ciclo de vida dos documentos institucionais, administrativos, jurídicos, assistenciais e financeiros, com rigoroso versionamento, retenção, preservação digital e busca corporativa.

## Decisão

### 1. Modelo de Identificação Documental & Classificação de Segurança

**Decisão:** O `EnterpriseContentManagementService` gera identificadores únicos (UUID) e códigos auditáveis (`DOC-2026-XXXXX`).
- **Classificação da Informação (5 níveis):** `PUBLIC`, `INTERNAL`, `RESTRICTED`, `CONFIDENTIAL`, `HIGHLY_CONFIDENTIAL`.
- **Categorização:** `ADMINISTRATIVE`, `ASSISTENTIAL`, `FINANCIAL`, `LEGAL`, `INSTITUTIONAL`, `CONTRACT`, `POLICY`, `POP`.

### 2. Versionamento Imutável & Checksum SHA-256

**Decisão:** Toda alteração gera uma nova versão imutável (`v1`, `v2`...) associada a um checksum digital SHA-256 calculado a partir do conteúdo bruto. Nenhuma versão anterior pode ser sobrescrita ou destruída durante a fase de vigência documental.

### 3. Arquivo Digital Institucional & Preservação de Longo Prazo

**Decisão:** O `RetentionSearchService` gerencia a custódia de longo prazo dos documentos arquivados (`DocumentStatus.ARCHIVED`), garantindo verificação periódica de integridade criptográfica.

### 4. Tabela de Temporalidade & Descarte Seguro com Rastro de Auditoria

**Decisão:** O encerramento do ciclo de vida documental segue a Tabela de Temporalidade. O descarte seguro (`DocumentStatus.DISPOSED`) é de uso exclusivo de detentores de perfil `SUPER_ADMIN`, exigindo justificativa legal registrada e emissão de assinatura imutável de descarte SHA-256.

### 5. Enterprise Search Engine (Textual + OCR + Semântica + Metadados)

**Decisão:** O mecanismo de busca corporativa oferece pesquisa integrada por texto completo, metadados personalizados, palavras-chave e cálculo de relevância (score 0.0 a 1.0).

### 6. Event-Driven ECM Lifecycle (CloudEvents v1.0.3)

**Decisão:** Eventos publicados:
- `aura.ecm.document.created.v1`
- `aura.ecm.document.version.created.v1`
- `aura.ecm.document.archived.v1`
- `aura.ecm.document.disposed.v1`
- `aura.ecm.search.executed.v1`

## Consequências

- ✅ Gestão centralizada e auditável de todo o patrimônio informacional do Instituto Ser Melhor.
- ✅ Eliminação de riscos de perda ou alteração não autorizada de documentos oficiais.
- ✅ Conformidade plena com prazos legais de guarda e retenção documental (LGPD, normas assistenciais e tributárias).

---

*Homologado pelo Information & Content Governance Board — AECM-KG Prompt 145*
