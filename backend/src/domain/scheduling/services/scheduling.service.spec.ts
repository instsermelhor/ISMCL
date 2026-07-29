import { SchedulingService } from './scheduling.service';
import { AppointmentModality } from '../dto/scheduling.dto';
import { EventBusService } from '../../../events/event-bus.service';

describe('SchedulingService', () => {
  let service: SchedulingService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = {
      publish: jest.fn().mockResolvedValue({} as any),
    };
    service = new SchedulingService(eventBusMock as EventBusService);
  });

  it('should create an appointment and emit aura.scheduling.appointment.created.v1', async () => {
    const apt = await service.create({
      beneficiaryId: 'benef-001',
      professionalId: 'prof-001',
      modality: AppointmentModality.TELEHEALTH,
      scheduledAt: new Date(Date.now() + 3_600_000).toISOString(),
      durationMinutes: 50,
    });

    expect(apt.appointmentId).toBeDefined();
    expect(apt.sequentialCode).toMatch(/^AGD-\d{4}-\d{5}$/);
    expect(apt.status).toBe('PENDING');
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.scheduling.appointment.created.v1',
      expect.objectContaining({ appointmentId: apt.appointmentId }),
      'default',
      expect.anything(),
    );
  });

  it('should confirm a PENDING appointment', async () => {
    const apt = await service.create({
      beneficiaryId: 'benef-002',
      professionalId: 'prof-002',
      modality: AppointmentModality.IN_PERSON,
      scheduledAt: new Date(Date.now() + 7_200_000).toISOString(),
      durationMinutes: 30,
    });
    const confirmed = await service.confirm(apt.appointmentId);
    expect(confirmed.status).toBe('CONFIRMED');
    expect(confirmed.confirmedAt).toBeDefined();
  });

  it('should cancel an appointment', async () => {
    const apt = await service.create({
      beneficiaryId: 'benef-003',
      professionalId: 'prof-003',
      modality: AppointmentModality.HOME_VISIT,
      scheduledAt: new Date(Date.now() + 86_400_000).toISOString(),
      durationMinutes: 60,
    });
    const cancelled = await service.cancel({ appointmentId: apt.appointmentId, reason: 'Beneficiário indisponível' });
    expect(cancelled.status).toBe('CANCELLED');
    expect(cancelled.cancelReason).toBe('Beneficiário indisponível');
  });

  it('should throw ConflictException on schedule overlap for same professional', async () => {
    const base = {
      professionalId: 'prof-conflict',
      modality: AppointmentModality.IN_PERSON,
      durationMinutes: 60,
    };
    const scheduledAt = new Date(Date.now() + 3_600_000).toISOString();
    await service.create({ ...base, beneficiaryId: 'benef-A', scheduledAt });

    await expect(
      service.create({ ...base, beneficiaryId: 'benef-B', scheduledAt }),
    ).rejects.toThrow('Conflito de agenda');
  });
});
