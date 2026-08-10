import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function main() {
  console.log('🌱 Iniciando seeding do banco de dados do Projeto Aura...');

  // 1. Roles da Plataforma
  const roles = [
    { name: 'SUPER_USER_UNIVERSAL', description: 'Acesso total universal a todas as organizações e recursos', scope: 'GLOBAL' },
    { name: 'ADMINISTRADOR', description: 'Administrador da organização/tenant', scope: 'TENANT' },
    { name: 'GESTOR', description: 'Gestor de programas e projetos sociais', scope: 'TENANT' },
    { name: 'COORDENADOR', description: 'Coordenador de equipes clínicas/multidisciplinares', scope: 'TENANT' },
    { name: 'FINANCEIRO', description: 'Gestão financeira e prestação de contas', scope: 'TENANT' },
    { name: 'RH', description: 'Gestão de pessoas e voluntariado', scope: 'TENANT' },
    { name: 'COMUNICACAO', description: 'Comunicação institucional e campanhas', scope: 'TENANT' },
    { name: 'PROFISSIONAL', description: 'Profissional de atendimento (Psicologia, Serviço Social, etc)', scope: 'TENANT' },
    { name: 'AUDITOR', description: 'Auditor de governança e conformidade', scope: 'TENANT' },
    { name: 'OPERADOR', description: 'Operador de triagem e recepção', scope: 'TENANT' },
    { name: 'COLABORADOR', description: 'Colaborador geral/voluntário', scope: 'TENANT' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description, scope: role.scope },
      create: role,
    });
  }
  console.log('✅ Roles institucionais carregadas');

  // 2. Super Usuário
  const superUserEmail = 'aurainstitutosermelhor@gmail.com';
  const superUserPasswordHash = await hashPassword('Aura@2026!FirstAccess');

  const superUser = await prisma.user.upsert({
    where: { email: superUserEmail },
    update: {
      passwordHash: superUserPasswordHash,
      role: 'SUPER_USER_UNIVERSAL',
      scope: 'GLOBAL',
      status: 'ACTIVE',
    },
    create: {
      email: superUserEmail,
      name: 'Super Administrador Aura',
      passwordHash: superUserPasswordHash,
      role: 'SUPER_USER_UNIVERSAL',
      scope: 'GLOBAL',
      status: 'ACTIVE',
    },
  });

  console.log(`✅ Super Usuário criado/atualizado: ${superUser.email} (ID: ${superUser.id})`);

  // 3. Provedores de Comunicação Iniciais (ACTG Gateway)
  const defaultProviders = [
    {
      name: 'WhatsApp Business Platform (Meta)',
      type: 'WHATSAPP_BUSINESS',
      isEnabled: true,
      supportsVideo: false,
      supportsAudio: false,
      supportsChat: true,
      supportsNotify: true,
    },
    {
      name: 'Google Meet (Google Workspace)',
      type: 'GOOGLE_MEET',
      isEnabled: true,
      supportsVideo: true,
      supportsAudio: true,
      supportsChat: true,
      supportsNotify: true,
    },
    {
      name: 'Microsoft Teams (Graph API)',
      type: 'TEAMS',
      isEnabled: true,
      supportsVideo: true,
      supportsAudio: true,
      supportsChat: true,
      supportsNotify: true,
    },
  ];

  for (const provider of defaultProviders) {
    const existing = await prisma.communicationProvider.findFirst({
      where: { type: provider.type },
    });
    if (!existing) {
      await prisma.communicationProvider.create({ data: provider });
    }
  }
  console.log('✅ Provedores ACTG Gateway inicializados');

  console.log('🎉 Seeding concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
