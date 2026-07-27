import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { IdentityService } from './services/identity.service';
import { AuthenticationService } from './services/authentication.service';
import { SessionManagementService } from './services/session-management.service';
import { MfaService } from './services/mfa.service';
import { RolePermissionService } from './services/role-permission.service';
import { PolicyEngine } from './policies/policy.engine';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * AuthModule — Módulo de Identidade Fabric e IAM da Plataforma Aura
 *
 * Integra:
 * - IdentityService
 * - AuthenticationService
 * - SessionManagementService
 * - MfaService
 * - RolePermissionService
 * - PolicyEngine (Zero Trust Engine)
 *
 * Referências: P107 (AEIATP), P128 (AECS), P132 (AIFI)
 */
@Module({
  imports: [
    EventBusModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRY', '15m'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    IdentityService,
    AuthenticationService,
    SessionManagementService,
    MfaService,
    RolePermissionService,
    PolicyEngine,
    PrismaService,
  ],
  exports: [
    IdentityService,
    AuthenticationService,
    SessionManagementService,
    MfaService,
    RolePermissionService,
    PolicyEngine,
  ],
})
export class AuthModule {}
