import {
  Controller,
  Post,
  Get,
  Param,
  Body,
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
import { CorporateUniversityService } from '../services/corporate-university.service';
import { AssessmentCertificationService } from '../services/assessment-certification.service';
import {
  CreateCourseDto,
  EnrollUserDto,
  SubmitAssessmentDto,
  IssueCertificateDto,
} from '../dto/corporate-university.dto';

/**
 * CorporateUniversityController — APIs REST da Universidade Corporativa, LMS, Avaliações e Certificações (ACU-LMS)
 *
 * Expõe endpoints para catálogo de cursos corporativos, matrículas, avaliações automáticas,
 * emissão e verificação pública de certificados digitais com QR Code e assinatura SHA-256.
 *
 * Referências: P146 ACU-LMS Etapa 11, OpenAPI 3.1, LGPD, MCSI
 */
@ApiTags('Corporate University, LMS & Digital Certification (ACU-LMS)')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'university', version: '1' })
export class CorporateUniversityController {
  constructor(
    private readonly lmsService: CorporateUniversityService,
    private readonly certService: AssessmentCertificationService,
  ) {}

  // ── Course Catalog & LMS ───────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Post('courses')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar Curso Corporativo no Catálogo LMS' })
  async createCourse(
    @Body() dto: CreateCourseDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const course = await this.lmsService.createCourse(dto, tenantId);
    return BaseResponseDto.created(course, requestId, `Curso ${course.courseCode} cadastrado.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('courses')
  @ApiOperation({ summary: 'Listar Cursos Corporativos e Trilhas de Aprendizagem' })
  async listCourses(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.lmsService.listCourses(), requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('enrollments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Matricular Usuário em Curso Corporativo' })
  async enrollUser(
    @Body() dto: EnrollUserDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const enrollment = await this.lmsService.enrollUser(dto, tenantId);
    return BaseResponseDto.created(enrollment, requestId, `Matrícula ${enrollment.enrollmentId} realizada.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('enrollments')
  @ApiOperation({ summary: 'Listar Matrículas do Usuário / Histórico Acadêmico' })
  async listEnrollments(
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.lmsService.listEnrollments(req.user.sub), requestId);
  }

  // ── Assessment & Certification ────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('assessments/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submeter Avaliação de Curso (Correção Automática)' })
  async submitAssessment(
    @Body() dto: SubmitAssessmentDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const result = await this.certService.submitAssessment(dto, req.user.sub, tenantId);
    return BaseResponseDto.ok(result, requestId, undefined, `Avaliação finalizada. Nota: ${result.scoreAchieved}/100.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('certificates/issue')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir Certificado Digital Institucional (Exige 100% de conclusão)' })
  async issueCertificate(
    @Body() dto: IssueCertificateDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const cert = await this.certService.issueCertificate(dto, tenantId);
    return BaseResponseDto.created(cert, requestId, `Certificado ${cert.certificateCode} emitido com assinatura digital SHA-256.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('certificates/verify/:code')
  @ApiOperation({ summary: 'Verificar Autenticidade Pública de Certificado Digital (QR Code)' })
  async verifyCertificate(@Param('code') code: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const cert = this.certService.verifyCertificate(code);
    return BaseResponseDto.ok(cert, requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('certificates')
  @ApiOperation({ summary: 'Listar Certificados Digitais do Usuário' })
  async listCertificates(@Req() req: FastifyRequest & { user: AuraJwtPayload }) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.certService.listCertificates(req.user.sub), requestId);
  }
}
