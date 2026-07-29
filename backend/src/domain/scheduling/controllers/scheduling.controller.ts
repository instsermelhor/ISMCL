import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard, AuraJwtPayload } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { SchedulingService } from '../services/scheduling.service';
import { TelehealthService } from '../services/telehealth.service';
import { NotificationService } from '../services/notification.service';
import { AttendanceControlService } from '../services/attendance-control.service';
import { SmartQueueEngine } from '../engines/smart-queue.engine';
import {
  CreateAppointmentDto,
  CancelAppointmentDto,
  RescheduleAppointmentDto,
  RecordAttendanceDto,
  NotificationChannel,
  QueuePriority,
} from '../dto/scheduling.dto';

/**
 * SchedulingController — APIs REST do Módulo de Agendamento, Teleconsulta e Orquestração
 *
 * Expõe endpoints para agendamento, confirmação, cancelamento, remarcação,
 * teleconsulta com sala virtual, fila inteligente, notificações e controle de presença.
 *
 * Referências: P110 (AEWBPM), P137 AISTCOP Etapas 11
 */
@ApiTags('Scheduling & Telehealth')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'scheduling', version: '1' })
export class SchedulingController {
  constructor(
    private readonly schedulingService: SchedulingService,
    private readonly telehealthService: TelehealthService,
    private readonly notificationService: NotificationService,
    private readonly attendanceService: AttendanceControlService,
    private readonly queueEngine: SmartQueueEngine,
  ) {}

  // ── Agendamento ─────────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('appointments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo Agendamento Assistencial (AGD-YYYY-XXXXX)' })
  async createAppointment(
    @Body() dto: CreateAppointmentDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const apt = await this.schedulingService.create(dto, tenantId);

    // Notificação automática após criação
    await this.notificationService.send(
      dto.beneficiaryId,
      'APPOINTMENT_CREATED',
      [NotificationChannel.WHATSAPP, NotificationChannel.EMAIL],
      `📅 Seu atendimento Aura foi agendado para ${new Date(dto.scheduledAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}.`,
      tenantId,
    );

    return BaseResponseDto.created(apt, requestId, 'Agendamento criado com sucesso.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Patch('appointments/:id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar Agendamento' })
  async confirmAppointment(@Param('id') id: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const apt = await this.schedulingService.confirm(id, tenantId);
    return BaseResponseDto.ok(apt, requestId, undefined, 'Agendamento confirmado.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('appointments/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar Agendamento com motivo' })
  async cancelAppointment(@Body() dto: CancelAppointmentDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const apt = await this.schedulingService.cancel(dto, tenantId);
    return BaseResponseDto.ok(apt, requestId, undefined, 'Agendamento cancelado.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('appointments/reschedule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remarcar Agendamento para nova data/hora' })
  async rescheduleAppointment(@Body() dto: RescheduleAppointmentDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const apt = await this.schedulingService.reschedule(dto, tenantId);
    return BaseResponseDto.ok(apt, requestId, undefined, 'Agendamento remarcado com sucesso.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('appointments/beneficiary/:id')
  @ApiOperation({ summary: 'Listar Agendamentos do Beneficiário' })
  async getByBeneficiary(@Param('id') beneficiaryId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.schedulingService.findByBeneficiary(beneficiaryId), requestId);
  }

  // ── Teleconsulta ────────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('telehealth/rooms')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar Sala Virtual Segura para Teleconsulta' })
  async createRoom(@Body() body: { appointmentId: string; maxDurationMinutes?: number }, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const apt = this.schedulingService.findOrThrow(body.appointmentId);

    const room = await this.telehealthService.createRoom(
      body.appointmentId,
      apt.beneficiaryId,
      apt.professionalId,
      body.maxDurationMinutes ?? apt.durationMinutes,
      'WEBRTC_NATIVE',
      tenantId,
    );

    // Notifica o beneficiário com o link de acesso
    await this.notificationService.send(
      apt.beneficiaryId,
      'ROOM_READY',
      [NotificationChannel.WHATSAPP, NotificationChannel.EMAIL],
      `🎥 Sua sala de teleconsulta está pronta! Acesse: ${room.joinUrl}`,
      tenantId,
    );

    return BaseResponseDto.created(room, requestId, 'Sala virtual criada e link enviado ao beneficiário.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL)
  @Patch('telehealth/rooms/:id/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encerrar Sala Virtual após Teleconsulta' })
  async closeRoom(@Param('id') roomId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const room = await this.telehealthService.closeRoom(roomId, tenantId);
    return BaseResponseDto.ok(room, requestId, undefined, 'Sala virtual encerrada.');
  }

  // ── Fila Inteligente ────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('queue/:specialty')
  @ApiOperation({ summary: 'Consultar Fila Inteligente por Especialidade' })
  async getQueue(@Param('specialty') specialty: string, @Query('limit') limit?: string, @Req() req?: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string })?.requestId ?? 'unknown';
    return BaseResponseDto.ok(this.queueEngine.peek(specialty, limit ? +limit : 10), requestId);
  }

  // ── Controle de Presença ───────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('attendance/checkin/:appointmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar Check-in do Beneficiário' })
  async checkIn(@Param('appointmentId') appointmentId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const record = await this.attendanceService.checkIn(appointmentId, tenantId);
    return BaseResponseDto.ok(record, requestId, undefined, 'Check-in realizado com sucesso.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('attendance/record')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar Encerramento e Resultado do Atendimento' })
  async recordAttendance(@Body() dto: RecordAttendanceDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const record = await this.attendanceService.recordAttendance(dto, tenantId);
    return BaseResponseDto.ok(record, requestId, undefined, 'Atendimento registrado com sucesso.');
  }
}
