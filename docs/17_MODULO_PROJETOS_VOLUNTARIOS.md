# ESPECIFICAÇÃO TÉCNICA — MÓDULO DE PROJETOS SOCIAIS E VOLUNTARIADO
## PROJETO AURA - INSTITUTO SER MELHOR

**Data:** Junho 2026
**Foco:** Gestão de Equipes Voluntárias, Projetos Temáticos e Match Assistencial

---

## 1. VISÃO GERAL DO MÓDULO

O Instituto Ser Melhor depende integralmente da força de trabalho de profissionais voluntários qualificados e da estruturação de seus atendimentos em "Projetos Sociais" temáticos. Este módulo é a ponte que garante que o voluntário certo atenda o beneficiário certo, no âmbito de um projeto específico (ex: Projeto Mulheres, Projeto Adolescência, Projeto Recomeçar).

---

## 2. GESTÃO DE VOLUNTÁRIOS (O "MOTOR" DO INSTITUTO)

O voluntário é um profissional doando seu tempo. O sistema deve facilitar seu trabalho, valorizar seu tempo e garantir compliance com os Conselhos de Classe.

### 2.1. Jornada do Voluntário (Onboarding)
1. **Cadastro e Vetting (Triagem):** O candidato preenche o formulário informando sua profissão, especialidade, número de registro (CRP/CRM/OAB) e disponibilidade.
2. **Validação Administrativa:** O RH/Coordenação do Instituto aprova o voluntário após entrevista e validação do registro ativo nos conselhos de classe (via integração manual ou API pública).
3. **Assinatura do Termo de Voluntariado:** O profissional assina digitalmente o termo de compromisso e o NDA (Acordo de Confidencialidade Absoluta).
4. **Alocação na Agenda:** O profissional define os blocos de horário que doará semanalmente (ex: "Quartas, das 14h às 18h").

### 2.2. Perfis Multidisciplinares
O sistema suporta e categoriza:
*   **Clínicos:** Psicólogos, Psiquiatras, Médicos. (Têm acesso ao Módulo EMR/Prontuário Sigiloso).
*   **Apoio e Proteção:** Assistentes Sociais, Advogados. (Acesso ao perfil socioeconômico e acompanhamento de Casos/Medidas protetivas).
*   **Formação e Educação:** Pedagogos, Terapeutas Ocupacionais, Educadores. (Acesso focado nos Projetos de Empregabilidade e EAD).

### 2.3. Painel do Voluntário (Gamificação e Retenção)
Para manter o voluntário engajado, o dashboard clínico possui uma área de **"Impacto Pessoal"**:
*   Gráficos mostrando o número de horas doadas no mês e no ano.
*   Quantos beneficiários foram auxiliados.
*   Emissão automática de **Certificado de Horas Voluntárias** (muito valorizado para currículos e estudantes de pós-graduação), assinado digitalmente pelo Instituto.

---

## 3. MÓDULO DE PROJETOS SOCIAIS E ENCAMINHAMENTOS

Os Projetos Sociais são "Guarda-Chuvas" lógicos que agrupam recursos, voluntários e beneficiários em torno de um objetivo comum ou faixa demográfica.

### 3.1. Estrutura de um Projeto Social (Ex: "Projeto Mulheres")
Cada Projeto possui no sistema:
*   **Coordenador(es):** Usuários do portal Administrativo que gerenciam a fila.
*   **Fila de Espera (Triage Queue):** Beneficiários encaminhados após a triagem inicial ou que solicitaram ajuda especificamente para o tema.
*   **Voluntários Alocados:** Lista de psicólogos/assistentes sociais treinados e capacitados para atuar naquele nicho (ex: trauma por violência doméstica).
*   **Trilhas Associadas:** Cursos, cartilhas e lives vinculadas ao projeto (consumidos no módulo EAD do beneficiário).

### 3.2. O Ciclo de "Match" (Beneficiário <> Voluntário)
1. **Acolhimento/Triagem:** O beneficiário faz o primeiro contato. A recepção do Instituto preenche o "Cadastro Mestre" e o encaminha para a *Fila do Projeto Mulheres*.
2. **Avaliação de Risco:** Um coordenador analisa a vulnerabilidade e define a prioridade (urgência).
3. **Matching (Distribuição):** O sistema cruza a prioridade do beneficiário com a agenda vazia dos psicólogos alocados no "Projeto Mulheres".
4. **Criação do Caso (Case):** O vínculo é oficializado. É criado um ID de Caso, vinculando Beneficiário + Psicólogo + Assistente Social. A partir deste momento, as agendas são liberadas e o prontuário EMR é instanciado com o sigilo parametrizado.

---

## 4. REDE DE PROTEÇÃO (ENCAMINHAMENTOS EXTERNOS)

Nem todos os problemas podem ser resolvidos dentro do Instituto. A plataforma fará a gestão sistêmica da Rede de Apoio Institucional (CRAS, CREAS, Defensoria).

### 4.1. Funcionalidade de Encaminhamento
*   O Assistente Social gera um **"Documento de Encaminhamento"** oficial pelo sistema (com template padrão do Instituto).
*   Fica registrado na linha do tempo do Beneficiário: *"15/06 - Encaminhado ao CREAS para solicitação de medida protetiva. Responsável: Assistente Social Maria."*
*   **Follow-up (Devolutiva):** O sistema gera um alerta (Kanban) para a equipe social "cobrar" o retorno do órgão público após X dias, garantindo que o beneficiário não se perca na burocracia do Estado.
