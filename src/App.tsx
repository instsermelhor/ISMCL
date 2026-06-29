import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Patients } from './pages/Patients';
import { PatientRecord } from './pages/PatientRecord';
import { Telehealth } from './pages/Telehealth';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<PatientRecord />} />
        </Route>
        
        <Route path="/telehealth/:id" element={<Telehealth />} />
      </Routes>
    </BrowserRouter>
  );
}
