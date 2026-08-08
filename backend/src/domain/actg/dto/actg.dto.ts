import { IsString, IsOptional, IsEnum, IsDateString, IsBoolean, IsEmail, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ChannelType {
  WHATSAPP_BUSINESS = 'WHATSAPP_BUSINESS',
  GOOGLE_MEET = 'GOOGLE_MEET',
  TEAMS = 'TEAMS',
  IN_PERSON = 'IN_PERSON',
  PHONE = 'PHONE',
  HYBRID = 'HYBRID',
  WEBRTC_NATIVE = 'WEBRTC_NATIVE',
}

export enum ProviderType {
  WHATSAPP_BUSINESS = 'WHATSAPP_BUSINESS',
  GOOGLE_MEET = 'GOOGLE_MEET',
  TEAMS = 'TEAMS',
  ZOOM = 'ZOOM',
  WEBEX = 'WEBEX',
  JITSI = 'JITSI',
  WEBRTC_NATIVE = 'WEBRTC_NATIVE',
}

export enum NotificationChannel {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  PORTAL = 'PORTAL',
}

export enum NotificationEventType {
  APPOINTMENT_CREATED = 'APPOINTMENT_CREATED',
  APPOINTMENT_CONFIRMED = 'APPOINTMENT_CONFIRMED',
  REMINDER_7D = 'REMINDER_7D',
  REMINDER_24H = 'REMINDER_24H',
  REMINDER_2H = 'REMINDER_2H',
  REMINDER_30MIN = 'REMINDER_30MIN',
  APPOINTMENT_CANCELLED = 'APPOINTMENT_CANCELLED',
  APPOINTMENT_RESCHEDULED = 'APPOINTMENT_RESCHEDULED',
  SESSION_STARTED = 'SESSION_STARTED',
  SESSION_COMPLETED = 'SESSION_COMPLETED',
  CHANNEL_CHANGED = 'CHANNEL_CHANGED',
}

export class CreateAppointmentChannelDto {
  @ApiProperty({ enum: ChannelType })
  @IsEnum(ChannelType)
  channelType: ChannelType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  organizerEmail?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  attendeeEmails?: string[];
}

export class UpdateExternalMeetingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;
}

export class CancelExternalMeetingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}

export class SendNotificationDto {
  @ApiProperty()
  @IsString()
  appointmentId: string;

  @ApiProperty({ enum: NotificationEventType })
  @IsEnum(NotificationEventType)
  eventType: NotificationEventType;

  @ApiPropertyOptional({ enum: NotificationChannel, isArray: true })
  @IsOptional()
  @IsArray()
  channels?: NotificationChannel[];
}

export class UpdateCommunicationPreferenceDto {
  @ApiPropertyOptional({ enum: NotificationChannel })
  @IsOptional()
  @IsEnum(NotificationChannel)
  preferredChannel?: NotificationChannel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowWhatsApp?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowEmail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowSms?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowPush?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  reminderIntervals?: string[];
}

export class WebhookPayloadDto {
  @ApiProperty()
  payload: Record<string, unknown>;

  @ApiProperty()
  @IsString()
  signature: string;

  @ApiProperty()
  @IsString()
  providerType: string;
}

// ── Admin DTOs ─────────────────────────────────────────────────────────────

export class UpdateCommunicationProviderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  configSchema?: Record<string, unknown>;
}

export class CreateCommunicationAccountDto {
  @ApiProperty()
  @IsString()
  providerId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ default: 'PRODUCTION' })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiProperty({ description: 'HashiCorp Vault / AWS Secrets Manager path' })
  @IsString()
  vaultPath: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webhookSecretHash?: string;
}

export class UpdateCommunicationAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vaultPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateCommunicationTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  eventType: string;

  @ApiProperty({ enum: NotificationChannel })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiPropertyOptional({ default: 'pt_BR' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty()
  @IsString()
  body: string;

  @ApiPropertyOptional({ default: 2 })
  @IsOptional()
  mcsiMaxLevel?: number;
}

export class UpdateCommunicationTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  mcsiMaxLevel?: number;
}

