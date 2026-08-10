import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { SocialProgramsService } from '../services/social-programs.service';

/**
 * SocialProgramsController — API REST para Programas Sociais (ASPS)
 *
 * Endpoints:
 *   GET    /api/v1/programs         → Todos os programas (autenticado)
 *   GET    /api/v1/programs/public  → Apenas públicos (aberto)
 *   POST   /api/v1/programs         → Criar novo programa
 *   PATCH  /api/v1/programs/:id     → Atualizar programa
 *   DELETE /api/v1/programs/:id     → Remover programa
 *   PATCH  /api/v1/programs/:id/toggle-public → Alternar visibilidade
 */
@Controller('api/v1/programs')
export class SocialProgramsController {
  constructor(private readonly service: SocialProgramsService) {}

  /** Listagem pública — sem autenticação */
  @Get('public')
  findPublic() {
    return this.service.findPublic();
  }

  /** Listagem completa (admin) */
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /** Detalhes de um programa */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  /** Criação de novo programa */
  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  /** Atualização parcial de um programa */
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  /** Alternância de visibilidade pública */
  @Patch(':id/toggle-public')
  togglePublic(@Param('id') id: string) {
    return this.service.togglePublic(id);
  }

  /** Remoção de um programa */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
