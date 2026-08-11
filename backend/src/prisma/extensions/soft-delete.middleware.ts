import { Prisma } from '@prisma/client';

/**
 * Modelos Prisma que possuem suporte ao campo `deletedAt` (Soft Delete LGPD Art.18).
 */
const SOFT_DELETE_MODELS = new Set<string>([
  'User',
  'Beneficiary',
  'Professional',
  'Case',
  'Appointment',
  'ClinicalEvolution',
  'Diagnosis',
  'ClinicalDocument',
  'IndividualCarePlan',
  'Transaction',
]);

/**
 * Prisma Middleware para interceptar exclusões e leituras nos modelos que possuem soft delete.
 *
 * Transforma:
 * - `delete` → `update({ data: { deletedAt: new Date() } })`
 * - `deleteMany` → `updateMany({ data: { deletedAt: new Date() } })`
 * - `findFirst` / `findMany` → injeta `{ deletedAt: null }` no where (a menos que `includeDeleted: true` seja passado)
 *
 * Referência: ANO-008, LGPD Art.18, Sprint R4
 */
export const softDeleteMiddleware: Prisma.Middleware = async (params, next) => {
  if (!params.model || !SOFT_DELETE_MODELS.has(params.model)) {
    return next(params);
  }

  // 1. Converte `delete` em soft delete `update`
  if (params.action === 'delete') {
    params.action = 'update';
    params.args.data = { deletedAt: new Date() };
  }

  // 2. Converte `deleteMany` em soft delete `updateMany`
  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    if (params.args.data) {
      params.args.data.deletedAt = new Date();
    } else {
      params.args.data = { deletedAt: new Date() };
    }
  }

  // 3. Filtra registros marcados como excluídos em buscas
  if (params.action === 'findUnique' || params.action === 'findFirst') {
    params.action = 'findFirst';
    params.args.where = {
      ...params.args.where,
      deletedAt: null,
    };
  }

  if (params.action === 'findMany') {
    if (!params.args) {
      params.args = { where: { deletedAt: null } };
    } else if (!params.args.where) {
      params.args.where = { deletedAt: null };
    } else if (params.args.where.deletedAt === undefined) {
      params.args.where.deletedAt = null;
    }
  }

  return next(params);
};
