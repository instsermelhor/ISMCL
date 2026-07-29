# ADR-146: Aura Corporate University, Learning Management & Competency Development Platform (ACU-LMS)

**Status:** ACEITO  
**Data:** 2026-07-29  
**Autores:** Chief Learning Officer (CLO), Chief Human Resources Officer (CHRO), Chief Knowledge Officer (CKO), Principal LMS Architect  
**Referência:** Prompt 146 (ACU-LMS), LGPD, MCSI, Zero Trust

---

## Contexto

O Instituto Ser Melhor exige um ecossistema permanente de capacitação, formação continuada, gestão de competências (técnicas, clínicas, comportamentais e obrigatórias) e certificações digitais auditáveis para profissionais de saúde, colaboradores, voluntários, gestores e auditores da Plataforma Aura.

## Decisão

### 1. Catálogo de Cursos & LMS Engine (EAD / Presencial / Híbrido)

**Decisão:** O `CorporateUniversityService` administra o Catálogo de Cursos com identificadores únicos (`CRS-2026-XXXXX`), versão de conteúdo e suporte a 3 modalidades (`ONLINE`, `PRESENTIAL`, `HYBRID`).
- Categorias: `MANDATORY` (LGPD, Código de Ética), `CLINICAL` (Protocolos CFP/CFM), `TECHNICAL`, `BEHAVIORAL`, `INSTITUTIONAL`.
- Matrículas manuais ou automáticas via regras do Workflow Engine.
- Acompanhamento de progresso percentual (0% a 100%) e status (`ENROLLED`, `IN_PROGRESS`, `COMPLETED`, `DROPPED`).

### 2. Gestão por Competências & Trilhas Adaptativas

**Decisão:** Cada perfil profissional (ex: Psicólogo, Assistente Social, Voluntário, Gestor) possui uma matriz de competências associada a Trilhas de Aprendizagem recomendadas pela Inteligência Artificial.

### 3. Avaliações com Correção Automática

**Decisão:** O `AssessmentCertificationService` executa exames de conhecimento (provas objetivas, estudos de caso e exames práticos) com correção automática e cálculo de nota relativa ao `passingGrade` do curso.

### 4. Emissão de Certificados Digitais com QR Code e Assinatura SHA-256

**Decisão:** Concluído o curso com 100% de progresso e nota suficiente, o sistema emite um Certificado Digital com código auditável (`CERT-2026-XXXXX`), assinatura SHA-256 imutável, payload para leitura via QR Code e URL pública de verificação de autenticidade.

### 5. Event-Driven LMS Lifecycle (CloudEvents v1.0.3)

**Decisão:** Eventos publicados:
- `aura.lms.course.created.v1`
- `aura.lms.user.enrolled.v1`
- `aura.lms.enrollment.completed.v1`
- `aura.lms.assessment.finished.v1`
- `aura.lms.certificate.issued.v1`

## Consequências

- ✅ Disseminação contínua do conhecimento institucional do Instituto Ser Melhor.
- ✅ Garantia de capacitação obrigatória em LGPD e governança para 100% dos usuários da plataforma.
- ✅ Autenticidade pública e auditável de todas as certificações emitidas.

---

*Homologado pelo Conselho Acadêmico e de Aprendizagem Institucional — ACU-LMS Prompt 146*
