# ESPECIFICAÇÃO TÉCNICA — MÓDULO DE CADASTRO DE BENEFICIÁRIOS E CONTROLE DE ACESSO
## PROJETO AURA - INSTITUTO SER MELHOR

**Data:** Junho 2026
**Status:** DRAFT (Aguardando Validação)
**Foco:** Arquitetura Funcional, Modelagem, Regras de Negócio e Permissões

---

## 1. ARQUITETURA DE AMBIENTES E ACESSOS INDEPENDENTES

O sistema é fisicamente unificado no backend (Single Source of Truth), utilizando a mesma base de dados, mas **logicamente isolado** em dois portais de acesso web com URLs e escopos de segurança completamente independentes.

### 1.1. Portal Administrativo (`admin.institutosermelhor.org.br`)
Destinado à gestão integral do Instituto. Profissionais de saúde (em seu papel clínico) **não** possuem acesso a este portal.
- **Público:** Super Administrador, Administrador, Coordenadores, Gestores, Financeiro, Secretaria, Recepção, Equipe Administrativa.
- **Segurança de Acesso:**
  - Autenticação Multifator (MFA) obrigatória (TOTP/SMS).
  - Controle rigoroso de sessão ativa (timeout configurável, ex: 30 minutos de inatividade).
  - Registro compulsório de IP, dispositivo (User-Agent) e geolocalização aproximada.
  - Trilhas de auditoria (Audit Logs) para qualquer alteração cadastral ou visualização de dados.

### 1.2. Portal Clínico (`profissional.institutosermelhor.org.br`)
Destinado única e exclusivamente ao cuidado assistencial pelo voluntário.
- **Público:** Psicólogos, Psiquiatras, Assistentes Sociais, Advogados, Pedagogos, Médicos e demais especialistas.
- **Restrição Estrita:** 
  - **Zero visibilidade** para módulos financeiros, gestão estrutural, configurações do sistema ou dados administrativos do Instituto.
  - O profissional enxerga **apenas** a própria agenda e os prontuários dos beneficiários a ele vinculados por um "Caso" ativo.

---

## 2. NÍVEIS DE PERMISSÃO E SEGURANÇA (RBAC + ABAC)

A plataforma adota o princípio do menor privilégio. O fato de um usuário ser "Gestor" não lhe confere acesso de leitura ao conteúdo clínico.

### 2.1. O Papel do "Super Administrador"
Perfil com acesso root à plataforma administrativa, restrito à alta diretoria ou TI.
- **Poderes Estruturais:** Gerenciar usuários, definir permissões, configurar sistema, gerenciar módulos, dashboards e executar rotinas de backup.
- **Poderes sobre Dados Clínicos (ABAC/Quebra de Vidro):** O Super Administrador *pode* acessar um prontuário clínico protegido, **porém**, essa ação exige a inserção de uma **justificativa obrigatória**, aciona um alerta sistêmico para o conselho de ética/diretoria, e grava um log imutável no Elasticsearch (Auditoria "Break-Glass").

### 2.2. Separação de Visibilidade
- **Dado Social (Recepção/Triagem):** Nome, contato, endereço, composição familiar, vulnerabilidade. Visível para a equipe de acolhimento, serviço social e administração autorizada.
- **Dado Clínico (Prontuário/Evolução):** Diagnósticos, notas de sessão (psicoterapia/psiquiatria), documentos médicos. Visível **estritamente** para o profissional autor da nota e profissionais do mesmo caso (mediante consentimento do beneficiário para compartilhamento multidisciplinar).

---

## 3. MODELAGEM DO CADASTRO MESTRE (BENEFICIÁRIO)

Não existirão cadastros duplicados. O Beneficiário possui um único UUID que transita por todos os domínios (Agenda, Prontuário, Financeiro, EAD). A entidade Mestre é fragmentada logicamente para otimização, mas gerida como um agregado único:

### 3.1. Estrutura de Dados Mestre
1. **Dados Pessoais:** UUID, Nome Completo, Nome Social, CPF, RG (Órgão/Emissão), CNH, Passaporte, Nacionalidade, Naturalidade, Sexo, Identidade de Gênero, Estado Civil, Profissão, Escolaridade, Foto (URL S3), Assinatura Digital (Hash).
2. **Endereço e Geolocalização:** CEP, Logradouro, Número, Complemento, Bairro, Cidade, Estado, País, Lat/Lng.
3. **Contatos:** Telefone Principal/Secundário, WhatsApp, E-mail, Contato de Emergência (Nome, Parentesco, Telefone).
4. **Composição Familiar (Sub-entidade):** Pai, Mãe, Responsável Legal, Filhos, Dependentes, Rede de Apoio Comunitária.
5. **Informações Sociais e Contexto:** Renda Familiar, Situação Habitacional, Mapeamento de Vulnerabilidade, Benefícios Sociais, Situação de Trabalho, Programas/Projetos.
6. **Histórico Consolidado:** Agregação (ReadOnly) do Primeiro/Último atendimento, total de sessões, encaminhamentos e profissionais alocados.
7. **Termos e Consentimentos (Compliance LGPD):** Aceites versionados (Uso de Dados, Teleconsulta, Contato WhatsApp) com carimbo de tempo, IP e assinatura eletrônica simples/avançada.

---

## 4. REGRAS DE NEGÓCIO PRINCIPAIS

1. **Single Source of Truth (SSOT):** A alteração do endereço do beneficiário pela recepção (Portal Admin) reflete instantaneamente na ficha de rosto do prontuário visualizada pelo Psicólogo (Portal Clínico).
2. **Exclusão de Dados (Direito ao Esquecimento):** A exclusão de um beneficiário é do tipo *Soft Delete*. Dados clínicos e financeiros devem obedecer aos prazos legais de retenção (ex: 20 anos para prontuários de saúde no Brasil). O sistema oculta o registro de buscas gerais, mas mantém na base criptografada para compliance.
3. **Sincronização com Inteligência Artificial:** Alterações no quadro social disparam webhooks internos atualizando os *embeddings* de busca semântica, auxiliando no dashboard de impacto social (sem expor identificadores PII).

---

## 5. FLUXOS DE NAVEGAÇÃO E EXPERIÊNCIA DO USUÁRIO (UX/UI)

### 5.1. Padrões de Interface (SaaS High-End)
- **Minimalismo Acolhedor:** Fundo em tons pastéis (off-white/slate-50), tipografia legível (Inter/Space Grotesk), botões com cantos arredondados, reduzindo a carga cognitiva e a ansiedade visual. Acessibilidade WCAG AA (alto contraste onde necessário).
- **Recursos Transversais em todas as telas:** 
  - Barra de Pesquisa Global Inteligente (Busca por nome, CPF ou ID do caso).
  - Filtros Avançados (Drawer lateral) e Favoritos.
  - Modo Claro/Escuro suave.

### 5.2. Fluxo do Ambiente Administrativo
1. **Dashboard Executivo:** Visão aérea de impactos (Novos acolhimentos, Voluntários ativos, Fluxo de caixa de doações).
2. **Gestão de Beneficiários:** Listagem rica em tabela (DataGrid) com paginação server-side. Clique abre um "Side Panel" (Drawer) com abas (Dados Pessoais, Social, Casos Ativos, Documentos Administrativos).
3. **Gestão Institucional:** Menus laterais agrupando Financeiro (Doações, Convênios), Projetos Sociais, Cursos e Configurações de Sistema.

### 5.3. Fluxo do Ambiente Clínico
1. **Dashboard do Profissional:** Resumo do dia: "Bom dia, Dra. Camila. Você tem 4 acolhimentos agendados hoje."
2. **Agenda:** Calendário focado nos horários. 
3. **Sala de Atendimento (Record View):** Ao iniciar sessão, tela dividida:
   - *Esquerda:* Ficha do Paciente (Resumo social, Linha do Tempo cronológica do caso).
   - *Direita:* Editor de Evolução, Anamnese, e botão central de **Teleconsulta** e **Receituário**. Nenhuma aba de finanças ou métricas institucionais existe aqui.

---

## PRÓXIMOS PASSOS (AÇÃO DO SISTEMA)
Este documento estabelece as diretrizes arquiteturais. Se validado, os próximos passos sistêmicos serão:
1. Geração do código do Banco de Dados detalhado (DDL) para o Cadastro Mestre.
2. Implementação das rotas de Backend com guardas de autenticação (Admin vs Clinic).
3. Construção do Design System e Wireframes React para o Cadastro.
