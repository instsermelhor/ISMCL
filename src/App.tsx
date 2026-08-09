import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth
import { IAMLogin } from './pages/IAMLogin';

// Layout
import { AppLayout } from './components/layout/AppLayout';

// Proteção de rotas
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';

// Error Boundaries granulares por rota (Prompt 181 — Fix Bug #4)
import { RouteErrorBoundary } from './components/ErrorBoundary';

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

// Central de Privacidade LGPD — P12
import PrivacyCenter from './pages/PrivacyCenter';

// Componente PWA & Offline-First Status — P13
import OfflineBanner from './components/OfflineBanner';

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

// Prompt 179 — Centro Corporativo de Conhecimento
// FIX BUG CRÍTICO #1 (Prompt 181 — Auditoria Forense): import ausente causava
// ReferenceError: CorporateKnowledgeCenter is not defined → GlobalErrorBoundary → White Screen.
import CorporateKnowledgeCenter from './pages/CorporateKnowledgeCenter';

// Prompt 188 — ACTG
import OmnichannelDashboard from './pages/OmnichannelDashboard';
import ActgAdminPage from './pages/ActgAdminPage';

// ----------------------------------------------------------------
// RouteSuspenseFallback — spinner inline para Suspense boundaries
// ----------------------------------------------------------------
function RouteSuspenseFallback() {
  return (
    <div
      style={{
        minHeight: 320,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        color: '#64748b',
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          width: 18,
          height: 18,
          border: '2px solid #e2e8f0',
          borderTopColor: '#14b8a6',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      Carregando módulo…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <OfflineBanner />
      <Routes>
        {/* Rota pública: Login IAM institucional */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <RouteErrorBoundary>
                <IAMLogin />
              </RouteErrorBoundary>
            </PublicRoute>
          }
        />

        {/* Rota pública: Área Administrativa — Login exclusivo (Prompt 177 ETAPA 1 e 2) */}
        <Route
          path="/admin-login"
          element={
            <PublicRoute>
              <RouteErrorBoundary>
                <AdminLogin />
              </RouteErrorBoundary>
            </PublicRoute>
          }
        />

        {/* Rota pública: Cadastro Inteligente Adaptativo */}
        <Route
          path="/registro"
          element={<RouteErrorBoundary><AdaptiveRegistration /></RouteErrorBoundary>}
        />

        {/* Rota pública: Triagem/Acolhimento Inteligente (SATAI) */}
        <Route
          path="/acolhimento"
          element={<RouteErrorBoundary><SataiWizard /></RouteErrorBoundary>}
        />

        {/* Rota pública: PIARAVE Acolhimento (Biblioteca migrada para área autenticada — Prompt 179) */}
        <Route
          path="/piarave/acolhimento"
          element={<RouteErrorBoundary><PiaraveAcolhimento /></RouteErrorBoundary>}
        />

        {/* Rota pública: Painel de Doações via PIX */}
        <Route
          path="/doe"
          element={<RouteErrorBoundary><DonationPublic /></RouteErrorBoundary>}
        />

        {/* Rota pública: Central de Privacidade LGPD — P12 */}
        <Route
          path="/privacy"
          element={<RouteErrorBoundary><PrivacyCenter /></RouteErrorBoundary>}
        />

        {/* Rotas protegidas — cada rota isolada com RouteErrorBoundary (Prompt 181 Fix #4) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* ── MÓDULOS PRINCIPAIS ──────────────────────────────── */}
            <Route path="dashboard" element={<RouteErrorBoundary><Suspense fallback={<RouteSuspenseFallback />}><Dashboard /></Suspense></RouteErrorBoundary>} />
            <Route path="patients" element={<RouteErrorBoundary><Patients /></RouteErrorBoundary>} />
            <Route path="patients/new" element={<RouteErrorBoundary><TriageForm /></RouteErrorBoundary>} />
            <Route path="patients/:id" element={<RouteErrorBoundary><Suspense fallback={<RouteSuspenseFallback />}><PatientRecord /></Suspense></RouteErrorBoundary>} />
            <Route path="professionals" element={<RouteErrorBoundary><Professionals /></RouteErrorBoundary>} />
            <Route path="professionals/:id" element={<RouteErrorBoundary><Suspense fallback={<RouteSuspenseFallback />}><ProfessionalProfile /></Suspense></RouteErrorBoundary>} />
            <Route path="calendar" element={<RouteErrorBoundary><Calendar /></RouteErrorBoundary>} />
            <Route path="messages" element={<RouteErrorBoundary><Messages /></RouteErrorBoundary>} />
            <Route path="records" element={<RouteErrorBoundary><Suspense fallback={<RouteSuspenseFallback />}><Records /></Suspense></RouteErrorBoundary>} />
            <Route path="settings" element={<RouteErrorBoundary><Settings /></RouteErrorBoundary>} />
            <Route path="financial" element={<RouteErrorBoundary><Suspense fallback={<RouteSuspenseFallback />}><Financial /></Suspense></RouteErrorBoundary>} />
            <Route path="cgi" element={<RouteErrorBoundary><CGI /></RouteErrorBoundary>} />
            <Route path="seguranca" element={<RouteErrorBoundary><Suspense fallback={<RouteSuspenseFallback />}><MCSI /></Suspense></RouteErrorBoundary>} />
            <Route path="portal-beneficiario" element={<RouteErrorBoundary><Suspense fallback={<RouteSuspenseFallback />}><BeneficiaryPortal /></Suspense></RouteErrorBoundary>} />
            <Route path="portal-profissional" element={<RouteErrorBoundary><Suspense fallback={<RouteSuspenseFallback />}><ProfessionalPortal /></Suspense></RouteErrorBoundary>} />

            {/* ── IAM — Central de Identidade ─────────────────────── */}
            <Route path="iam" element={<RouteErrorBoundary><Suspense fallback={<RouteSuspenseFallback />}><IAMCenter /></Suspense></RouteErrorBoundary>} />

            {/* ── BPMS — Central de Processos e Workflows ─────────── */}
            <Route path="processos" element={<RouteErrorBoundary><Suspense fallback={<RouteSuspenseFallback />}><BPMSCenter /></Suspense></RouteErrorBoundary>} />

            {/* ── ARE — Central do Cadastro Inteligente Adaptativo ─── */}
            <Route path="cadastro-adaptativo" element={<RouteErrorBoundary><AdaptiveRegistrationAdmin /></RouteErrorBoundary>} />

            {/* ── SATAI — Central de Triagem e Acolhimento ────────── */}
            <Route path="satai" element={<RouteErrorBoundary><Suspense fallback={<RouteSuspenseFallback />}><SataiAdmin /></Suspense></RouteErrorBoundary>} />

            {/* ── PIARAVE — Painel Administrativo de Casos ────────── */}
            <Route path="piarave" element={<RouteErrorBoundary><PiaraveAdmin /></RouteErrorBoundary>} />

            {/* ── Platform Health & Audit Center ──────────────────── */}
            <Route path="auditoria-plataforma" element={<RouteErrorBoundary><PlatformHealthCenter /></RouteErrorBoundary>} />

            {/* ── SODO — Sistema Oficial de Documentação Operacional ─ */}
            <Route path="sodo" element={<RouteErrorBoundary><SodoPortal /></RouteErrorBoundary>} />
            <Route path="academia" element={<RouteErrorBoundary><SodoAcademy /></RouteErrorBoundary>} />
            <Route path="pops" element={<RouteErrorBoundary><SodoPops /></RouteErrorBoundary>} />
            <Route path="governanca-conhecimento" element={<RouteErrorBoundary><SodoAdmin /></RouteErrorBoundary>} />

            {/* ── AEGRC — Governança, Riscos, Compliance ──────────── */}
            <Route path="aegrc" element={<RouteErrorBoundary><Suspense fallback={<RouteSuspenseFallback />}><AEGRC /></Suspense></RouteErrorBoundary>} />

            {/* ── AECM — Gestão Documental e Arquivo Digital ──────── */}
            <Route path="aecm" element={<RouteErrorBoundary><AECM /></RouteErrorBoundary>} />

            {/* ── ACU — Universidade Corporativa ───────────────────── */}
            <Route path="acu" element={<RouteErrorBoundary><ACU /></RouteErrorBoundary>} />

            {/* ── AEIP — Integrações, Barramento e APIs ───────────── */}
            <Route path="aeip" element={<RouteErrorBoundary><AEIP /></RouteErrorBoundary>} />

            {/* ── AEAGO — Governança Arquitetural e Digital Twin ───── */}
            <Route path="aeago" element={<RouteErrorBoundary><AEAGO /></RouteErrorBoundary>} />

            {/* ── APRCG — Production Readiness & Go-Live ───────────── */}
            <Route path="aprcg" element={<RouteErrorBoundary><APRCG /></RouteErrorBoundary>} />

            {/* ── AMAC (Prompt 150) ────────────────────────────────── */}
            <Route path="amac" element={<RouteErrorBoundary><AMAC /></RouteErrorBoundary>} />

            {/* ── ACTG — Comunicação e Teleatendimento ────────────── */}
            <Route path="omnichannel" element={<RouteErrorBoundary><OmnichannelDashboard /></RouteErrorBoundary>} />
            <Route path="omnichannel-admin" element={<RouteErrorBoundary><ActgAdminPage /></RouteErrorBoundary>} />

            {/* ── AIIC (Prompt 151 — Fase II) ──────────────────────── */}
            <Route path="aiic" element={<RouteErrorBoundary><AIIC /></RouteErrorBoundary>} />

            {/* ── ACOP (Prompt 152 — Fase III) ─────────────────────── */}
            <Route path="acop" element={<RouteErrorBoundary><ACOP /></RouteErrorBoundary>} />

            {/* ── Alias semânticos de redirecionamento por perfil ──── */}
            <Route path="area-familia" element={<RouteErrorBoundary><BeneficiaryPortal /></RouteErrorBoundary>} />
            <Route path="erp-social" element={<RouteErrorBoundary><Dashboard /></RouteErrorBoundary>} />
            <Route path="portal-voluntario" element={<RouteErrorBoundary><Dashboard /></RouteErrorBoundary>} />
            <Route path="dashboard-gerencial" element={<RouteErrorBoundary><Dashboard /></RouteErrorBoundary>} />
            <Route path="dashboard-executivo" element={<RouteErrorBoundary><Dashboard /></RouteErrorBoundary>} />
            <Route path="central-admin" element={<RouteErrorBoundary><IAMCenter /></RouteErrorBoundary>} />
            <Route path="painel-auditoria" element={<RouteErrorBoundary><IAMCenter /></RouteErrorBoundary>} />

            {/* ── Prompt 179 — Centro Corporativo de Conhecimento ──── */}
            {/* FIX BUG CRÍTICO #1 (Prompt 181): componente agora importado corretamente */}
            <Route
              path="conhecimento-corporativo"
              element={
                <RouteErrorBoundary>
                  <Suspense fallback={<RouteSuspenseFallback />}>
                    <CorporateKnowledgeCenter />
                  </Suspense>
                </RouteErrorBoundary>
              }
            />
          </Route>

          {/* Rota de teleconsulta (tela cheia, fora do AppLayout) */}
          <Route path="/telehealth/:id" element={<RouteErrorBoundary><Suspense fallback={<RouteSuspenseFallback />}><Telehealth /></Suspense></RouteErrorBoundary>} />

          {/* Painel Supremo Administrativo (Prompt 177 — Tela Cheia) */}
          <Route path="/painel-supremo" element={<RouteErrorBoundary><Suspense fallback={<RouteSuspenseFallback />}><AdminSupremeDashboard /></Suspense></RouteErrorBoundary>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
