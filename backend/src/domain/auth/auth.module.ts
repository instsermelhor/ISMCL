import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './controllers/auth.controller';
import { IdentityService } from './services/identity.service';
import { AuthenticationService } from './services/authentication.service';
import { SessionManagementService } from './services/session-management.service';
import { MfaService } from './services/mfa.service';
import { RolePermissionService } from './services/role-permission.service';
import { SuperUserInitService } from './services/super-user-init.service';
import { DelegationService } from './services/delegation.service';
import { ImpersonationService } from './services/impersonation.service';
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
 * - SuperUserInitService (Prompt 189 — Bootstrapping da Identidade Root)
 * - DelegationService (Prompt 189 — Gestão de Acessos e Delegação)
 * - ImpersonationService (Prompt 189 — Impersonação Assistida)
 * - PolicyEngine (Zero Trust Engine)
 *
 * Referências: P107 (AEIATP), P128 (AECS), P132 (AIFI), P189
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
    SuperUserInitService,
    DelegationService,
    ImpersonationService,
    PolicyEngine,
    PrismaService,
  ],
  exports: [
    IdentityService,
    AuthenticationService,
    SessionManagementService,
    MfaService,
    RolePermissionService,
    SuperUserInitService,
    DelegationService,
    ImpersonationService,
    PolicyEngine,
  ],
})
export class AuthModule {}

