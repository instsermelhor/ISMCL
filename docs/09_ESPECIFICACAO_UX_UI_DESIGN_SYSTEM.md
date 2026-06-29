# ESPECIFICAÇÃO TÉCNICA — UX/UI E DESIGN SYSTEM (AURA UI)
## PROJETO AURA - INSTITUTO SER MELHOR

**Data:** Junho 2026
**Status:** DRAFT
**Foco:** Acessibilidade, Baixo Atrito Cognitivo e Acolhimento Digital

---

## 1. PRINCÍPIOS DO DESIGN SYSTEM (AURA UI)

O ecossistema atende pessoas em situação de extrema vulnerabilidade emocional e social. A interface não pode ser um obstáculo. O *Aura UI* é construído sobre as diretrizes WCAG 2.1 nível AA, garantindo navegação preditiva e baixo atrito cognitivo.

### 1.1. Atmosfera e Sensação (Look & Feel)
- **Não ao formato "Hospitalar":** Evitar excesso de azuis clínicos, cinzas frios e tabelas densas em telas de paciente.
- **Acolhimento e Segurança:** Uso de tons terrosos, pastéis, verdes suaves (esperança/saúde mental) e espaços em branco generosos (Negative Space) para reduzir a ansiedade visual.
- **Microcopy Humanizado:** "Como você está se sentindo hoje?" em vez de "Insira o sintoma principal". "Salvar anotações" em vez de "Gravar Prontuário Clínico Base".

### 1.2. Paleta de Cores Semântica (Tailwind CSS Base)
- **Primary (Acolhimento):** Teal (`#0D9488` a `#115E59`) - transmite calma, segurança e seriedade sem ser clínico demais.
- **Secondary (Apoio):** Sand/Beige (`#F5F5F4` a `#E7E5E4`) - utilizado para fundos de tela, fugindo do branco hospitalar agressivo.
- **Accent (Destaque):** Indigo suave (`#6366F1`) - para botões de ação primária (Ex: Iniciar Teleconsulta).
- **Destructive/Alerta:** Rose (`#E11D48`) - utilizado estritamente para ações irreversíveis (Ex: Encerrar Caso) ou risco agudo (Alerta de Ideação Suicida).

### 1.3. Tipografia
- **Font-Sans:** `Inter` ou `Space Grotesk`. Escolhida pela alta legibilidade em telas pequenas e clareza em números (importante para documentos e agendas).
- **Hierarquia:** Títulos sempre com peso `semibold` ou `medium`. Textos de apoio em `text-slate-500` com tamanho mínimo de `14px` (acessibilidade visual).

---

## 2. COMPONENTES PREPARADOS PARA USUÁRIOS EM SOFRIMENTO
Componentes desenhados especificamente para o estado emocional do usuário:

### 2.1. The "Panic Button" (Saída Rápida)
Para mulheres vítimas de violência (Projeto Mulheres), o portal do beneficiário possui um botão fixo de "Saída Rápida" (Quick Exit) que fecha o portal imediatamente e redireciona a aba para um site de notícias neutro (ex: Google ou G1), apagando o histórico da sessão atual, prevenindo que um agressor veja o acesso.

### 2.2. Formulários em Etapas (Steppers)
Fichas de anamnese longas causam exaustão. Todo formulário com mais de 5 campos deve ser quebrado em *Steppers* lógicos, salvando o progresso automaticamente a cada etapa (Auto-save).

### 2.3. Esqueletos de Carregamento (Skeleton Loaders)
Aguardar o carregamento de uma tela aumenta a ansiedade. O Aura UI utiliza Skeletons suaves que simulam a estrutura da tela enquanto os dados são buscados no backend, mantendo a percepção de performance.

---

## 3. ACESSIBILIDADE TÉCNICA (WCAG AA)
- **Contraste:** Todo texto sobre fundo deve passar na validação de contraste de 4.5:1.
- **Navegação por Teclado:** A plataforma administrativa pode ser 100% navegada por `Tab`. Focos (`focus-visible:ring`) são claros e não apenas suposições visuais.
- **Leitores de Tela (Screen Readers):** Uso semântico e rigoroso de atributos `aria-label`, `aria-hidden` para ícones puramente decorativos (Lucide React) e `role` em diálogos modais.

---

## 4. ESTRUTURA DO PAINEL CLÍNICO (VISUALIZAÇÃO SPLIT)

A tela de atendimento foi desenhada para eliminar a troca de abas durante a sessão:

**Layout Desktop (16:9):**
*   **Sidebar Esquerda (20%):** Dados rápidos do paciente, alertas de risco (Alergias, Risco Suicida).
*   **Centro Esquerda (40%):** O vídeo da teleconsulta (WebRTC) ou a visualização do Prontuário / Linha do Tempo.
*   **Centro Direita (40%):** O editor da Evolução (Draft) que salva automaticamente, sem interromper o contato visual com o paciente na tela.
