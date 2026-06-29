# IMPLEMENTAÇÃO: BACKEND SCAFFOLD & CONTROLE DE ACESSOS

**Status:** Concluído
**Arquivos Gerados (Scaffold NestJS & SQL):**

Seguindo as diretrizes do ecossistema, os seguintes componentes foram implementados demonstrando a segregação estrita de segurança e o cadastro mestre:

## 1. Banco de Dados: Cadastro Mestre (`/docs/05_DDL_CADASTRO_MESTRE.sql`)
O script SQL foi gerado implementando a entidade "Single Source of Truth" de beneficiários. Foram criadas tabelas descentralizadas para `beneficiaries`, `beneficiary_addresses`, `beneficiary_social_info`, `beneficiary_family`, centralizando as informações via UUID. Foi criada também a estrutura estrita de logs de auditoria (`strict_audit_logs`).

## 2. Microsserviços: Guardiões de Autenticação e Acesso (`/backend/src/auth/guards/portal-access.guard.ts`)
Foi criado um *Guard* no padrão NestJS (`PortalAccessGuard`). Ele intercepta todas as requisições, verifica o token JWT e garante que um usuário do portal administrativo nunca acesse rotas clínicas, e vice-versa. Isso protege contra ataques de elevação de privilégios entre portais.

## 3. Controladores Independentes
- **Portal Administrativo (`/backend/src/admin/controllers/beneficiary-admin.controller.ts`):** 
  Expõe endpoints exclusivos para a equipe de gestão. A rota `GET /admin/beneficiaries/:id` retorna os dados sociais, familiares e administrativos do beneficiário, **propositalmente cegando** o retorno de dados de evolução clínica/prontuários (garantia estrutural de sigilo).

- **Portal Clínico (`/backend/src/clinic/controllers/patient-clinic.controller.ts`):** 
  Expõe a rota `GET /clinic/patients/:id/medical-record`. Implementamos uma verificação **ABAC (Attribute-Based Access Control)**. O sistema consulta se o profissional logado possui um "Caso Ativo" com aquele beneficiário. Se não tiver, o acesso é sumariamente bloqueado, preservando o princípio do sigilo, e uma flag de incidente de segurança é gravada nos logs de auditoria.

### Como a Integração Funciona na Prática:
1. A **recepção (Admin)** cadastra o beneficiário e anota a vulnerabilidade social. Isso grava na tabela `beneficiaries` e `beneficiary_social_info`.
2. O **gestor (Admin)** cria um "Caso" e vincula a um **psicólogo voluntário**.
3. O **psicólogo (Clinic)** loga no portal de voluntários. O frontend clínico consome a rota do `PatientClinicController`.
4. O psicólogo enxerga o mesmo nome, idade e endereço atualizados pela recepção (Cadastro Mestre - SSOT), mas passa a ter acesso de escrita ao `MedicalRecord` (Prontuário).

Todos os passos estruturais (Opção 1 e Opção 2) requeridos foram concluídos. Você pode navegar pelos arquivos criados no diretório de documentação (`/docs`) e no scaffold de backend (`/backend/src/`).
