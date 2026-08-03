// ============================================================
// DonationPublic.tsx — Painel Público de Doações via PIX
// Instituto Ser Melhor | Plataforma Aura
// Rota pública: /doe (sem necessidade de login)
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { platformProjects, INSTITUTIONAL_PIX, type PlatformProject, type PixDonation } from '../data/financial-mock';
import { generatePixPayload, generateQRDataUrl, requestCentralizedPixCharge } from '../services/pixService';

// ─── Helpers ───────────────────────────────────────────────
function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function loadProjects(): PlatformProject[] {
  try {
    const raw = localStorage.getItem('financial_platform_projects');
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return platformProjects;
}

function saveDonation(d: PixDonation) {
  try {
    const raw = localStorage.getItem('financial_pix_donations');
    const list: PixDonation[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem('financial_pix_donations', JSON.stringify([d, ...list]));
  } catch { /* noop */ }
}

const CATEGORY_LABEL: Record<string, string> = {
  SAUDE_MENTAL: '🧠 Saúde Mental',
  PROTECAO: '🛡️ Proteção',
  IDOSO: '👴 Idoso',
  INFANCIA: '👶 Infância',
  INCLUSAO: '🤝 Inclusão',
  TECNOLOGIA: '🤖 Tecnologia',
  CAPACITACAO: '🎓 Capacitação',
};

const QUICK_AMOUNTS = [30, 50, 100, 200];

// ─── QR Modal ────────────────────────────────────────────────
interface QRModalProps {
  project: PlatformProject;
  onClose: () => void;
}
function QRModal({ project, onClose }: QRModalProps) {
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [step, setStep] = useState<'form' | 'qr'>('form');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [payload, setPayload] = useState('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const effectiveAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  async function handleGenerate() {
    if (effectiveAmount <= 0) return;
    setGenerating(true);

    try {
      const charge = await requestCentralizedPixCharge({
        amount: effectiveAmount,
        donorName: donorName || undefined,
        donorEmail: donorEmail || undefined,
        projectId: project.id,
        projectName: project.name,
      });

      setPayload(charge.pixCopiaECola);
      setQrDataUrl(charge.qrDataUrl);

      // Persist donation intent
      const donation: PixDonation = {
        id: charge.txid,
        projectId: project.id,
        projectName: project.name,
        donorName: donorName || undefined,
        donorEmail: donorEmail || undefined,
        amount: effectiveAmount,
        pixPayload: charge.pixCopiaECola,
        txId: charge.txid,
        status: 'PENDING',
        createdAt: charge.createdAt,
      };
      saveDonation(donation);

      // Add to donors if email provided
      if (donorName && donorEmail) {
        try {
          const raw = localStorage.getItem('financial_donors');
          const donors = raw ? JSON.parse(raw) : [];
          const exists = donors.find((d: any) => d.email === donorEmail);
          if (!exists) {
            donors.unshift({
              id: `d-pix-${Date.now()}`,
              name: donorName,
              email: donorEmail,
              type: 'INDIVIDUAL',
              status: 'ACTIVE',
              isRecurring: false,
              joinedAt: new Date().toISOString().split('T')[0],
              totalDonated: effectiveAmount,
            });
            localStorage.setItem('financial_donors', JSON.stringify(donors));
          } else {
            exists.totalDonated = (exists.totalDonated || 0) + effectiveAmount;
            localStorage.setItem('financial_donors', JSON.stringify(donors));
          }
        } catch { /* noop */ }
      }
    } catch (err) {
      console.error('Erro ao gerar cobrança PIX:', err);
    } finally {
      setGenerating(false);
      setStep('qr');
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(payload).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleDownloadQR() {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `chave-pix-${project.shortName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', borderRadius: 24, border: '1px solid rgba(99,102,241,0.3)', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: 32, position: 'relative' }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>✕</button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ fontSize: 36 }}>{project.icon}</div>
          <div>
            <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18 }}>{project.name}</div>
            <div style={{ color: '#64748b', fontSize: 13 }}>{CATEGORY_LABEL[project.category]}</div>
          </div>
        </div>

        {step === 'form' ? (
          <>
            {/* Valor */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Valor da doação</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {QUICK_AMOUNTS.map(v => (
                  <button key={v} onClick={() => { setAmount(v); setCustomAmount(''); }}
                    style={{ flex: 1, minWidth: 70, padding: '10px 4px', borderRadius: 10, border: `1px solid ${amount === v && !customAmount ? project.color : 'rgba(99,102,241,0.2)'}`, background: amount === v && !customAmount ? `${project.color}22` : 'rgba(15,23,42,0.6)', color: amount === v && !customAmount ? project.color : '#94a3b8', fontWeight: 700, cursor: 'pointer', fontSize: 15, transition: 'all 0.2s' }}>
                    R${v}
                  </button>
                ))}
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700 }}>R$</span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={e => { setCustomAmount(e.target.value); setAmount(0); }}
                  placeholder="Outro valor"
                  min="1"
                  style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: `1px solid ${customAmount ? project.color : 'rgba(99,102,241,0.2)'}`, borderRadius: 10, padding: '12px 14px 12px 40px', color: '#e2e8f0', fontSize: 16, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Identificação (opcional) */}
            <div style={{ marginBottom: 8, color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>Identificação (opcional)</div>
            <input value={donorName} onChange={e => setDonorName(e.target.value)} placeholder="Seu nome"
              style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '12px 14px', color: '#e2e8f0', marginBottom: 10, outline: 'none', boxSizing: 'border-box', fontSize: 14 }} />
            <input value={donorEmail} onChange={e => setDonorEmail(e.target.value)} placeholder="Seu e-mail" type="email"
              style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '12px 14px', color: '#e2e8f0', marginBottom: 20, outline: 'none', boxSizing: 'border-box', fontSize: 14 }} />

            {/* PROMPT 182: Padronização do Botão para "Chave PIX" */}
            <button onClick={handleGenerate} disabled={effectiveAmount <= 0 || generating}
              style={{ width: '100%', background: `linear-gradient(135deg, ${project.color}, ${project.color}99)`, border: 'none', borderRadius: 12, padding: '14px 0', color: '#fff', fontWeight: 800, fontSize: 16, cursor: effectiveAmount > 0 ? 'pointer' : 'not-allowed', opacity: effectiveAmount <= 0 ? 0.5 : 1, transition: 'all 0.2s' }}>
              {generating ? '⏳ Processando Chave PIX...' : `🔑 Chave PIX — ${formatBRL(effectiveAmount)}`}
            </button>
          </>
        ) : (
          <>
            {/* QR Code */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'inline-block', marginBottom: 12 }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code PIX" style={{ width: 200, height: 200, display: 'block' }} />
                ) : (
                  <canvas ref={canvasRef} width={200} height={200} />
                )}
              </div>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 22, marginBottom: 4 }}>
                {formatBRL(effectiveAmount)}
              </div>
              <div style={{ color: '#64748b', fontSize: 13 }}>para <strong style={{ color: '#a5b4fc' }}>{project.name}</strong></div>
            </div>

            {/* Payload copia-e-cola */}
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: 14, marginBottom: 16, border: '1px solid rgba(99,102,241,0.15)' }}>
              <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>PIX Copia e Cola</div>
              <div style={{ color: '#a5b4fc', fontSize: 11, wordBreak: 'break-all', fontFamily: 'monospace', lineHeight: 1.6, userSelect: 'all' }}>{payload}</div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <button onClick={handleCopy}
                style={{ flex: 1, background: copied ? '#10b981' : 'rgba(99,102,241,0.15)', border: `1px solid ${copied ? '#10b981' : 'rgba(99,102,241,0.3)'}`, borderRadius: 10, padding: '12px 0', color: copied ? '#fff' : '#a5b4fc', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' }}>
                {copied ? '✅ Copiado!' : '📋 Copiar Código'}
              </button>
              <button onClick={handleDownloadQR}
                style={{ flex: 1, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '12px 0', color: '#a5b4fc', fontWeight: 700, cursor: 'pointer', transition: 'all 0.3s' }}>
                💾 Baixar QR
              </button>
            </div>

            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: 14, color: '#6ee7b7', fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
              ✅ Abra seu aplicativo bancário, escolha <strong>PIX → Pagar → Ler QR Code</strong> ou <strong>Copia e Cola</strong> e confirme o pagamento.
            </div>

            <button onClick={() => setStep('form')} style={{ width: '100%', background: 'transparent', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '11px 0', color: '#64748b', cursor: 'pointer', fontSize: 14 }}>
              ← Alterar valor
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────
export default function DonationPublic() {
  const [projects, setProjects] = useState<PlatformProject[]>(loadProjects);
  const [selected, setSelected] = useState<PlatformProject | null>(null);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Sincroniza projetos com dados reais do localStorage (campanhas do módulo Financeiro)
  useEffect(() => {
    const raw = localStorage.getItem('financial_campaigns');
    if (raw) {
      try {
        const campaigns = JSON.parse(raw);
        const merged: PlatformProject[] = loadProjects().map(p => {
          const cam = campaigns.find((c: any) => c.name === p.name);
          return cam ? { ...p, raisedAmount: cam.raisedAmount ?? p.raisedAmount, goalAmount: cam.targetAmount ?? p.goalAmount } : p;
        });
        setProjects(merged);
      } catch { /* noop */ }
    }
  }, []);

  const categories = ['all', ...Array.from(new Set(projects.map(p => p.category)))];

  const filtered = projects.filter(p => {
    const catMatch = filterCat === 'all' || p.category === filterCat;
    const searchMatch = searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase());
    return p.active && catMatch && searchMatch;
  });

  const totalRaised = projects.reduce((s, p) => s + p.raisedAmount, 0);
  const totalBeneficiaries = projects.reduce((s, p) => s + p.beneficiariesCount, 0);

  const s: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #050818 0%, #0f0a2e 50%, #050818 100%)', ...s }}>
      {/* Particle decorations */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: `radial-gradient(circle, ${['#6366f1','#ec4899','#10b981','#f59e0b'][i%4]}22 0%, transparent 70%)`, width: `${200 + i * 60}px`, height: `${200 + i * 60}px`, top: `${10 + (i * 13) % 80}%`, left: `${5 + (i * 17) % 90}%`, animation: `float${i%3} ${8+i*2}s ease-in-out infinite`, opacity: 0.6 }} />
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes float0 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-30px) scale(1.05)} }
        @keyframes float1 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(20px) scale(0.95)} }
        @keyframes float2 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-15px) scale(1.03)} }
        .proj-card:hover { transform: translateY(-4px) !important; box-shadow: 0 20px 60px rgba(0,0,0,0.5) !important; }
        .proj-card { transition: all 0.3s cubic-bezier(.34,1.56,.64,1) !important; }
        .cat-btn:hover { background: rgba(99,102,241,0.15) !important; }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ─── HERO ─────────────────────────────── */}
        <div style={{ padding: '60px 24px 48px', textAlign: 'center', maxWidth: 780, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 999, padding: '6px 18px', marginBottom: 24 }}>
            <span style={{ fontSize: 14, color: '#a5b4fc', fontWeight: 600 }}>💜 Instituto Ser Melhor</span>
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 6vw, 56px)', fontWeight: 900, color: '#fff', margin: '0 0 20px', lineHeight: 1.1 }}>
            Transforme vidas com<br />
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>uma doação via PIX</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 18, lineHeight: 1.7, margin: '0 0 36px', maxWidth: 580, marginLeft: 'auto', marginRight: 'auto' }}>
            Escolha o programa que mais conecta com seu propósito. Sua contribuição chega diretamente, com transparência e rastreabilidade total.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
            {[
              { label: 'Arrecadado', value: formatBRL(totalRaised) },
              { label: 'Pessoas Impactadas', value: totalBeneficiaries.toLocaleString('pt-BR') },
              { label: 'Programas Ativos', value: String(projects.filter(p => p.active).length) },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#e2e8f0', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── FILTERS ──────────────────────────── */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 32px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 260px' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🔍</span>
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar programa..."
                style={{ width: '100%', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: '12px 14px 12px 44px', color: '#e2e8f0', outline: 'none', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            {/* Category filters */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {categories.map(c => (
                <button key={c} className="cat-btn" onClick={() => setFilterCat(c)}
                  style={{ padding: '8px 16px', borderRadius: 999, border: `1px solid ${filterCat === c ? '#6366f1' : 'rgba(99,102,241,0.15)'}`, background: filterCat === c ? 'rgba(99,102,241,0.2)' : 'rgba(15,23,42,0.5)', color: filterCat === c ? '#a5b4fc' : '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}>
                  {c === 'all' ? '✨ Todos' : CATEGORY_LABEL[c]}
                </button>
              ))}
            </div>
          </div>

          {/* ─── PROJECT GRID ─────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {filtered.map(proj => {
              const pct = Math.min(100, Math.round((proj.raisedAmount / proj.goalAmount) * 100));
              return (
                <div key={proj.id} className="proj-card"
                  style={{ background: 'linear-gradient(145deg, rgba(15,23,42,0.9) 0%, rgba(30,27,75,0.6) 100%)', border: `1px solid ${proj.color}33`, borderRadius: 20, padding: 24, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  onClick={() => setSelected(proj)}>
                  {/* Gradient accent */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${proj.color}, ${proj.color}66)`, borderRadius: '20px 20px 0 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ fontSize: 40 }}>{proj.icon}</div>
                    <span style={{ fontSize: 11, background: `${proj.color}22`, color: proj.color, padding: '4px 10px', borderRadius: 999, fontWeight: 700, border: `1px solid ${proj.color}44` }}>
                      {CATEGORY_LABEL[proj.category]}
                    </span>
                  </div>

                  <h3 style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 18, margin: '0 0 8px', lineHeight: 1.3 }}>{proj.name}</h3>
                  <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px' }}>{proj.description}</p>

                  {/* Progress */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>Captado</span>
                      <span style={{ color: proj.color, fontWeight: 700, fontSize: 13 }}>{pct}%</span>
                    </div>
                    <div style={{ background: 'rgba(15,23,42,0.8)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${proj.color}, ${proj.color}88)`, borderRadius: 999, transition: 'width 0.8s ease' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ color: proj.color, fontWeight: 700, fontSize: 14 }}>{formatBRL(proj.raisedAmount)}</span>
                      <span style={{ color: '#475569', fontSize: 12 }}>meta {formatBRL(proj.goalAmount)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b', fontSize: 12 }}>👥 {proj.beneficiariesCount.toLocaleString('pt-BR')} beneficiários</span>
                    <button
                      onClick={e => { e.stopPropagation(); setSelected(proj); }}
                      style={{ background: `linear-gradient(135deg, ${proj.color}, ${proj.color}aa)`, border: 'none', borderRadius: 10, padding: '10px 18px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, transition: 'all 0.2s' }}>
                      💚 Apoiar via PIX
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontWeight: 600 }}>Nenhum programa encontrado.</div>
            </div>
          )}
        </div>

        {/* ─── FOOTER ───────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '40px 24px', borderTop: '1px solid rgba(99,102,241,0.1)', marginTop: 20 }}>
          <div style={{ color: '#475569', fontSize: 13, marginBottom: 8 }}>
            🔐 Doações processadas via <strong style={{ color: '#a5b4fc' }}>PIX ({INSTITUTIONAL_PIX.bankName})</strong> do Banco Central do Brasil · CNPJ {INSTITUTIONAL_PIX.cnpj}
          </div>
          <div style={{ color: '#334155', fontSize: 12 }}>
            {INSTITUTIONAL_PIX.razaoSocial} · Gestão via <a href="/login" style={{ color: '#6366f1', textDecoration: 'none' }}>Plataforma Aura</a>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selected && <QRModal project={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
