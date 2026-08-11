import { AiAssistantService } from './ai-assistant.service';
import { AssistantRole } from '../dto/ai.dto';

describe('AiAssistantService — PII/PHI Sanitization & Guardrails (Pilar 3)', () => {
  let service: AiAssistantService;
  let gatewayMock: any;
  let ragMock: any;
  let promptGovMock: any;
  let eventBusMock: any;

  beforeEach(() => {
    gatewayMock = {
      generateCompletion: jest.fn().mockImplementation(({ userPrompt }) =>
        Promise.resolve({
          content: `Resposta para: ${userPrompt}`,
          provider: 'MockAI',
          modelName: 'mock-model-v1',
          latencyMs: 50,
        }),
      ),
    };

    ragMock = {
      queryRag: jest.fn().mockResolvedValue({
        synthesizedAnswer: 'Contexto institucional mock',
        sourcesUsed: ['POP-001'],
      }),
    };

    promptGovMock = {
      findApprovedForRole: jest.fn().mockReturnValue(null),
    };

    eventBusMock = {
      publish: jest.fn().mockResolvedValue({} as any),
    };

    service = new AiAssistantService(
      gatewayMock,
      ragMock,
      promptGovMock,
      eventBusMock,
    );
  });

  it('deve desidentificar CPF, e-mail e telefone de um prompt antes de invocar o modelo', () => {
    const rawPrompt = 'Paciente João Santos, CPF 123.456.789-00, email joao@teste.com, fone (51) 99999-8888 relata insônia.';
    const sanitized = service.sanitizePii(rawPrompt);

    expect(sanitized).not.toContain('123.456.789-00');
    expect(sanitized).not.toContain('joao@teste.com');
    expect(sanitized).not.toContain('(51) 99999-8888');

    expect(sanitized).toContain('[CPF_DESIDENTIFICADO]');
    expect(sanitized).toContain('[EMAIL_DESIDENTIFICADO]');
    expect(sanitized).toContain('[TELEFONE_DESIDENTIFICADO]');
  });

  it('deve enviar prompt sanitizado ao gateway LLM', async () => {
    await service.invoke(
      {
        assistantRole: AssistantRole.PSYCHOLOGIST,
        userPrompt: 'Avaliar CPF 987.654.321-11 e email maria@aura.org com fone 51988887777',
      },
      'user-001',
    );

    expect(gatewayMock.generateCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        userPrompt: expect.stringContaining('[CPF_DESIDENTIFICADO]'),
      }),
    );
  });

  it('deve marcar de forma obrigatória requiresHumanReview = true e risco HIGH para papeis clínicos', async () => {
    const res = await service.invoke(
      {
        assistantRole: AssistantRole.PSYCHIATRIST,
        userPrompt: 'Quais os efeitos colaterais da Fluoxetina?',
      },
      'user-001',
    );

    expect(res.requiresHumanReview).toBe(true);
    expect(res.responseContent).toContain('Aviso de IA Responsável');
  });
});
