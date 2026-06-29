import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { AppLayout } from './components/layout/AppLayout';
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
import { ProtectedRoute, PublicRoute } from './components/auth/ProtectedRoute';
import { CGI } from './pages/CGI';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública: redireciona para /dashboard se já logado */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Rotas protegidas: exigem autenticação */}
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
          </Route>
          <Route path="/telehealth/:id" element={<Telehealth />} />
        </Route>

        {/* Fallback: redireciona qualquer rota desconhecida para /login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
