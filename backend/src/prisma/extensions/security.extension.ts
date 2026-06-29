import { Prisma, PrismaClient } from '@prisma/client';
import { securityContextStorage } from './security-context';
import { VaultService } from '../../services/vault.service';

const rawDb = new PrismaClient();
const vaultService = new VaultService();

/**
 * Prisma Client Extension para interceptação e aplicação de segurança (MCSI)
 */
export const securityExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    name: 'security-extension',
    query: {
      beneficiary: {
        async findMany({ args, query }) {
          const context = securityContextStorage.getStore();
          if (!context) return query(args);

          // 1. Aplica Row-Level Security (RLS) no WHERE
          args.where = applyRowLevelSecurity(args.where || {}, context);

          // 2. Executa a query no banco de dados
          const results = await query(args);

          // 3. Processa e mascara os registros resultantes
          return Promise.all(results.map(b => processBeneficiaryRecord(b, context)));
        },
        async findFirst({ args, query }) {
          const context = securityContextStorage.getStore();
          if (!context) return query(args);

          args.where = applyRowLevelSecurity(args.where || {}, context);
          const result = await query(args);
          if (!result) return null;

          return processBeneficiaryRecord(result, context);
        },
        async findUnique({ args, query }) {
          const context = securityContextStorage.getStore();
          if (!context) return query(args);

          const result = await query(args);
          if (!result) return null;

          // Valida acesso individual do registro
          const isAllowed = await verifyRecordAccess(result.id, context);
          if (!isAllowed) {
            return null; // Oculta o registro (Pesquisa Segura)
          }

          return processBeneficiaryRecord(result, context);
        }
      }
    }
  });
});

/**
 * Altera a cláusula where da query injetando filtros de RLS com base no nível de permissão
 */
function applyRowLevelSecurity(whereClause: any, context: any): any {
  // Se for auditor/DPO/admin nível 4, permite a pesquisa (mas os logs serão gravados no middleware)
  if (context.sensitivityLevel >= 4) {
    return whereClause;
  }

  const breakGlassIds = Object.keys(context.activeBreakGlassSessions || {});

  const rlsFilter = {
    OR: [
      // Nível 0: Beneficiários comuns (sem ProtectedProfile)
      {
        protectedProfile: null
      },
      // Nível 1 & Nível 2: Acessíveis caso o usuário tenha privilégio compatível
      {
        protectedProfile: {
          sensitivityLevel: { in: [1, 2].filter(lvl => lvl <= context.sensitivityLevel) }
        }
      },
      // Nível 3: Acessível apenas se o usuário for profissional vinculado a um caso ativo do paciente
      {
        protectedProfile: {
          sensitivityLevel: 3,
          beneficiary: {
            cases: {
              some: {
                status: 'ACTIVE',
                assignedProfessionals: {
                  some: { professionalId: context.userId }
                }
              }
            }
          }
        }
      },
      // Qualquer nível caso haja uma sessão excepcional de Break-Glass ativa
      {
        id: { in: breakGlassIds }
      }
    ]
  };

  return {
    AND: [
      whereClause || {},
      rlsFilter
    ]
  };
}

/**
 * Valida de forma estrita o acesso a um ID específico de beneficiário
 */
async function verifyRecordAccess(beneficiaryId: string, context: any): Promise<boolean> {
  // Diretoria/DPO tem acesso a tudo sob logs
  if (context.sensitivityLevel >= 4) return true;

  // Verifica se há sessão de Break-Glass ativa e dentro da validade
  if (context.activeBreakGlassSessions && context.activeBreakGlassSessions[beneficiaryId]) {
    const session = context.activeBreakGlassSessions[beneficiaryId];
    if (new Date() < new Date(session.expiresAt)) {
      return true;
    }
  }

  // Consulta o banco cru (sem extensão) para verificar o nível e alocações do caso
  const profile = await rawDb.protectedProfile.findUnique({
    where: { beneficiaryId },
    include: {
      beneficiary: {
        include: {
          cases: {
            where: { status: 'ACTIVE' },
            include: {
              assignedProfessionals: {
                where: { professionalId: context.userId }
              }
            }
          }
        }
      }
    }
  });

  // Se não tem ProtectedProfile, é Nível 0 (Livre)
  if (!profile) return true;

  // Valida níveis 1 e 2
  if (profile.sensitivityLevel <= context.sensitivityLevel) {
    if (profile.sensitivityLevel < 3) return true;
  }

  // Nível 3 exige vínculo ativo no caso
  if (profile.sensitivityLevel === 3) {
    const hasActiveCaseBond = profile.beneficiary.cases.some(
      (c: any) => c.assignedProfessionals.length > 0
    );
    if (hasActiveCaseBond) return true;
  }

  // Nível 4 bloqueado para todos abaixo do nível 4
  return false;
}

/**
 * Descriptografa e formata/mascara o registro do beneficiário de acordo com a autorização
 */
async function processBeneficiaryRecord(beneficiary: any, context: any): Promise<any> {
  if (!beneficiary) return beneficiary;

  const profile = await rawDb.protectedProfile.findUnique({
    where: { beneficiaryId: beneficiary.id },
    include: { secureVault: true }
  });

  if (!profile) {
    return beneficiary; // Nível 0
  }

  const isFullyAuthorized = await verifyRecordAccess(beneficiary.id, context);

  if (isFullyAuthorized && profile.secureVault) {
    // Descriptografa os dados confidenciais do SecureVault e sobrepõe na ficha do beneficiário
    const decryptedVault = await vaultService.decryptVault(profile.secureVault);
    return {
      ...beneficiary,
      documentCpf: decryptedVault.cpf || beneficiary.documentCpf,
      phone: decryptedVault.phone || null,
      address: decryptedVault.address || null,
      familyDetails: decryptedVault.familyDetails || null,
      workplace: decryptedVault.workplace || null,
      alternateAddresses: decryptedVault.alternateAddresses || null,
      courtDocuments: decryptedVault.courtDocuments || null,
      sensitivityLevel: profile.sensitivityLevel,
      internalCode: profile.internalCode
    };
  } else {
    // Mascara os dados dinamicamente on-the-fly
    return {
      ...beneficiary,
      documentCpf: beneficiary.documentCpf ? maskCpf(beneficiary.documentCpf) : '***.***.***-**',
      phone: '(**) *****-****',
      address: '[DADOS OCULTOS POR PRIVACIDADE - MCSI]',
      familyDetails: null,
      workplace: null,
      alternateAddresses: null,
      courtDocuments: null,
      sensitivityLevel: profile.sensitivityLevel,
      internalCode: profile.internalCode
    };
  }
}

function maskCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length === 11) {
    return `***.***.${clean.substring(6, 9)}-**`;
  }
  return '***.***.***-**';
}
