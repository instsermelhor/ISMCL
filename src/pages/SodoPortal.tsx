// ============================================================
// SODO — PORTAL PRINCIPAL DE DOCUMENTAÇÃO
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

import React, { useState } from 'react';
import { useSodo } from '../contexts/SodoContext';
import type { LibraryCategory, DocArticle } from '../types/sodo';

const LIBRARY_META: Record<LibraryCategory, { icon: string; color: string; label: string }> = {
  institucional: { icon: '🏛️', color: '#6366f1', label: 'Institucional' },
  tecnica:       { icon: '⚙️', color: '#0ea5e9', label: 'Técnica' },
  operacional:   { icon: '📋', color: '#22c55e', label: 'Operacional' },
  juridica:      { icon: '⚖️', color: '#f59e0b', label: 'Jurídica' },
  clinica:       { icon: '🏥', color: '#ec4899', label: 'Clínica' },
  seguranca:     { icon: '🔒', color: '#ef4444', label: 'Segurança' },
};

const CLASSIFICATION_BADGE: Record<string, { label: string; color: string }> = {
  publico:               { label: 'Público', color: '#22c55e' },
  uso_interno:           { label: 'Uso Interno', color: '#0ea5e9' },
  restrito:              { label: 'Restrito', color: '#f59e0b' },
  confidencial:          { label: 'Confidencial', color: '#f97316' },
  altamente_confidencial:{ label: 'Alt. Confidencial', color: '#ef4444' },
  sigilo_especial:       { label: 'Sigilo Especial', color: '#7c3aed' },
};

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  publicado:  { label: 'Publicado', color: '#22c55e' },
  rascunho:   { label: 'Rascunho', color: '#94a3b8' },
  em_revisao: { label: 'Em Revisão', color: '#f59e0b' },
  aprovado:   { label: 'Aprovado', color: '#0ea5e9' },
  arquivado:  { label: 'Arquivado', color: '#64748b' },
  obsoleto:   { label: 'Obsoleto', color: '#ef4444' },
};

export default function SodoPortal() {
  const {
    libraries, articles, searchQuery, setSearchQuery, searchResults,
    selectedLibrary, selectedArticle, selectLibrary, selectArticle,
    toggleFavorite, isFavorite, aiMessages, sendAiMessage, readingHistory,
  } = useSodo();

  const [view, setView] = useState<'home' | 'library' | 'article' | 'assistant' | 'search'>('home');
  const [aiInput, setAiInput] = useState('');

  const featuredArticles = articles.filter(a => a.isFeatured);
  const recentArticles = [...articles].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);
  const filteredArticles = selectedLibrary ? articles.filter(a => a.library === selectedLibrary) : articles;

  function handleSelectArticle(id: string) {
    selectArticle(id);
    setView('article');
  }

  function handleSelectLibrary(lib: LibraryCategory) {
    selectLibrary(lib);
    setView('library');
  }

  function handleSearch(q: string) {
    setSearchQuery(q);
    if (q.trim()) setView('search');
  }

  function handleSendAi() {
    if (!aiInput.trim()) return;
    sendAiMessage(aiInput);
    setAiInput('');
  }

  // ─── Article Viewer ────────────────────────────────────────
  if (view === 'article' && selectedArticle) {
    const art = selectedArticle;
    const cl = CLASSIFICATION_BADGE[art.classification];
    const st = STATUS_BADGE[art.status];
    const lib = LIBRARY_META[art.library];
    const fav = isFavorite(art.id);
    return (
      <div style={{ padding: '0 0 60px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24, fontSize: 13, color: '#94a3b8' }}>
          <button onClick={() => { selectArticle(null); setView('home'); }} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600 }}>SODO</button>
          <span>›</span>
          <button onClick={() => { selectLibrary(art.library); setView('library'); }} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer' }}>{lib.label}</button>
          <span>›</span>
          <span style={{ color: '#e2e8f0' }}>{art.code}</span>
        </div>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', borderRadius: 16, padding: '32px 40px', marginBottom: 28, border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ background: `${lib.color}22`, color: lib.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{lib.icon} {lib.label}</span>
            <span style={{ background: `${cl.color}22`, color: cl.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>🔐 {cl.label}</span>
            <span style={{ background: `${st.color}22`, color: st.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>◉ {st.label}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Código: {art.code} · Versão {art.currentVersion}</div>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>{art.title}</h1>
              {art.subtitle && <p style={{ color: '#94a3b8', fontSize: 15, margin: 0 }}>{art.subtitle}</p>}
            </div>
            <button onClick={() => toggleFavorite(art.id)} style={{ background: fav ? '#f59e0b22' : 'rgba(255,255,255,0.05)', border: `1px solid ${fav ? '#f59e0b' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: fav ? '#f59e0b' : '#94a3b8', fontSize: 14 }}>
              {fav ? '★ Favorito' : '☆ Favoritar'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 20, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
            <span>✍️ Autor: <b style={{ color: '#94a3b8' }}>{art.author}</b></span>
            {art.reviewer && <span>🔍 Revisor: <b style={{ color: '#94a3b8' }}>{art.reviewer}</b></span>}
            {art.approver && <span>✅ Aprovador: <b style={{ color: '#94a3b8' }}>{art.approver}</b></span>}
            <span>📅 Atualizado: <b style={{ color: '#94a3b8' }}>{new Date(art.updatedAt).toLocaleDateString('pt-BR')}</b></span>
            <span>👁 {art.viewCount} visualizações · ⏱ {art.estimatedReadMinutes} min de leitura</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
          {/* Main content */}
          <div>
            <div style={{ background: 'rgba(30,27,75,0.4)', borderRadius: 12, padding: 24, marginBottom: 20, border: '1px solid rgba(99,102,241,0.15)' }}>
              <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7, margin: 0 }}>{art.summary}</p>
            </div>
            {art.sections.map(sec => (
              <div key={sec.id} style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 24, marginBottom: 16, border: '1px solid rgba(99,102,241,0.1)' }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', marginTop: 0, marginBottom: 14 }}>{sec.title}</h2>
                <p style={{ color: '#94a3b8', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>{sec.content}</p>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Tags */}
            <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 18, border: '1px solid rgba(99,102,241,0.1)' }}>
              <h3 style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 0 }}>Tags</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {art.tags.map(t => (
                  <span key={t} style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', padding: '3px 8px', borderRadius: 6, fontSize: 12 }}>{t}</span>
                ))}
              </div>
            </div>
            {/* Módulos */}
            <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 18, border: '1px solid rgba(99,102,241,0.1)' }}>
              <h3 style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 0 }}>Módulos Relacionados</h3>
              {art.relatedModules.map(m => (
                <div key={m} style={{ color: '#e2e8f0', fontSize: 13, marginBottom: 6 }}>⬡ {m}</div>
              ))}
            </div>
            {/* Leis */}
            {art.relatedLaws.length > 0 && (
              <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 18, border: '1px solid rgba(245,158,11,0.2)' }}>
                <h3 style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 0 }}>⚖️ Base Legal</h3>
                {art.relatedLaws.map(l => (
                  <div key={l} style={{ color: '#fbbf24', fontSize: 12, marginBottom: 6 }}>• {l}</div>
                ))}
              </div>
            )}
            {/* Version History */}
            <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 18, border: '1px solid rgba(99,102,241,0.1)' }}>
              <h3 style={{ color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 0 }}>Histórico de Versões</h3>
              {art.versionHistory.map(v => (
                <div key={v.version} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <span style={{ color: '#a5b4fc', fontWeight: 700, fontSize: 13 }}>v{v.version}</span>
                    <span style={{ color: '#64748b', fontSize: 11 }}>{new Date(v.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 12 }}>{v.summary}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Library View ─────────────────────────────────────────
  if (view === 'library' && selectedLibrary) {
    const lib = LIBRARY_META[selectedLibrary];
    const libArticles = filteredArticles;
    return (
      <div>
        <button onClick={() => { selectLibrary(null); setView('home'); }} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600, marginBottom: 20, fontSize: 14 }}>← Voltar ao Portal</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `${lib.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{lib.icon}</div>
          <div>
            <h1 style={{ margin: 0, color: '#e2e8f0', fontSize: 24 }}>Biblioteca {lib.label}</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>{libArticles.length} documento(s) disponível(eis)</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {libArticles.map(art => (
            <ArticleCard key={art.id} article={art} onSelect={() => handleSelectArticle(art.id)} />
          ))}
        </div>
      </div>
    );
  }

  // ─── Search Results ────────────────────────────────────────
  if (view === 'search') {
    return (
      <div>
        <SearchBar value={searchQuery} onChange={handleSearch} onBack={() => setView('home')} />
        <p style={{ color: '#64748b', marginBottom: 20 }}>{searchResults.length} resultado(s) para "<span style={{ color: '#a5b4fc' }}>{searchQuery}</span>"</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {searchResults.map(r => (
            <div key={r.id} onClick={() => r.type === 'article' && handleSelectArticle(r.id)} style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(99,102,241,0.15)', cursor: r.type === 'article' ? 'pointer' : 'default', transition: 'all 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)')}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '2px 8px', borderRadius: 6, fontWeight: 700, textTransform: 'uppercase' }}>
                  {r.type === 'article' ? '📄 Artigo' : r.type === 'pop' ? '📋 POP' : '🎓 Curso'}
                </span>
                {r.library && <span style={{ fontSize: 11, color: '#94a3b8' }}>{LIBRARY_META[r.library]?.label}</span>}
              </div>
              <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>{r.title}</div>
              <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>{r.summary.substring(0, 120)}...</div>
            </div>
          ))}
          {searchResults.length === 0 && (
            <div style={{ textAlign: 'center', color: '#64748b', padding: 40 }}>Nenhum resultado encontrado. Tente outros termos.</div>
          )}
        </div>
      </div>
    );
  }

  // ─── AI Assistant ──────────────────────────────────────────
  if (view === 'assistant') {
    return (
      <div style={{ height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setView('home')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>← Voltar</button>
          <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
          <div>
            <div style={{ color: '#e2e8f0', fontWeight: 700 }}>Ava — Assistente Documental ISM</div>
            <div style={{ color: '#22c55e', fontSize: 11 }}>● Online · Base de conhecimento oficial</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>
          {aiMessages.map(msg => (
            <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '75%', background: msg.role === 'user' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(30,27,75,0.8)', borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px', padding: '12px 16px', border: msg.role === 'assistant' ? '1px solid rgba(99,102,241,0.2)' : 'none' }}>
                <p style={{ color: '#e2e8f0', margin: '0 0 8px', lineHeight: 1.6, fontSize: 14 }}>{msg.content}</p>
                {msg.suggestedArticles && msg.suggestedArticles.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>📄 Documentos relacionados:</div>
                    {msg.suggestedArticles.map(a => (
                      <button key={a.id} onClick={() => { handleSelectArticle(a.id); }} style={{ display: 'block', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '6px 10px', color: '#a5b4fc', fontSize: 12, cursor: 'pointer', marginBottom: 4, textAlign: 'left', width: '100%' }}>
                        {a.code} — {a.title}
                      </button>
                    ))}
                  </div>
                )}
                {msg.suggestedCourses && msg.suggestedCourses.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>🎓 Cursos recomendados:</div>
                    {msg.suggestedCourses.map(c => (
                      <span key={c.id} style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', padding: '3px 8px', borderRadius: 6, fontSize: 12, display: 'inline-block', marginRight: 4 }}>{c.title}</span>
                    ))}
                  </div>
                )}
                <div style={{ color: '#475569', fontSize: 10, marginTop: 8 }}>{new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, padding: '12px 0 0', borderTop: '1px solid rgba(99,102,241,0.15)' }}>
          <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendAi()} placeholder="Pergunte sobre manuais, procedimentos, LGPD, módulos..." style={{ flex: 1, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: '12px 16px', color: '#e2e8f0', fontSize: 14, outline: 'none' }} />
          <button onClick={handleSendAi} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 12, padding: '12px 20px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>Enviar</button>
        </div>
      </div>
    );
  }

  // ─── HOME ──────────────────────────────────────────────────
  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)', borderRadius: 20, padding: '40px 48px', marginBottom: 32, border: '1px solid rgba(99,102,241,0.2)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>SODO · Instituto Ser Melhor</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', margin: '0 0 10px', lineHeight: 1.2 }}>Sistema Oficial de Documentação<br />e Academia Corporativa</h1>
        <p style={{ color: '#94a3b8', fontSize: 15, margin: '0 0 28px', maxWidth: 560 }}>A única fonte oficial de conhecimento da plataforma. Manuais, protocolos, treinamentos e certificações em um só lugar.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <SearchBar value={searchQuery} onChange={handleSearch} />
          <button onClick={() => setView('assistant')} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 12, padding: '12px 20px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>🤖 Perguntar à Ava</button>
        </div>
        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 24, marginTop: 28, paddingTop: 24, borderTop: '1px solid rgba(99,102,241,0.15)' }}>
          {[{ label: 'Documentos', val: '134' }, { label: 'POPs', val: '10' }, { label: 'Cursos', val: '5' }, { label: 'Certificados Emitidos', val: '387' }].map(s => (
            <div key={s.label}>
              <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 22 }}>{s.val}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Libraries */}
      <h2 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>📚 Bibliotecas</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14, marginBottom: 32 }}>
        {libraries.map(lib => {
          const meta = LIBRARY_META[lib.category];
          return (
            <div key={lib.id} onClick={() => handleSelectLibrary(lib.category)}
              style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: '20px 22px', border: `1px solid rgba(99,102,241,0.1)`, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{meta.icon}</div>
              <div style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{lib.name}</div>
              <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>{lib.description.substring(0, 80)}...</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: meta.color, fontSize: 12, fontWeight: 700 }}>{lib.articleCount} documentos</span>
                <span style={{ color: '#475569', fontSize: 11 }}>{new Date(lib.lastUpdated).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Featured */}
      <h2 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>⭐ Documentos em Destaque</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14, marginBottom: 32 }}>
        {featuredArticles.map(a => <ArticleCard key={a.id} article={a} onSelect={() => handleSelectArticle(a.id)} />)}
      </div>

      {/* Recent */}
      <h2 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18, marginBottom: 16 }}>🕐 Atualizados Recentemente</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {recentArticles.map(a => (
          <div key={a.id} onClick={() => handleSelectArticle(a.id)} style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: '14px 20px', border: '1px solid rgba(99,102,241,0.1)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#6366f1')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.1)')}>
            <div>
              <span style={{ fontSize: 11, color: '#6366f1', marginRight: 8, fontWeight: 700 }}>{a.code}</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{a.title}</span>
              <span style={{ color: '#64748b', fontSize: 12, marginLeft: 12 }}>v{a.currentVersion}</span>
            </div>
            <span style={{ color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(a.updatedAt).toLocaleDateString('pt-BR')}</span>
          </div>
        ))}
      </div>

      {/* Favorites */}
      {readingHistory.filter(r => r.isFavorite).length > 0 && (
        <>
          <h2 style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 18, marginBottom: 16, marginTop: 32 }}>★ Meus Favoritos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 14 }}>
            {readingHistory.filter(r => r.isFavorite).map(r => {
              const a = articles.find(a => a.id === r.articleId);
              return a ? <ArticleCard key={a.id} article={a} onSelect={() => handleSelectArticle(a.id)} /> : null;
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Subcomponents ────────────────────────────────────────────

function SearchBar({ value, onChange, onBack }: { value: string; onChange: (v: string) => void; onBack?: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 520 }}>
      {onBack && (
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '10px 14px', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>← Voltar</button>
      )}
      <div style={{ position: 'relative', flex: 1 }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>🔍</span>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder="Buscar manuais, procedimentos, leis, módulos..." style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: '12px 16px 12px 44px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
      </div>
    </div>
  );
}

function ArticleCard({ article: a, onSelect }: { article: DocArticle; onSelect: () => void }) {
  const lib = LIBRARY_META[a.library];
  const cl = CLASSIFICATION_BADGE[a.classification];
  return (
    <div onClick={onSelect} style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: '20px 22px', border: '1px solid rgba(99,102,241,0.1)', cursor: 'pointer', transition: 'all 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = lib.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: lib.color, fontWeight: 700, background: `${lib.color}18`, padding: '3px 8px', borderRadius: 6 }}>{lib.icon} {lib.label}</span>
        <span style={{ fontSize: 11, color: cl.color, background: `${cl.color}18`, padding: '3px 8px', borderRadius: 6 }}>🔐 {cl.label}</span>
      </div>
      <div style={{ fontSize: 11, color: '#6366f1', marginBottom: 4, fontWeight: 700 }}>{a.code}</div>
      <h3 style={{ color: '#e2e8f0', fontWeight: 700, margin: '0 0 6px', fontSize: 15, lineHeight: 1.3 }}>{a.title}</h3>
      <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 14px', lineHeight: 1.5 }}>{a.summary.substring(0, 100)}...</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569' }}>
        <span>⏱ {a.estimatedReadMinutes} min · v{a.currentVersion}</span>
        <span>👁 {a.viewCount}</span>
      </div>
    </div>
  );
}
