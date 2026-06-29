import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { PatientRecord } from './pages/PatientRecord';
import { TriageForm } from './pages/TriageForm';
import { Telehealth } from './pages/Telehealth';
import { Settings } from './pages/Settings';
import { Calendar } from './pages/Calendar';
import { Messages } from './pages/Messages';
import { Records } from './pages/Records';
import { Financial } from './pages/Financial';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/new" element={<TriageForm />} />
          <Route path="patients/:id" element={<PatientRecord />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="messages" element={<Messages />} />
          <Route path="records" element={<Records />} />
          <Route path="settings" element={<Settings />} />
          <Route path="financial" element={<Financial />} />
        </Route>
        
        <Route path="/telehealth/:id" element={<Telehealth />} />
      </Routes>
    </BrowserRouter>
  );
}
