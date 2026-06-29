# Módulo 10 — Portal do Profissional, Central do Voluntário e Workspace Clínico
## Especificação Técnica Completa — Instituto Ser Melhor — Projeto Aura

---

## 1. Visão Geral

O **Portal do Profissional** é o ambiente de trabalho e Workspace Clínico Integrado para toda a equipe técnica (psicólogos, psiquiatras, assistentes sociais, pedagogos, advogados, etc.) e voluntários clínicos/sociais do Instituto Ser Melhor. O ambiente unifica ferramentas de agenda, teleconsulta, prontuários eletrônicos autorizados, gestão de casos (PIC), comunicação multidisciplinar, central de assinaturas criptográficas, e controle de horas voluntárias em uma interface web unificada e produtiva.

---

## 2. Perfis de Acesso e Matriz de Permissões

A interface adapta-se dinamicamente conforme as credenciais do usuário autenticado no `AuthContext` e as políticas de controle de acesso do `SecurityContext` (MCSI).

### 2.1 Perfis Técnicos e Administrativos

| Funcionalidade | Médico/Psiq | Psicólogo | Assist. Social | Advogado | Voluntário Leigo | Coordenação |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Ver Agenda de Atendimentos | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Consultar Prontuário Autorizado | ✅ | ✅ | ✅ (Social) | ✅ (Jurídico) | ❌ | ✅ |
| Registrar Evolução Clínica | ✅ | ✅ | ✅ (Parecer) | ✅ (Parecer) | ❌ | ✅ |
| Assinar Receitas/Atestados | ✅ (CRM) | ✅ (CRP)* | ❌ | ❌ | ❌ | ❌ |
| Atualizar Plano de Cuidado (PIC)| ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Registrar Horas de Voluntariado | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Acessar Biblioteca e LMS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Responder Mensagens Multidisc. | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |

*\*Psicólogos assinam atestados e declarações de acompanhamento terapêutico, mas não receitas médicas.*

---

## 3. Arquitetura do Workspace Clínico

```
┌──────────────────────────────────────────────────────────────────┐
│                   AURA PROFESSIONAL WORKSPACE                    │
│  React Component with ProfessionalPortalContext                  │
├─────────┬───────────┬──────────┬──────────┬──────────┬──────────┤
│ Cockpit │ Workspace │ Central  │ Volunt.  │ LMS &    │ Admin    │
│ Panel   │ Clínico   │ Assinat. │ Central  │ Bibliot. │ Requests │
├─────────┴───────────┴──────────┴──────────┴──────────┴──────────┤
│                   Copiloto Clínico IA (Bot)                     │
├──────────────────────────────────────────────────────────────────┤
│                 ProfessionalPortalContext                        │
│   (Agenda, Records, Signatures, Messaging, EAD State)            │
├──────────────────────────────────────────────────────────────────┤
│                  INTEGRAÇÃO COM MÓDULOS DE CORE                  │
│  AuthContext │ SecurityContext (MCSI) │ Teleatendimento │ Agenda │
└──────────────────────────────────────────────────────────────────┘
```

### 3.1 Modelo de Dados (Schema)

#### Prontuário Clínico-Social (`ClinicalRecord`)
```typescript
interface ClinicalRecord {
  id: UUID;
  name: string;
  code: string; // Ex: ISM-0000001092
  birthDate: string;
  cpf: string;
  gender: string;
  sensitivityLevel: SensitivityLevel;
  isProtected: boolean;
  specialCategory?: string;
  evolutions: PatientEvolution[];
  carePlan: PatientCarePlan;
  activePrograms: string[];
}
```

#### Evolução Clínica (`PatientEvolution`)
```typescript
interface PatientEvolution {
  id: UUID;
  date: ISO8601;
  authorName: string;
  authorRole: string;
  content: string;
  diagnosticsCode?: string; // CID-10
  isSigned: boolean;
  signedAt?: ISO8601;
  auditHash: string; // Gerado pelo MCSI no salvamento
}
```

#### Documento Clínico Emitido (`ProfessionalDocument`)
```typescript
interface ProfessionalDocument {
  id: UUID;
  patientId: UUID;
  patientName: string;
  title: string;
  type: 'RECEITA' | 'ATESTADO' | 'DECLARACAO' | 'ENCAMINHAMENTO' | 'LAUDO' | 'RELATORIO';
  content: string;
  issuedAt: ISO8501;
  status: 'AWAITING_SIGNATURE' | 'SIGNED';
  signedAt?: ISO8601;
  hash?: string; // Hash criptográfico da assinatura eletrônica
}
```

---

## 4. Integração de Segurança (MCSI)

O Portal do Profissional adere de forma estrita às diretrizes do MCSI:
1. **Mascaramento Dinâmico**: CPFs e informações pessoais são mascarados sob demanda.
2. **Break Glass (Acesso sob Justificativa)**: Tentativas de visualizar prontuários de nível 3 ou 4 fora do escopo direto de atendimento clínico exigem requisição "Break Glass" com justificativa registrada e auditada.
3. **Auditoria de Evoluções**: Toda evolução salva gera um hash criptográfico irreversível associado ao usuário logado, impedindo adulteração posterior (Append-only).
4. **Assinatura Eletrônica**: Simulação de certificados e-CPF / e-CNPJ digitais qualificados (padrão ICP-Brasil) para assinatura digital de receitas, laudos e atestados.

---

## 5. Central do Voluntário e LMS

### 5.1 Registro de Horas
Voluntários registram data, horas trabalhadas e descrição das atividades diretamente na Central do Voluntário. O fluxo segue para a homologação administrativa (ERP Social).

### 5.2 Treinamentos Obrigatórios (LMS)
Treinamentos sobre sigilo de dados (LGPD + MCSI), protocolos clínicos específicos e normas técnicas institucionais são vinculados à conta do profissional. O portal impede a assinatura de determinados tipos de documentos caso trilhas obrigatórias não tenham 100% de conclusão.

---

## 6. Copiloto Clínico IA (Clinical Assistant)

O Copiloto IA funciona como um assistente administrativo e sumarizador, operando estritamente dentro das regras éticas dos Conselhos Profissionais:
* **Prazos e Pendências**: Avisa sobre evoluções pendentes e documentos que expiram em breve.
* **Sumarização de Histórico**: Extrai rapidamente as principais informações do prontuário (PIC, CID-10 comum, alergias registradas).
* **Estruturação de Notas**: Sugere templates e estruturas para anotações clínicas (ex: método SOAP).
* **Protocolos**: Localiza manuais e resoluções institucionais de atendimento rápido.
* *Nota: O copiloto nunca faz diagnósticos clínicos ou prescreve tratamentos de forma autônoma.*

---

## 7. Plano de Testes

### 7.1 Testes de Integração e Unidade
- [ ] Validar fluxo de assinatura de documentos clínicos individuais.
- [ ] Validar fluxo de assinatura em lote (múltiplos documentos) via PIN code.
- [ ] Verificar geração de hashes de auditoria em novas evoluções.
- [ ] Verificar aplicação de regras de visibilidade baseadas em `SensitivityLevel`.
- [ ] Confirmar contabilidade e envio de horas voluntárias à aprovação.

### 7.2 Testes de Acessibilidade (WCAG 2.1 AA)
- [ ] Teste de contraste de cores (modo claro / escuro / alto contraste).
- [ ] Teste de navegação sequencial via teclado (Tab e Focus rings).
- [ ] Modificadores de tamanho de fonte dinâmica.

---

*Documento Técnico — Instituto Ser Melhor — Projeto Aura — Módulo 10*
*Versão 1.0 — Junho 2026*
