import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth
import { IAMLogin } from './pages/IAMLogin';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Proteção de rotas
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';

// Módulos principais
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { PatientRecord } from './pages/PatientRecord';
import { TriageForm } from './pages/TriageForm';
import { Professionals } from './pages/Professionals';
import { ProfessionalProfile } from './pages/ProfessionalProfile';
import { Telehealth } from './pages/Telehealth';
import { Settings } from './pages/Settings';
import { Calendar } from './pages/Calendar';
import { Messages } from './pages/Messages';
import { Records } from './pages/Records';
import { Financial } from './pages/Financial';
import { CGI } from './pages/CGI';
import { MCSI } from './pages/MCSI';
import { BeneficiaryPortal } from './pages/BeneficiaryPortal';
import { ProfessionalPortal } from './pages/ProfessionalPortal';

// IAM
import { IAMCenter } from './pages/IAMCenter';

// BPMS
import { BPMSCenter } from './pages/BPMSCenter';

// ARE — Cadastro Inteligente Adaptativo
import AdaptiveRegistration from './pages/AdaptiveRegistration';
import AdaptiveRegistrationAdmin from './pages/AdaptiveRegistrationAdmin';

// SATAI — Sistema Inteligente de Acolhimento e Triagem
import SataiWizard from './pages/SataiWizard';
import SataiAdmin from './pages/SataiAdmin';

// PIARAVE — Programa de Acolhimento Violência Relacional
import PiaraveAcolhimento from './pages/PiaraveAcolhimento';
import PiaraveBiblioteca from './pages/PiaraveBiblioteca';
import PiaraveAdmin from './pages/PiaraveAdmin';

// Platform Health & Audit Center
import PlatformHealthCenter from './pages/PlatformHealthCenter';

// SODO — Sistema Oficial de Documentação Operacional e Academia
import SodoPortal from './pages/SodoPortal';
import SodoAcademy from './pages/SodoAcademy';
import SodoPops from './pages/SodoPops';
import SodoAdmin from './pages/SodoAdmin';

// Painel Público de Doações via PIX
import DonationPublic from './pages/DonationPublic';

// AEGRC — Governança, Riscos, Compliance e Gestão Estratégica
import { AEGRC } from './pages/AEGRC';

// AECM-KG — Gestão Documental, Arquivo Digital e Governança
import { AECM } from './pages/AECM';

// ACU-LMS — Universidade Corporativa e Gestão de Competências
import { ACU } from './pages/ACU';

// AEIP — Integrações, Interoperabilidade e APIs
import { AEIP } from './pages/AEIP';

// AEAGO — Arquitetura Corporativa e Digital Twin
import { AEAGO } from './pages/AEAGO';

// APRCG — Production Readiness, Certificação Corporativa e Go-Live
import { APRCG } from './pages/APRCG';

// AMAC — Certificação Mestre e Baseline Final (Prompt 150)
import { AMAC } from './pages/AMAC';

// AIIC — Centro de Inteligência Institucional (Prompt 151 — Fase II)
import { AIIC } from './pages/AIIC';

// ACOP — Orquestração Cognitiva Multi-Agente (Prompt 152 — Fase III)
import { ACOP } from './pages/ACOP';

// Prompt 177 — Área Restrita e Painel Supremo Administrativo
import { AdminLogin } from './pages/AdminLogin';
import { AdminSupremeDashboard } from './pages/AdminSupremeDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública: Login IAM institucional */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <IAMLogin />
            </PublicRoute>
          }
        />

        {/* Rota pública: Área Administrativa — Login exclusivo (Prompt 177 ETAPA 1 e 2) */}
        <Route
          path="/admin-login"
          element={
            <PublicRoute>
              <AdminLogin />
            </PublicRoute>
          }
        />

        {/* Rota pública: Cadastro Inteligente Adaptativo */}
        <Route path="/registro" element={<AdaptiveRegistration />} />

        {/* Rota pública: Triagem/Acolhimento Inteligente (SATAI) */}
        <Route path="/acolhimento" element={<SataiWizard />} />

        {/* Rota pública: PIARAVE Acolhimento (Biblioteca migrada para área autenticada — Prompt 179) */}
        <Route path="/piarave/acolhimento" element={<PiaraveAcolhimento />} />

        {/* Rota pública: Painel de Doações via PIX */}
        <Route path="/doe" element={<DonationPublic />} />

        {/* Rotas protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/new" element={<TriageForm />} />
            <Route path="patients/:id" element={<PatientRecord />} />
            <Route path="professionals" element={<Professionals />} />
            <Route path="professionals/:id" element={<ProfessionalProfile />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="messages" element={<Messages />} />
            <Route path="records" element={<Records />} />
            <Route path="settings" element={<Settings />} />
            <Route path="financial" element={<Financial />} />
            <Route path="cgi" element={<CGI />} />
            <Route path="seguranca" element={<MCSI />} />
            <Route path="portal-beneficiario" element={<BeneficiaryPortal />} />
            <Route path="portal-profissional" element={<ProfessionalPortal />} />

            {/* IAM — Central de Identidade */}
            <Route path="iam" element={<IAMCenter />} />

            {/* BPMS — Central de Processos e Workflows */}
            <Route path="processos" element={<BPMSCenter />} />

            {/* ARE — Central do Cadastro Inteligente Adaptativo */}
            <Route path="cadastro-adaptativo" element={<AdaptiveRegistrationAdmin />} />

            {/* SATAI — Central de Triagem e Acolhimento */}
            <Route path="satai" element={<SataiAdmin />} />

            {/* PIARAVE — Painel Administrativo de Casos */}
            <Route path="piarave" element={<PiaraveAdmin />} />

            {/* Platform Health & Audit Center */}
            <Route path="auditoria-plataforma" element={<PlatformHealthCenter />} />

            {/* SODO — Sistema Oficial de Documentação Operacional */}
            <Route path="sodo" element={<SodoPortal />} />
            <Route path="academia" element={<SodoAcademy />} />
            <Route path="pops" element={<SodoPops />} />
            <Route path="governanca-conhecimento" element={<SodoAdmin />} />

            {/* AEGRC — Governança, Riscos, Compliance e Planejamento Estratégico */}
            <Route path="aegrc" element={<AEGRC />} />

            {/* AECM — Gestão Documental e Arquivo Digital */}
            <Route path="aecm" element={<AECM />} />

            {/* ACU — Universidade Corporativa e Gestão de Competências */}
            <Route path="acu" element={<ACU />} />

            {/* AEIP — Integrações, Barramento e APIs */}
            <Route path="aeip" element={<AEIP />} />

            {/* AEAGO — Governança Arquitetural e Digital Twin */}
            <Route path="aeago" element={<AEAGO />} />

            {/* APRCG — Production Readiness & Go-Live */}
            <Route path="aprcg" element={<APRCG />} />

            {/* AMAC — Certificação Mestre e Baseline Final (Prompt 150) */}
            <Route path="amac" element={<AMAC />} />

            {/* AIIC — Centro de Inteligência Institucional (Prompt 151 — Fase II) */}
            <Route path="aiic" element={<AIIC />} />

            {/* ACOP — Orquestração Cognitiva Multi-Agente (Prompt 152 — Fase III) */}
            <Route path="acop" element={<ACOP />} />

            {/* Alias semânticos de redirecionamento por perfil */}
            <Route path="area-familia" element={<BeneficiaryPortal />} />
            <Route path="erp-social" element={<Dashboard />} />
            <Route path="portal-voluntario" element={<Dashboard />} />
            <Route path="dashboard-gerencial" element={<Dashboard />} />
            <Route path="dashboard-executivo" element={<Dashboard />} />
            <Route path="central-admin" element={<IAMCenter />} />
            <Route path="painel-auditoria" element={<IAMCenter />} />

            {/* Prompt 179 — Centro Corporativo de Conhecimento (Rota Protegida) */}
            <Route path="conhecimento-corporativo" element={<CorporateKnowledgeCenter />} />
          </Route>

          {/* Rota de teleconsulta (tela cheia, fora do AppLayout) */}
          <Route path="/telehealth/:id" element={<Telehealth />} />

          {/* Painel Supremo Administrativo (Prompt 177 - Tela Cheia) */}
          <Route path="/painel-supremo" element={<AdminSupremeDashboard />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
