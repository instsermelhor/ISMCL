import { CrisisDetectionEngine } from './crisis-detection.engine';
import { EventBusService } from '../../../events/event-bus.service';

describe('CrisisDetectionEngine', () => {
  let engine: CrisisDetectionEngine;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = {
      publish: jest.fn().mockResolvedValue({} as any),
    };
    engine = new CrisisDetectionEngine(eventBusMock as EventBusService);
  });

  it('should detect crisis when suicidal ideation keywords are present', async () => {
    const result = await engine.evaluate(
      'intake-123',
      'Paciente relata ideação de suicídio intensa e desespero',
      ['SUICIDE_RISK'],
      'tenant-a',
    );

    expect(result.hasCrisis).toBe(true);
    expect(result.severity).toBe('CRITICAL_IMMEDIATE');
    expect(result.protocolToTrigger).toBe('PROTOCOLO_EMERGENCIA_PSICOSSOCIAL_V1');
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.intake.crisis.detected.v1',
      expect.objectContaining({ intakeId: 'intake-123' }),
      'tenant-a',
      expect.anything(),
    );
  });

  it('should return NONE severity when no crisis indicators are present', async () => {
    const result = await engine.evaluate(
      'intake-456',
      'Solicitação de apoio para inserção em curso profissionalizante',
      ['CAREER_GUIDANCE'],
      'tenant-a',
    );

    expect(result.hasCrisis).toBe(false);
    expect(result.severity).toBe('NONE');
    expect(result.immediateActionsRequired).toHaveLength(0);
  });
});
