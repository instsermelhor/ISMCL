import { GoalManagementService } from './goal-management.service';
import { CaseTimelineService } from './case-timeline.service';
import { EventBusService } from '../../../events/event-bus.service';
import { GoalCategory } from '../dto/case-management.dto';

describe('GoalManagementService', () => {
  let service: GoalManagementService;
  let timelineMock: Partial<CaseTimelineService>;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    timelineMock = {
      addEntry: jest.fn().mockResolvedValue({} as any),
    };
    eventBusMock = {
      publish: jest.fn().mockResolvedValue({} as any),
    };

    service = new GoalManagementService(
      timelineMock as CaseTimelineService,
      eventBusMock as EventBusService,
    );
  });

  it('should add a goal and record it in the timeline', async () => {
    const goal = await service.addGoal(
      {
        caseId: 'case-123',
        title: 'Acompanhamento Psicológico Semanal',
        category: GoalCategory.PSYCHOSOCIAL,
      },
      'tenant-a',
    );

    expect(goal).toBeDefined();
    expect(goal.caseId).toBe('case-123');
    expect(goal.completionPercentage).toBe(0);
    expect(goal.status).toBe('PENDING');
    expect(timelineMock.addEntry).toHaveBeenCalledWith(
      'case-123',
      'GOAL_ADDED',
      expect.stringContaining('Acompanhamento Psicológico Semanal'),
      expect.anything(),
    );
  });

  it('should mark goal as COMPLETED and publish CloudEvent when completion reaches 100%', async () => {
    const goal = await service.addGoal(
      {
        caseId: 'case-456',
        title: 'Estabilização de medicação',
        category: GoalCategory.CLINICAL,
      },
      'tenant-a',
    );

    const updated = await service.updateProgress(
      {
        goalId: goal.goalId,
        completionPercentage: 100,
        progressNotes: 'Paciente aderiu 100% à prescrição médica',
      },
      'tenant-a',
    );

    expect(updated.status).toBe('COMPLETED');
    expect(updated.completionPercentage).toBe(100);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.case.goal.completed.v1',
      expect.objectContaining({ goalId: goal.goalId, caseId: 'case-456' }),
      'tenant-a',
      expect.anything(),
    );
  });
});
