import { EligibilityEngine } from './eligibility.engine';

describe('EligibilityEngine', () => {
  let engine: EligibilityEngine;

  beforeEach(() => {
    engine = new EligibilityEngine();
  });

  it('should approve low-income family (<= 0.5 minimum wage) with high score and priority programs', () => {
    const result = engine.evaluate({
      registrationId: 'reg-123',
      monthlyIncome: 700.0, // R$ 700 para 2 pessoas = R$ 350 per capita (<= half min wage)
      familyMembersCount: 2,
      location: 'SP - São Paulo',
      vulnerabilityFactors: ['MORADIA_RISCO', 'DESEMPREGO'],
    });

    expect(result.isEligible).toBe(true);
    expect(result.status).toBe('APPROVED');
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.approvedPrograms).toContain('ATENDIMENTO_CLINICO_GRATUITO_PRIORITARIO');
  });

  it('should reject high-income family (> 2 minimum wages per capita)', () => {
    const result = engine.evaluate({
      registrationId: 'reg-high-income',
      monthlyIncome: 10000.0,
      familyMembersCount: 2, // R$ 5.000 per capita
      location: 'SP - São Paulo',
    });

    expect(result.isEligible).toBe(false);
    expect(result.status).toBe('REJECTED');
    expect(result.rejectionReasons.length).toBeGreaterThan(0);
  });
});
