import { Test, TestingModule } from '@nestjs/testing';
import { ReminderSchedulerService } from './reminder-scheduler.service';
import { NotificationOrchestratorService } from './notification-orchestrator.service';
import { NotificationEventType, NotificationChannel } from '../dto/actg.dto';

describe('ReminderSchedulerService — GAP-P2-01 (Scheduler de Lembretes ACTG & Idempotência Redis)', () => {
  let service: ReminderSchedulerService;
  let orchestratorMock: any;
  let prismaMock: any;

  const fixedNow = new Date('2026-08-11T10:00:00.000Z');

  // Criamos agendamentos modelo para cada janela
  const appt7d = {
    id: 'appt-7d',
    status: 'SCHEDULED',
    scheduledStart: new Date(fixedNow.getTime() + 168.5 * 60 * 60 * 1000), // ~7d depois
    beneficiaryId: 'ben-01',
    professionalId: 'prof-01',
    channelType: 'ONLINE',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    beneficiary: { id: 'ben-01', fullName: 'Carlos Eduardo', phone: '51999999999', email: 'carlos@exemplo.com' },
    professional: { id: 'prof-01', fullName: 'Dra. Ana Paula' },
  };

  const appt24h = {
    id: 'appt-24h',
    status: 'CONFIRMED',
    scheduledStart: new Date(fixedNow.getTime() + 24.5 * 60 * 60 * 1000), // ~24.5h depois
    beneficiaryId: 'ben-02',
    professionalId: 'prof-01',
    channelType: 'ONLINE',
    meetingLink: 'https://meet.google.com/xyz-uvwx-rst',
    beneficiary: { id: 'ben-02', fullName: 'Mariana Lima', phone: '51988888888', email: 'mariana@exemplo.com' },
    professional: { id: 'prof-01', fullName: 'Dra. Ana Paula' },
  };

  beforeEach(async () => {
    prismaMock = {
      appointment: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          const gte = where.scheduledStart.gte.getTime();
          const lte = where.scheduledStart.lte.getTime();

          const results = [];
          if (appt7d.scheduledStart.getTime() >= gte && appt7d.scheduledStart.getTime() <= lte) {
            results.push(appt7d);
          }
          if (appt24h.scheduledStart.getTime() >= gte && appt24h.scheduledStart.getTime() <= lte) {
            results.push(appt24h);
          }
          return Promise.resolve(results);
        }),
      },
    };

    orchestratorMock = {
      notify: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReminderSchedulerService,
        { provide: 'PrismaService', useValue: prismaMock },
        { provide: NotificationOrchestratorService, useValue: orchestratorMock },
      ],
    })
      .overrideProvider(ReminderSchedulerService)
      .useFactory({
        factory: () => new ReminderSchedulerService(prismaMock, orchestratorMock),
      })
      .compile();

    service = module.get<ReminderSchedulerService>(ReminderSchedulerService);
    jest.clearAllMocks();
  });

  it('deve processar e disparar lembretes para agendamentos nas janelas 7d e 24h', async () => {
    const result = await service.processRemindersWindow(fixedNow);

    expect(result.processedCount).toBe(2);
    expect(orchestratorMock.notify).toHaveBeenCalledTimes(2);

    expect(orchestratorMock.notify).toHaveBeenNthCalledWith(
      1,
      NotificationEventType.REMINDER_7D,
      expect.objectContaining({
        appointmentId: 'appt-7d',
        recipientId: 'ben-01',
        recipientName: 'Carlos Eduardo',
      }),
    );

    expect(orchestratorMock.notify).toHaveBeenNthCalledWith(
      2,
      NotificationEventType.REMINDER_24H,
      expect.objectContaining({
        appointmentId: 'appt-24h',
        recipientId: 'ben-02',
        recipientName: 'Mariana Lima',
      }),
    );
  });

  it('não deve disparar lembretes se não houver agendamentos nas janelas', async () => {
    prismaMock.appointment.findMany.mockResolvedValue([]);

    const result = await service.processRemindersWindow(fixedNow);

    expect(result.processedCount).toBe(0);
    expect(orchestratorMock.notify).not.toHaveBeenCalled();
  });

  it('deve lidar graciosamente com exceções no handleHourlyReminders', async () => {
    prismaMock.appointment.findMany.mockRejectedValue(new Error('Erro de Conexão DB'));

    await expect(service.handleHourlyReminders()).resolves.not.toThrow();
  });
});
