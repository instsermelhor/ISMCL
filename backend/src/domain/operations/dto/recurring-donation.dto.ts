import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  IsEnum,
  Min,
  IsNotEmpty,
} from 'class-validator';

export enum DonationFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUAL = 'ANNUAL',
}

export enum DonationPaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  PIX_RECURRING = 'PIX_RECURRING',
  BOLETO = 'BOLETO',
}

export class CreateRecurringDonationDto {
  @ApiProperty({ description: 'Valor da doação recorrente em BRL (R$)', example: 50.0 })
  @IsNumber({}, { message: 'O valor da doação deve ser numérico.' })
  @Min(5.0, { message: 'O valor mínimo para doação é R$ 5,00.' })
  amount!: number;

  @ApiProperty({
    description: 'Frequência da cobrança recorrente',
    enum: DonationFrequency,
    example: DonationFrequency.MONTHLY,
  })
  @IsEnum(DonationFrequency, { message: 'Frequência de doação inválida.' })
  frequency!: DonationFrequency;

  @ApiProperty({
    description: 'Método de pagamento para a recorrência',
    enum: DonationPaymentMethod,
    example: DonationPaymentMethod.CREDIT_CARD,
  })
  @IsEnum(DonationPaymentMethod, { message: 'Método de pagamento inválido.' })
  paymentMethod!: DonationPaymentMethod;

  @ApiProperty({ description: 'Nome completo do doador', example: 'Maria Santos' })
  @IsString()
  @IsNotEmpty({ message: 'Nome do doador é obrigatório.' })
  donorName!: string;

  @ApiProperty({ description: 'E-mail do doador', example: 'maria.santos@email.com' })
  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  donorEmail!: string;

  @ApiPropertyOptional({ description: 'CPF ou CNPJ do doador', example: '12345678900' })
  @IsOptional()
  @IsString()
  donorDocument?: string;

  @ApiPropertyOptional({ description: 'Telefone/WhatsApp do doador', example: '11999998888' })
  @IsOptional()
  @IsString()
  donorPhone?: string;

  @ApiPropertyOptional({ description: 'ID da campanha de destino', example: 'camp-100' })
  @IsOptional()
  @IsString()
  campaignId?: string;

  @ApiPropertyOptional({
    description: 'Token do cartão fornecido pelo gateway (se método = CREDIT_CARD)',
    example: 'tok_visa_4242',
  })
  @IsOptional()
  @IsString()
  cardToken?: string;
}

export class CancelSubscriptionDto {
  @ApiPropertyOptional({ description: 'Motivo do cancelamento da doação recorrente' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class PaymentWebhookPayloadDto {
  @ApiProperty({ description: 'ID único do evento disparado pelo gateway', example: 'evt_gateway_999' })
  @IsString()
  @IsNotEmpty()
  eventId!: string;

  @ApiProperty({
    description: 'Tipo do evento do gateway',
    example: 'payment.succeeded',
  })
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @ApiPropertyOptional({ description: 'ID da assinatura recorrente no gateway' })
  @IsOptional()
  @IsString()
  subscriptionId?: string;

  @ApiPropertyOptional({ description: 'ID da transação no sistema' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Valor processado' })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'Status do pagamento no gateway' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Assinatura HMAC de segurança do webhook' })
  @IsOptional()
  @IsString()
  signature?: string;
}
