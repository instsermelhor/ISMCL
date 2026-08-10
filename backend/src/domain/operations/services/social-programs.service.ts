import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * SocialProgramsService — Gerencia os Programas Sociais do Instituto Ser Melhor
 *
 * Módulo: ASPS (Aura Social Programs Service)
 * Referência: Integração CGI-Gestão de Projetos ↔ /programas (Página Pública)
 */
@Injectable()
export class SocialProgramsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.socialProgram.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPublic() {
    return this.prisma.socialProgram.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const program = await this.prisma.socialProgram.findUnique({ where: { id } });
    if (!program) throw new NotFoundException(`Programa social não encontrado: ${id}`);
    return program;
  }

  async create(data: {
    title: string;
    description: string;
    fullDescription?: string;
    category?: string;
    status?: string;
    isPublic?: boolean;
    targetAudience?: string;
    objectives?: string[];
    fundingSources?: string[];
    results?: string;
    coordinator?: string;
    team?: string[];
    tags?: string[];
    bannerUrl?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
    raised?: number;
    targetBeneficiaries?: number;
    activeBeneficiaries?: number;
    progress?: number;
    centroCusto?: string;
    notas?: string;
  }) {
    return this.prisma.socialProgram.create({ data: data as any });
  }

  async update(id: string, data: Partial<{
    title: string;
    description: string;
    fullDescription: string;
    category: string;
    status: string;
    isPublic: boolean;
    targetAudience: string;
    objectives: string[];
    fundingSources: string[];
    results: string;
    coordinator: string;
    team: string[];
    tags: string[];
    bannerUrl: string;
    startDate: string;
    endDate: string;
    budget: number;
    raised: number;
    targetBeneficiaries: number;
    activeBeneficiaries: number;
    progress: number;
    centroCusto: string;
    notas: string;
  }>) {
    await this.findById(id);
    return this.prisma.socialProgram.update({ where: { id }, data: data as any });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.socialProgram.delete({ where: { id } });
    return { message: 'Programa social removido com sucesso.' };
  }

  async togglePublic(id: string) {
    const program = await this.findById(id);
    return this.prisma.socialProgram.update({
      where: { id },
      data: { isPublic: !program.isPublic },
    });
  }
}
