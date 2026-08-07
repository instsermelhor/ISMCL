import { Test, TestingModule } from '@nestjs/testing';
import { ACTGGatewayService } from './actg-gateway.service';
import { ProviderRegistryService } from './provider-registry.service';
import { FallbackEngineService } from './fallback-engine.service';
import { NotificationOrchestratorService } from './notification-orchestrator.service';
import { ProviderHealthService } from './provider-health.service';
import { EventBusService } from '../../../events/event-bus.service';
import { ChannelType } from '../dto/actg.dto';

const mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };
const mockRegistry = {
  getProvider: jest.fn(),
  getProviderOrThrow: jest.fn(),
  hasProvider: jest.fn().mockReturnValue(true),
  listProviders: jest.fn().mockReturnValue([]),
};
const mockFallback = {
  selectChannel: jest.fn().mockResolvedValue({
    selectedChannel: ChannelType.GOOGLE_MEET,
    isFallback: false,
    originalChannel: ChannelType.GOOGLE_MEET,
    reason: 'Canal primário disponível',
  }),
};
const mockNotification = { notify: jest.fn().mockResolvedValue(undefined) };
const mockHealth = { getLastStatus: jest.fn(), getAllStatuses: jest.fn() };

describe('ACTGGatewayService', () => {
  let service: ACTGGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ACTGGatewayService,
        { provide: ProviderRegistryService, useValue: mockRegistry },
        { provide: FallbackEngineService, useValue: mockFallback },
        { provide: NotificationOrchestratorService, useValue: mockNotification },
        { provide: ProviderHealthService, useValue: mockHealth },
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();
    service = module.get<ACTGGatewayService>(ACTGGatewayService);
    jest.clearAllMocks();
  });

  it('deve criar sessão para canal IN_PERSON sem chamar provedor externo', async () => {
    mockFallback.selectChannel.mockResolvedValueOnce({
      selectedChannel: ChannelType.IN_PERSON,
      isFallback: false,
      originalChannel: ChannelType.IN_PERSON,
      reason: 'Canal presencial',
    });

    const session = await service.createSession(
      'apt-001',
      { channelType: ChannelType.IN_PERSON },
      new Date(),
      new Date(Date.now() + 3600000),
      'Atendimento',
      { mcsiLevel: 0, allowAutoFallback: true, fallbackChannels: [] },
    );

    expect(session.channelType).toBe(ChannelType.IN_PERSON);
    expect(session.externalMeetingId).toBeUndefined();
    expect(mockRegistry.getProviderOrThrow).not.toHaveBeenCalled();
  });

  it('deve garantir idempotência — não criar sessão duplicada para mesmo agendamento', async () => {
    const mockProvider = {
      createSession: jest.fn().mockResolvedValue({
        externalMeetingId: 'ext-001',
        joinUrl: 'https://meet.google.com/abc',
        providerType: 'GOOGLE_MEET',
      }),
    };
    mockRegistry.getProviderOrThrow.mockReturnValue(mockProvider);

    // Primeira criação
    await service.createSession(
      'apt-002',
      { channelType: ChannelType.GOOGLE_MEET },
      new Date(),
      new Date(Date.now() + 3600000),
      'Atendimento',
      { mcsiLevel: 0, allowAutoFallback: true, fallbackChannels: [] },
    );

    // Segunda criação para o mesmo agendamento — deve retornar existente
    await service.createSession(
      'apt-002',
      { channelType: ChannelType.GOOGLE_MEET },
      new Date(),
      new Date(Date.now() + 3600000),
      'Atendimento',
      { mcsiLevel: 0, allowAutoFallback: true, fallbackChannels: [] },
    );

    // Provedor deve ter sido chamado apenas uma vez
    expect(mockProvider.createSession).toHaveBeenCalledTimes(1);
  });

  it('deve publicar evento CloudEvent ao criar sessão', async () => {
    const mockProvider = {
      createSession: jest.fn().mockResolvedValue({
        externalMeetingId: 'ext-003',
        joinUrl: 'https://meet.google.com/xyz',
        providerType: 'GOOGLE_MEET',
      }),
    };
    mockRegistry.getProviderOrThrow.mockReturnValue(mockProvider);

    await service.createSession(
      'apt-003',
      { channelType: ChannelType.GOOGLE_MEET },
      new Date(),
      new Date(Date.now() + 3600000),
      'Atendimento',
      { mcsiLevel: 0, allowAutoFallback: true, fallbackChannels: [] },
    );

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      'aura.actg.session.created.v1',
      expect.objectContaining({ appointmentId: 'apt-003', channelType: ChannelType.GOOGLE_MEET }),
      'default',
      expect.any(Object),
    );
  });

  it('deve publicar evento de fallback quando canal alternativo é usado', async () => {
    mockFallback.selectChannel.mockResolvedValueOnce({
      selectedChannel: ChannelType.TEAMS,
      isFallback: true,
      originalChannel: ChannelType.GOOGLE_MEET,
      reason: 'Google Meet indisponível',
    });
    const mockProvider = {
      createSession: jest.fn().mockResolvedValue({
        externalMeetingId: 'teams-001',
        joinUrl: 'https://teams.microsoft.com/xxx',
        providerType: 'TEAMS',
      }),
    };
    mockRegistry.getProviderOrThrow.mockReturnValue(mockProvider);

    const session = await service.createSession(
      'apt-004',
      { channelType: ChannelType.GOOGLE_MEET },
      new Date(),
      new Date(Date.now() + 3600000),
      'Atendimento',
      { mcsiLevel: 0, allowAutoFallback: true, fallbackChannels: [ChannelType.TEAMS] },
    );

    expect(session.isFallback).toBe(true);
    expect(session.channelType).toBe(ChannelType.TEAMS);
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      'aura.actg.fallback.triggered.v1',
      expect.objectContaining({ originalChannel: ChannelType.GOOGLE_MEET, selectedChannel: ChannelType.TEAMS }),
      'default',
      expect.any(Object),
    );
  });

  it('deve cancelar sessão e chamar provedor externo', async () => {
    const mockProvider = {
      createSession: jest.fn().mockResolvedValue({
        externalMeetingId: 'ext-cancel',
        joinUrl: 'https://meet.google.com/cancel',
        providerType: 'GOOGLE_MEET',
      }),
      cancelSession: jest.fn().mockResolvedValue(undefined),
    };
    mockRegistry.getProviderOrThrow.mockReturnValue(mockProvider);
    mockRegistry.getProvider.mockReturnValue(mockProvider);

    await service.createSession(
      'apt-005',
      { channelType: ChannelType.GOOGLE_MEET },
      new Date(),
      new Date(Date.now() + 3600000),
      'Atendimento',
      { mcsiLevel: 0, allowAutoFallback: true, fallbackChannels: [] },
    );

    await service.cancelSession('apt-005', 'Reagendamento');

    expect(mockProvider.cancelSession).toHaveBeenCalledWith('ext-cancel', 'Reagendamento');
    expect(mockEventBus.publish).toHaveBeenCalledWith(
      'aura.actg.session.cancelled.v1',
      expect.objectContaining({ appointmentId: 'apt-005' }),
      'default',
      expect.any(Object),
    );
  });
});
