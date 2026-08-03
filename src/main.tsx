import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { GlobalErrorBoundary } from './components/ErrorBoundary.tsx';
import { IAMProvider } from './contexts/IAMContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { SecurityProvider } from './contexts/SecurityContext.tsx';
import { BPMSProvider } from './contexts/BPMSContext.tsx';
import { AdaptiveRegistrationProvider } from './contexts/AdaptiveRegistrationContext.tsx';
import { SATAIProvider } from './contexts/SATAIContext.tsx';
import { PiaraveProvider } from './contexts/PiaraveContext.tsx';
import { PlatformHealthProvider } from './contexts/PlatformHealthContext.tsx';
import { SodoProvider } from './contexts/SodoContext.tsx';
import { AuraContentProvider } from './contexts/AuraContentContext.tsx';
import { AEGRCProvider } from './contexts/AEGRCContext.tsx';
import { AECMProvider } from './contexts/AECMContext.tsx';
import { ACUProvider } from './contexts/ACUContext.tsx';
import { AEIPProvider } from './contexts/AEIPContext.tsx';
import { AEAGOProvider } from './contexts/AEAGOContext.tsx';
import { APRCGProvider } from './contexts/APRCGContext.tsx';
import { AMACProvider } from './contexts/AMACContext.tsx';
import { AIICProvider } from './contexts/AIICContext.tsx';
import { ACOPProvider } from './contexts/ACOPContext.tsx';
import { KnowledgeProvider } from './contexts/KnowledgeContext.tsx';
import './index.css';

// Hierarquia de providers corrigida (Prompt 180 — Hotfix White Screen):
// GlobalErrorBoundary (proteção de exceções React) →
//   IAMProvider (camada base de identidade) →
//     KnowledgeProvider (Centro Corporativo de Conhecimento — consome IAM) →
//       AuthProvider (ponte de compatibilidade retroativa) →
//         SecurityProvider (MCSI) →
//           ... → App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <IAMProvider>
        <KnowledgeProvider>
          <AuthProvider>
            <SecurityProvider>
              <BPMSProvider>
                <AdaptiveRegistrationProvider>
                  <SATAIProvider>
                    <PiaraveProvider>
                      <PlatformHealthProvider>
                        <SodoProvider>
                          <AuraContentProvider>
                            <AEGRCProvider>
                              <AECMProvider>
                                <ACUProvider>
                                  <AEIPProvider>
                                    <AEAGOProvider>
                                      <APRCGProvider>
                                        <AMACProvider>
                                          <AIICProvider>
                                            <ACOPProvider>
                                              <App />
                                            </ACOPProvider>
                                          </AIICProvider>
                                        </AMACProvider>
                                      </APRCGProvider>
                                    </AEAGOProvider>
                                  </AEIPProvider>
                                </ACUProvider>
                              </AECMProvider>
                            </AEGRCProvider>
                          </AuraContentProvider>
                        </SodoProvider>
                      </PlatformHealthProvider>
                    </PiaraveProvider>
                  </SATAIProvider>
                </AdaptiveRegistrationProvider>
              </BPMSProvider>
            </SecurityProvider>
          </AuthProvider>
        </KnowledgeProvider>
      </IAMProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
);
