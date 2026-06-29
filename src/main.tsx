import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { IAMProvider } from './contexts/IAMContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { SecurityProvider } from './contexts/SecurityContext.tsx';
import { BPMSProvider } from './contexts/BPMSContext.tsx';
import { AdaptiveRegistrationProvider } from './contexts/AdaptiveRegistrationContext.tsx';
import { SATAIProvider } from './contexts/SATAIContext.tsx';
import { PiaraveProvider } from './contexts/PiaraveContext.tsx';
import { PlatformHealthProvider } from './contexts/PlatformHealthContext.tsx';
import './index.css';

// Hierarquia de providers:
// IAMProvider (camada base de identidade) →
//   AuthProvider (ponte de compatibilidade retroativa) →
//     SecurityProvider (MCSI) →
//       BPMSProvider (workflows e automação) →
//         AdaptiveRegistrationProvider (ARE) →
//           SATAIProvider (acolhimento/triagem) →
//             PiaraveProvider (programa PIARAVE) →
//               PlatformHealthProvider (observabilidade e auditoria) →
//                 App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IAMProvider>
      <AuthProvider>
        <SecurityProvider>
          <BPMSProvider>
            <AdaptiveRegistrationProvider>
              <SATAIProvider>
                <PiaraveProvider>
                  <PlatformHealthProvider>
                    <App />
                  </PlatformHealthProvider>
                </PiaraveProvider>
              </SATAIProvider>
            </AdaptiveRegistrationProvider>
          </BPMSProvider>
        </SecurityProvider>
      </AuthProvider>
    </IAMProvider>
  </StrictMode>,
);
