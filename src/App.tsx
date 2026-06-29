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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública: redireciona se já autenticado */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <IAMLogin />
            </PublicRoute>
          }
        />

        {/* Rota pública: Cadastro Inteligente Adaptativo */}
        <Route path="/registro" element={<AdaptiveRegistration />} />

        {/* Rota pública: Triagem/Acolhimento Inteligente (SATAI) */}
        <Route path="/acolhimento" element={<SataiWizard />} />

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

            {/* Alias semânticos de redirecionamento por perfil */}
            <Route path="area-familia" element={<BeneficiaryPortal />} />
            <Route path="erp-social" element={<Dashboard />} />
            <Route path="portal-voluntario" element={<Dashboard />} />
            <Route path="dashboard-gerencial" element={<Dashboard />} />
            <Route path="dashboard-executivo" element={<Dashboard />} />
            <Route path="central-admin" element={<IAMCenter />} />
            <Route path="painel-auditoria" element={<IAMCenter />} />
          </Route>

          {/* Rota de teleconsulta (tela cheia, fora do AppLayout) */}
          <Route path="/telehealth/:id" element={<Telehealth />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
