import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { IAMProvider } from './contexts/IAMContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { SecurityProvider } from './contexts/SecurityContext.tsx';
import './index.css';

// Hierarquia de providers:
// IAMProvider (camada base de identidade) →
//   AuthProvider (ponte de compatibilidade retroativa) →
//     SecurityProvider (MCSI) →
//       App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IAMProvider>
      <AuthProvider>
        <SecurityProvider>
          <App />
        </SecurityProvider>
      </AuthProvider>
    </IAMProvider>
  </StrictMode>,
);
