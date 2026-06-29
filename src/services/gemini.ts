import { GoogleGenAI } from '@google/genai';

const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';

let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error('Falha ao inicializar o cliente do Gemini AI:', error);
  }
}

/**
 * Clean and format the LLM response if needed.
 */
function cleanResponse(text: string): string {
  return text.trim();
}

/**
 * Fallback generator in case the Gemini API Key is not set or fails.
 * This simulates a high-quality clinical structuring using the SOAP framework.
 */
function generateMockSOAP(rawNotes: string): string {
  const notes = rawNotes.trim();
  if (!notes) {
    return `**SUBJETIVO (S):**
- Paciente relata sentimentos gerais de sobrecarga e oscilações no bem-estar emocional nas últimas semanas.
- Queixa-se de estresse relacionado às demandas de trabalho/familiares cotidianas.

**OBJETIVO (O):**
- Paciente demonstrou-se cooperativo durante a consulta virtual.
- Discurso coerente, orientado no tempo e espaço. Contato visual adequado pela tela.

**AVALIAÇÃO (A):**
- Quadro clínico compatível com estresse moderado de caráter adaptativo.
- Necessidade de monitoramento contínuo do humor e padrões de sono.

**PLANO (P):**
- Psicoeducação sobre técnicas de manejo do estresse.
- Pactuação de pequenos intervalos de descanso durante a jornada de trabalho.
- Retorno agendado para acompanhamento terapêutico regular em 14 dias.`;
  }

  // Basic NLP heuristic for simulated response
  const lower = notes.toLowerCase();
  let subjetivo = 'Paciente relata: ';
  let objetivo = 'Durante o atendimento remoto: ';
  let avaliacao = 'Hipótese/Avaliação Clínica: ';
  let plano = 'Plano de Ação: ';

  // Extracting details based on keywords
  if (lower.includes('sono') || lower.includes('dormir') || lower.includes('insonia') || lower.includes('insônia') || lower.includes('noite')) {
    subjetivo += 'Dificuldade importante para conciliar o sono, episódios de insônia e cansaço ao acordar. ';
    plano += 'Implementar protocolo de higiene do sono (evitar telas 1h antes de deitar, diminuir luzes). ';
  } else {
    subjetivo += 'Queixas subjetivas apresentadas pelo paciente sobre suas vivências cotidianas. ';
  }

  if (lower.includes('ansia') || lower.includes('ansiedade') || lower.includes('panico') || lower.includes('pânico') || lower.includes('nervos') || lower.includes('crise')) {
    subjetivo += 'Crises de ansiedade recorrentes e taquicardia em momentos de estresse. ';
    objetivo += 'Apresenta sinais corporais de ansiedade (fala acelerada, respiração superficial, inquietação motora). ';
    avaliacao += 'Transtorno de ansiedade a esclarecer. ';
    plano += 'Exercícios diários de respiração diafragmática (técnica 4-7-8) e técnicas de aterramento (grounding). ';
  } else {
    objetivo += 'Paciente calmo, focado, mantendo bom contato visual e receptivo às intervenções verbais. ';
    avaliacao += 'Evolução clínica dentro do esperado para o ciclo atual de intervenção. ';
  }

  if (lower.includes('chora') || lower.includes('chorou') || lower.includes('triste') || lower.includes('desanimo') || lower.includes('desânimo') || lower.includes('choro')) {
    subjetivo += 'Tristeza profunda, episódios frequentes de choro e desânimo generalizado. ';
    objetivo += 'Fácies deprimida, episódios de choro fácil durante a sessão e embotamento afetivo leve. ';
    avaliacao += 'Humor depressivo a monitorar. Risco de autoextermínio avaliado como baixo no momento. ';
    plano += 'Fortalecimento da rede de apoio social/familiar, incentivo a pequenas atividades diárias de lazer. ';
  }

  if (lower.includes('medicamento') || lower.includes('remedio') || lower.includes('remédio') || lower.includes('prescrev') || lower.includes('receita') || lower.includes('atestado')) {
    plano += 'Orientações de uso da medicação prescrita e entrega digital dos documentos assinados da sessão. ';
  }

  // Concatenate user notes if not mapped
  subjetivo += `\n- Notas adicionais registradas: "${notes}"`;
  objetivo += '\n- Tom de voz adequado, expressando sentimentos congruentes com a queixa.';
  
  if (avaliacao === 'Hipótese/Avaliação Clínica: ') {
    avaliacao += 'Acompanhamento clínico continuado. Paciente demonstra boa capacidade de insight.';
  }
  if (plano === 'Plano de Ação: ') {
    plano += 'Manutenção das sessões de psicoterapia semanalmente; monitoramento dos sintomas de estresse.';
  }

  return `**SUBJETIVO (S):**
- ${subjetivo}

**OBJETIVO (O):**
- ${objetivo}

**AVALIAÇÃO (A):**
- ${avaliacao}

**PLANO (P):**
- ${plano}
- Retorno em sessão subsequente conforme agendamento.`;
}

/**
 * Fallback generator for summarization.
 */
function generateMockSummary(rawNotes: string): string {
  const clean = rawNotes.trim();
  if (!clean) {
    return 'Resumo: Sessão realizada sem anotações clínicas inseridas no editor.';
  }
  return `Resumo Clínico da Sessão:
- Paciente abordou temas relevantes sobre sua rotina e aspectos de saúde mental.
- Anotações resumidas: "${clean.length > 200 ? clean.substring(0, 200) + '...' : clean}"
- Próximo passo definido: Agendamento mantido na frequência estabelecida.`;
}

/**
 * Structuring clinical evolution using SOAP methodology
 */
export async function generateSOAP(rawNotes: string): Promise<string> {
  if (!aiClient) {
    // Delay to simulate network request
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return generateMockSOAP(rawNotes);
  }

  try {
    const prompt = `Você é um assistente de inteligência artificial clínica e copiloto de saúde mental para o Instituto Ser Melhor.
Sua tarefa é estruturar as anotações rascunhadas de um profissional de saúde mental no formato de evolução clínica SOAP (Subjetivo, Objetivo, Avaliação, Plano).

Anotações Rascunhadas do Profissional:
"""
${rawNotes}
"""

Instruções importantes:
1. Retorne o texto estruturado usando Markdown, com títulos claros para as seções: **SUBJETIVO (S)**, **OBJETIVO (O)**, **AVALIAÇÃO (A)** e **PLANO (P)**.
2. Seja profissional, ético, preciso e use termos clínicos adequados.
3. Se houver informações insuficientes para alguma seção, descreva de forma genérica com base na prática clínica comum de acompanhamento psicológico/social.
4. Responda apenas com a evolução clínica estruturada, sem mensagens de introdução ou conclusão.
5. Escreva em Português do Brasil.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    if (response.text) {
      return cleanResponse(response.text);
    }
    return generateMockSOAP(rawNotes);
  } catch (error) {
    console.error('Erro na chamada da API do Gemini para SOAP:', error);
    return generateMockSOAP(rawNotes);
  }
}

/**
 * Summarizing the clinical notes for quick reference
 */
export async function generateSummary(rawNotes: string): Promise<string> {
  if (!aiClient) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return generateMockSummary(rawNotes);
  }

  try {
    const prompt = `Você é o Copiloto IA do Instituto Ser Melhor.
Crie um resumo clínico executivo curto e conciso (em 3 a 5 pontos) da sessão de atendimento, com base nas seguintes anotações rascunhadas:

Anotações:
"""
${rawNotes}
"""

Forneça apenas o resumo estruturado por marcadores, sem introdução ou conclusão. Escreva em Português do Brasil.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    if (response.text) {
      return cleanResponse(response.text);
    }
    return generateMockSummary(rawNotes);
  } catch (error) {
    console.error('Erro na chamada da API do Gemini para Resumo:', error);
    return generateMockSummary(rawNotes);
  }
}

/**
 * Synthesizes the clinical history / past evolutions of a patient.
 */
export async function summarizeHistory(evolutionsText: string): Promise<string> {
  if (!aiClient) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return `### SÍNTESE DO HISTÓRICO CLÍNICO (COPILOTO IA)

**1. Contexto e Queixa Principal:**
- Paciente (Ana Silva Santos) iniciou acompanhamento devido a altos níveis de estresse e ansiedade associados a sobrecarga ocupacional e histórico de violência doméstica (Protocolo Mulheres).

**2. Evolução Clínica:**
- Apresenta oscilações no humor e episódios de insônia inicial.
- Demonstra boa resposta a intervenções de psicoeducação sobre higiene do sono e estabelecimento de limites nas relações trabalhistas.
- Relata redução gradual de episódios agudos de crise de pânico ao longo das últimas sessões.

**3. Avaliação de Risco:**
- Vulnerabilidade de violência doméstica monitorada. Risco agudo de autoextermínio avaliado como baixo. Mantém boa rede de apoio social.

**4. Recomendações e Próximos Passos:**
- Foco em técnicas de regulação emocional (respiração diafragmática) e acompanhamento multidisciplinar continuado.`;
  }

  try {
    const prompt = `Você é o Copiloto IA do Instituto Ser Melhor.
Sua tarefa é ler as evoluções clínicas passadas do paciente fornecidas abaixo e gerar um resumo executivo sintetizado do histórico do paciente.
Destaque a queixa principal, evolução terapêutica, nível de risco/vulnerabilidade e próximos passos sugeridos.

Evoluções Clínicas Passadas:
"""
${evolutionsText}
"""

Retorne o resumo estruturado em Markdown, profissional e objetivo, adequado para prontuário clínico. Escreva em Português do Brasil.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    if (response.text) {
      return cleanResponse(response.text);
    }
    return 'Falha ao gerar síntese.';
  } catch (error) {
    console.error('Erro na chamada da API do Gemini para Síntese Histórica:', error);
    return 'Erro ao processar síntese histórica.';
  }
}

/**
 * Performs a semantic search simulation on the clinical record.
 */
export async function semanticSearch(query: string, documentsText: string): Promise<string> {
  if (!aiClient) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const lower = query.toLowerCase();
    
    if (lower.includes('sono') || lower.includes('dormir') || lower.includes('insônia') || lower.includes('insonia')) {
      return `**Resultado da busca semântica para: "${query}"**

Encontrado na **Sessão #4 (14/06/2026)**:
- *"Paciente refere dificuldades frequentes para manter o sono contínuo..."*
Encontrado na **Evolução Ativa (Teleconsulta)**:
- *"Higiene do sono pactuada como plano de ação..."*
*A IA identificou que as queixas de sono estão correlacionadas aos picos de estresse laboral discutidos na sessão.*`;
    }
    
    if (lower.includes('violência') || lower.includes('violencia') || lower.includes('doméstica') || lower.includes('domestica') || lower.includes('segurança') || lower.includes('perigo')) {
      return `**Resultado da busca semântica para: "${query}"**

Encontrado na **Sessão #3 (07/06/2026)**:
- *"Acolhimento realizado em decorrência do alerta de vulnerabilidade doméstica. Paciente manifestou receio e pediu sigilo absoluto..."*
*A IA observou que o tema da segurança pessoal foi abordado prioritariamente nas sessões iniciais.*`;
    }
    
    if (lower.includes('trabalho') || lower.includes('trabalhar') || lower.includes('emprego') || lower.includes('burnout')) {
      return `**Resultado da busca semântica para: "${query}"**

Encontrado na **Sessão #4 (14/06/2026)**:
- *"Paciente reporta crises de ansiedade semanais disparadas por sobrecarga no trabalho... estratégias de limites..."*
Encontrado na **Triagem / Anamnese Escolar/Ocupacional**:
- *"Relato de esgotamento e pressão de metas no ambiente corporativo..."*`;
    }

    return `**Resultado da busca semântica para: "${query}"**

Nenhuma correspondência exata encontrada para os termos nos registros do prontuário.
Dica: Tente buscar por palavras-chave como "sono", "trabalho" ou "ansiedade".`;
  }

  try {
    const prompt = `Você é o Copiloto IA do Instituto Ser Melhor.
Realize uma busca semântica e responda à pergunta do profissional clínica com base nos registros do prontuário abaixo.

Registros do Prontuário:
"""
${documentsText}
"""

Pergunta do Profissional:
"${query}"

Instruções:
1. Responda de forma direta e objetiva, citando as sessões ou trechos onde o assunto foi abordado.
2. Destaque em negrito os pontos mais importantes.
3. Se o assunto não foi abordado, informe educadamente.
4. Escreva em Português do Brasil.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    if (response.text) {
      return cleanResponse(response.text);
    }
    return 'Sem resultados.';
  } catch (error) {
    console.error('Erro na chamada da API do Gemini para Busca Semântica:', error);
    return 'Erro ao processar busca semântica.';
  }
}

