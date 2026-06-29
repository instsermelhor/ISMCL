# ESPECIFICAÇÃO TÉCNICA — ACESSIBILIDADE E BAIXA CARGA COGNITIVA
## PROJETO AURA - INSTITUTO SER MELHOR

**Data:** Junho 2026
**Foco:** Trauma-Informed Design, WCAG AA, Experiência do Beneficiário e Acolhimento

---

## 1. O PRINCÍPIO DO TRAUMA-INFORMED DESIGN (DESIGN GUIADO PELO TRAUMA)

A plataforma do Instituto Ser Melhor será acessada por pessoas em momentos de crise, luto, ansiedade severa ou risco de violência. O design da interface não é apenas estético, mas uma ferramenta clínica de acolhimento. A interface deve transmitir **calma, segurança e previsibilidade**.

### 1.1. Redução de Gatilhos e Ansiedade
*   **Ausência de Cronômetros Agressivos:** Se uma sessão for expirar por inatividade, o aviso deve ser suave ("Sua sessão foi protegida para sua segurança") e não punitivo ("Sessão expirada!").
*   **Previsibilidade de Ações (Progressive Disclosure):** Não apresentar formulários de 50 campos de uma vez. Usar a revelação progressiva: perguntas divididas em passos lógicos (Steppers), sempre informando em qual passo o usuário está ("Passo 2 de 4: Sobre sua saúde").
*   **Cores Terapêuticas e Semânticas:** 
    *   Abandonar o vermelho clássico de erro (`#FF0000`) que gera urgência. Utilizar tons de Rose ou Coral.
    *   Usar tons pastéis e terrosos para fundos (ex: `slate-50`, `stone-100`).
    *   Reserva estrita da cor de "Alerta/Perigo" apenas para situações que exijam resposta aguda (ex: Gatilho de Risco de Vida/Ideação Suicida no lado clínico).

### 1.2. Microcopy Acolhedor (Linguagem)
*   A linguagem deve ser inclusiva, direta e desprovida de jargões burocráticos ou médicos.
*   *Em vez de:* "Submeta sua anamnese no portal do paciente."
*   *Usar:* "Conte um pouco sobre como você está se sentindo."
*   *Em vez de:* "Erro 500: Falha no servidor."
*   *Usar:* "Nossos sistemas estão sobrecarregados no momento. Por favor, respire fundo e tente novamente em instantes."

---

## 2. ACESSIBILIDADE TÉCNICA (CONFORMIDADE WCAG 2.1 AA)

A acessibilidade garante que usuários com deficiências visuais, motoras ou cognitivas possam usar a plataforma de forma autônoma.

### 2.1. Navegação Inclusiva
*   **Full Keyboard Navigation:** Todo o sistema (especialmente o portal clínico e administrativo) deve ser 100% operável via teclado (Tab, Enter, Space, Setas).
*   **Focus Ring Visível:** O estado de foco (`:focus-visible`) nunca será removido. O Aura UI usará anéis de foco com cores de alto contraste (ex: `ring-4 ring-teal-500/50`) para indicar claramente onde o usuário está na tela.
*   **Skip to Content:** Implementação de links invisíveis no topo da página ("Pular para o conteúdo principal") para usuários de leitores de tela não precisarem ouvir o menu inteiro a cada navegação.

### 2.2. Otimização para Leitores de Tela (Screen Readers)
*   **Uso estrito de ARIA Labels:** Elementos visuais não textuais (ícones, botões sem texto) devem ter descrições claras.
    ```jsx
    // Errado:
    <button><BellIcon /></button>
    // Correto:
    <button aria-label="Ver suas notificações, você tem 2 não lidas"><BellIcon aria-hidden="true" /></button>
    ```
*   **Anúncios Dinâmicos (Live Regions):** Quando uma mensagem do chat chegar ou uma teleconsulta for iniciada pelo médico, um `aria-live="polite"` notificará o leitor de tela do usuário de forma amigável.

### 2.3. Contraste e Tipografia Flexível
*   O contraste entre texto e fundo deve ser de no mínimo **4.5:1** para textos normais e **3:1** para textos grandes.
*   Uso de unidades relativas (`rem`) no CSS (Tailwind) para que, se o beneficiário aumentar o zoom da fonte no sistema operacional (muito comum para idosos e pessoas com baixa visão), o layout se adapte sem "quebrar" os componentes.

---

## 3. COMPONENTES-CHAVE PARA BAIXA CARGA COGNITIVA

### 3.1. Estado de "Loading" Humanizado
Telas em branco geram ansiedade (o sistema travou?). 
*   Implementaremos **Skeleton Loaders** (sombras que imitam a forma do conteúdo a ser carregado).
*   Mensagens de carregamento empáticas: *"Preparando seu espaço seguro..."* em vez de *"Carregando banco de dados..."*.

### 3.2. Botão de Pânico (Quick Exit) - Requisito de Segurança
*   Conforme especificado, mulheres em risco podem acessar a plataforma vigiadas pelo agressor.
*   **Função:** Um botão flutuante e um atalho de teclado (ex: pressionar `ESC` três vezes seguidas).
*   **Ação:** O botão limpa o estado sensível da tela com a técnica de `history.replaceState` (para o navegador não registrar no histórico) e redireciona instantaneamente para uma página neutra (ex: previsão do tempo, Google, G1).

### 3.3. Confirmações de Ação Destrutiva Suaves
Para evitar erros acidentais que causam frustração:
*   Ações críticas (como Cancelar uma Consulta) exigem duas etapas ou um "Slide to Confirm" (deslizar para confirmar) no mobile, diminuindo cancelamentos acidentais por toques involuntários.
