# DOCUMENTO DE ESPECIFICAÇÃO TÉCNICA E ARQUITETURAL (PRD/SAD)
## SISTEMA: PROJETO AURA - ECOSSISTEMA DIGITAL DE CUIDADO SOCIAL E SAÚDE MENTAL (INSTITUTO SER MELHOR)

**Data:** Junho 2026
**Status:** DRAFT (Fase 1 - Concepção e Arquitetura)
**Classificação:** Confidencial / Arquitetura Institucional e Social

---

## CAPÍTULO 1: MISSÃO E VISÃO GERAL
A plataforma do **Instituto Ser Melhor (Projeto Aura)** é um ecossistema digital de acolhimento, proteção social, saúde mental e gestão institucional. Desenhada para operar sob arquitetura de microsserviços e orientada à missão social, a plataforma visa atender crianças, adolescentes, mulheres vítimas de violência, famílias em vulnerabilidade e pessoas em sofrimento psíquico, conectando-os a uma rede de voluntários de alto nível técnico (psicólogos, assistentes sociais, advogados, educadores, etc.).

**Princípios Fundamentais Não Negociáveis:**
1. **O beneficiário no centro:** Interface minimalista, acolhedora e acessível (WCAG AA), desenhada para reduzir a ansiedade e facilitar o uso por pessoas em vulnerabilidade emocional ou baixa literacia digital.
2. **Sigilo absoluto:** A visibilidade das informações é restrita por papel, consentimento e necessidade assistencial (privilégio mínimo). O sigilo é a regra; o compartilhamento é a exceção auditável.
3. **Segurança e Privacidade (Compliance):** Aderência estrita à LGPD, normas do CFM/CRP e telessaúde. Separação explícita entre documentos de uso social, clínico e jurídico.
4. **Atuação Multidisciplinar Integrada:** Diferentes profissionais atuam de forma coordenada no mesmo "Caso", mantendo trilhas de auditoria rigorosas e preservando o sigilo entre equipes quando necessário.
5. **Autoridade e Humanidade:** O sistema não deve parecer um hospital frio nem uma clínica comercial, mas um espaço digital seguro, confiável e tecnicamente impecável.

### 1.1. Matriz Tecnológica
- **Edge & Ingress:** Cloudflare (WAF/CDN) -> AWS API Gateway / NGINX Ingress (K8s).
- **Backend (Microsserviços):** NestJS (Node.js/TypeScript). Integração via APIs REST e GraphQL.
- **Frontend:** Next.js (React/TypeScript) com SSR (Portal Institucional focado em transparência) e CSR/SPA (Painel de Gestão e Atendimento). Design System focado em baixo atrito cognitivo.
- **Camada de Dados:**
  - **Relacional:** PostgreSQL 16+ (Estruturado para SaaS multi-tenant da instituição).
  - **Cache & Sessões:** Redis Cluster.
  - **Busca, Auditoria & Analytics:** Elasticsearch / OpenSearch (logs imutáveis e indicadores).
- **Mensageria:** RabbitMQ para processamento assíncrono.
- **Storage:** AWS S3 criptografado (AES-256 via KMS) para anexos sensíveis (laudos, mídias, documentos protetivos).

---

## CAPÍTULO 2: REQUISITOS DE COMPLIANCE E SEGURANÇA

### 2.1. Autenticação e Autorização (Zero Trust)
- **Protocolos:** OIDC / OAuth 2.0 com tokens JWT de curta duração.
- **MFA (Multi-Factor Authentication):** Obrigatório para voluntários e gestores.
- **RBAC e ABAC:** Acesso granular. Um voluntário (ex: psicólogo) visualiza estritamente os prontuários dos beneficiários vinculados aos seus casos, mediante consentimento ativo.

### 2.2. Proteção de Dados (LGPD e Legislação Social/Saúde)
- **Minimização e Anonimização:** Mecanismos estruturados para geração de indicadores de impacto social e relatórios para financiadores sem expor dados pessoais.
- **Criptografia:** TLS 1.3 em trânsito; AES-256-GCM em repouso.
- **Auditoria Rigorosa:** Trilha de logs imutável e append-only de todas as ações no sistema (quem acessou, visualizou, modificou ou exportou informações sensíveis).

### 2.3. Validade Jurídica e ICP-Brasil
- Suporte a validação de documentos eletrônicos e integração com assinatura digital ICP-Brasil quando exigida por lei (ex: laudos médicos, atestados específicos).

---

## CAPÍTULO 3: ESCOPO FUNCIONAL E MÓDULOS PRINCIPAIS

### 3.1. Portal Institucional
- Home acolhedora contendo informações sobre projetos sociais, rede de apoio, voluntariado, e área de transparência/prestação de contas. Portais de entrada distintos para beneficiários, voluntários e gestores.

### 3.2. Gestão de Beneficiários e Casos Multidisciplinares
- **Beneficiários:** Cadastro profundo focando no contexto social (composição familiar, vulnerabilidades, medidas protetivas, consentimentos). Linha do tempo completa e unificada.
- **Gestão de Casos:** Um beneficiário pode ter múltiplos "Casos". Cada caso agrupa planos de cuidado e atuações de diferentes áreas (psicológica, social, jurídica), garantindo visão 360º com respeito às barreiras de sigilo profissional.

### 3.3. Gestão de Voluntários
- Cadastro de profissionais com registro de especialidades, validação de certificados, disponibilidade, carga horária e histórico de impacto/atendimentos. Gestão de escalas inteligente.

### 3.4. Teleatendimento e Protocolo Humanizado
- **Acolhimento Estruturado:** Fluxos guiados para avaliação inicial do estado emocional e identificação de risco imediato.
- **Teleconsulta (WebRTC):** Videochamada segura, nativa, com chat e envio de documentos.
- **Regra Especial do WhatsApp:** Integração com WhatsApp Business API **apenas** para notificações transacionais, lembretes e comunicação assistencial leve. *Limitações:* Fica documentado que a automação de videochamadas via WhatsApp oficial é limitada; o sistema exigirá um **fallback seguro** fornecendo um link criptografado para a videochamada nativa do Projeto Aura.

### 3.5. Prontuário, Registros e Rede de Proteção
- **Registros:** Evolução, anamnese, hipóteses e anexos com versionamento rigoroso e sigilo por padrão.
- **Rede de Proteção:** Módulo para gestão de encaminhamentos externos (CRAS, CREAS, Escolas, Conselho Tutelar, Hospitais) com registro de motivos, rastreamento de status e histórico de articulação em rede.

### 3.6. Projetos Sociais, Cursos e Sustentabilidade
- **Projetos:** Gestão de participação em programas específicos (Projeto Mulheres, Família, Empregabilidade).
- **Educação (EAD):** Trilhas formativas, palestras e certificados para beneficiários e capacitação técnica contínua para voluntários.
- **Sustentabilidade e Impacto:** Módulo de captação de recursos (doações recorrentes, campanhas, editais). Geração de dashboards com indicadores de impacto (horas voluntárias, taxa de retorno, encaminhamentos concluídos) para prestação de contas.

---
*Fim do Volume 1. Próximos passos: Modelagem de Dados, UI/UX Acessível e IaC.*
