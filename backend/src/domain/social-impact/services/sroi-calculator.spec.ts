import { ProgramEvaluationService } from './program-evaluation.service';
import { SocialImpactAuditService } from './social-impact-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

describe('ProgramEvaluationService — SROI Calculator (Pilar 1)', () => {
  let service: ProgramEvaluationService;
  let auditMock: any;
  let eventBusMock: any;

  beforeEach(() => {
    auditMock = {
      recordAudit: jest.fn().mockResolvedValue({} as any),
    };
    eventBusMock = {
      publish: jest.fn().mockResolvedValue({} as any),
    };

    service = new ProgramEvaluationService(
      auditMock as SocialImpactAuditService,
      eventBusMock as EventBusService,
    );
  });

  it('deve calcular o SROI ratio e o valor social líquido com descontos de deadweight e displacement', () => {
    const result = service.calculateSroiRatio({
      totalProgramCostBrl: 100_000,
      outcomes: [
        { description: 'Reintegração Familiar Concluída', count: 50, unitValueBrl: 5_000 },
        { description: 'Capacitação Profissionalizada', count: 100, unitValueBrl: 2_500 },
      ],
      deadweightPercentage: 10,
      displacementPercentage: 5,
    });

    expect(result).toBeDefined();
    expect(result.grossSocialValueBrl).toBe(500_000); // (50 * 5000) + (100 * 2500)
    expect(result.netSocialValueBrl).toBe(427_500); // 500k * 0.90 * 0.95
    expect(result.sroiRatio).toBe(4.28); // 427,500 / 100,000 = 4.275 -> 4.28
    expect(result.totalOutcomesCount).toBe(150);
    expect(result.costPerOutcomeBrl).toBe(666.67);
  });

  it('deve lançar erro se o custo total do programa for menor ou igual a zero', () => {
    expect(() =>
      service.calculateSroiRatio({
        totalProgramCostBrl: 0,
        outcomes: [{ description: 'Resultado', count: 10, unitValueBrl: 1000 }],
      }),
    ).toThrow('maior que zero');
  });
});
