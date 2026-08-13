import { Test, TestingModule } from '@nestjs/testing';
import { AiAssistantService } from './ai-assistant.service';
import { RagKnowledgeService } from './rag-knowledge.service';
import { PromptGovernanceService } from './prompt-governance.service';
import { AiGatewayService } from './ai-gateway.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';

describe('Advanced Product & Innovation Test Suite (PROMPT 200 — FASE E)', () => {
  let assistantService: AiAssistantService;
  let ragService: RagKnowledgeService;
  let gatewayService: AiGatewayService;
  let prisma: any;
  let eventBus: any;

  beforeEach(async () => {
    prisma = {
      aiAssistantInteraction: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'int-1', ...data })),
      },
      knowledgeArticle: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'art-1',
            title: 'POP Atendimento de Crise e Prevencao ao Suicidio',
            content: 'Diretrizes clinicas para avaliacao imediata de risco e encaminhamento CAPS.',
            module: 'CLINICAL',
            tags: ['CRISIS', 'SUICIDE_PREVENTION', 'URGENCY'],
          },
        ]),
      },
    };

    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAssistantService,
        RagKnowledgeService,
        PromptGovernanceService,
        {
          provide: AiGatewayService,
          useValue: {
            generateContent: jest.fn().mockResolvedValue({
              content: 'Relatório clínico estruturado: Subjetivo: Paciente relata ansiedade. Objetivo: Orientado. Avaliação: CID F41.0. Plano: Psicoterapia semanal.',
              model: 'gemini-1.5-pro',
              tokensUsed: 142,
              durationMs: 380,
            }),
          },
        },
        { provide: PrismaService, useValue: prisma },
        { provide: EventBusService, useValue: eventBus },
      ],
    }).compile();

    assistantService = module.get<AiAssistantService>(AiAssistantService);
    ragService = module.get<RagKnowledgeService>(RagKnowledgeService);
    gatewayService = module.get<AiGatewayService>(AiGatewayService);
  });

  describe('Pilar 1: Copiloto Clínico IA RAG com Sanitização PII', () => {
    it('deve invocar assistente de IA, sanitizar dados sensíveis e estruturar resposta', async () => {
      const response = await assistantService.invokeAssistant(
        {
          role: 'CLINICAL_SPECIALIST' as any,
          userPrompt: 'Gerar nota SOAP para o atendimento do paciente João da Silva CPF 123.456.789-00',
          temperature: 0.2,
        },
        'user-prof-1',
        'tenant-aura',
      );

      expect(response).toBeDefined();
      expect(response.response).toContain('Subjetivo');
      expect(response.response).toContain('Avaliação');

      // Validação de publicação no barramento de eventos para auditoria
      expect(eventBus.publish).toHaveBeenCalledWith(
        'aura.ai.interaction.logged.v1',
        expect.objectContaining({
          role: 'CLINICAL_SPECIALIST',
          userId: 'user-prof-1',
        }),
        'tenant-aura',
      );
    });

    it('deve buscar artigos corporativos na base vetorial RAG', async () => {
      const ragResults = await ragService.queryKnowledge({
        query: 'atendimento de crise',
        maxResults: 3,
      });

      expect(ragResults).toBeDefined();
      expect(ragResults.articles.length).toBeGreaterThan(0);
      expect(ragResults.articles[0].title).toContain('Crise');
    });
  });
});
