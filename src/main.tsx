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
//                 SodoProvider (documentação e academia) →
//                   AuraContentProvider (conteúdo editável da tela inicial) →
//                     AEGRCProvider (governança, riscos, compliance) →
//                       AECMProvider (gestão documental e arquivo digital) →
//                         ACUProvider (universidade corporativa e LMS) →
//                           AEIPProvider (integrações, barramento e APIs) →
//                             AEAGOProvider (governança de arquitetura e digital twin) →
//                               APRCGProvider (production readiness e go-live) →
//                                 AMACProvider (certificação mestre e baseline final — Prompt 150) →
//                                   AIICProvider (centro de inteligência institucional — Prompt 151) →
//                                     ACOPProvider (orquestração cognitiva multi-agente — Prompt 152) →
//                                       App

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
    </IAMProvider>
  </StrictMode>,
);
