import React, { useState } from 'react';
import { usePiarave } from '../contexts/PiaraveContext';
import type { PiaraveLibraryItem } from '../types/piarave';
import {
  BookOpen,
  Search,
  CheckCircle,
  AlertTriangle,
  PlusCircle,
  FileText,
  Video,
  Award,
  Filter,
} from 'lucide-react';

const TYPE_ICONS: Record<PiaraveLibraryItem['type'], React.ReactNode> = {
  cartilha: <FileText className="w-5 h-5 text-blue-400" />,
  video: <Video className="w-5 h-5 text-red-400" />,
  material_psicoeducativo: <BookOpen className="w-5 h-5 text-indigo-400" />,
  direitos: <Award className="w-5 h-5 text-amber-400" />,
  cnv: <Award className="w-5 h-5 text-emerald-400" />,
};

const TYPE_LABELS: Record<PiaraveLibraryItem['type'], string> = {
  cartilha: '📚 Cartilha',
  video: '🎥 Vídeo Educativo',
  material_psicoeducativo: '📖 Psicoeducação',
  direitos: '⚖️ Direitos da Vítima',
  cnv: '🗣️ CNV',
};

export default function PiaraveBiblioteca() {
  const { libraryItems, addLibraryItem, validateLibraryItem } = usePiarave();

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Adicionar Recurso (Formulário)
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    title: '',
    type: 'cartilha' as PiaraveLibraryItem['type'],
    description: '',
    tags: '',
  });

  // Validação (Profissionais)
  const [validationNotes, setValidationNotes] = useState<Record<string, string>>({});

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title.trim()) return;
    addLibraryItem({
      title: newItem.title,
      type: newItem.type,
      description: newItem.description,
      contentUrl: '#',
      tags: newItem.tags.split(',').map((t) => t.trim()).filter(Boolean),
      createdBy: 'Profissional Colaborador',
    });
    setNewItem({ title: '', type: 'cartilha', description: '', tags: '' });
    setShowAddForm(false);
  };

  const handleValidation = (id: string, status: 'approved' | 'rejected') => {
    const notes = validationNotes[id] || 'Validação padrão sem notas.';
    validateLibraryItem(id, status, notes);
    setValidationNotes((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  // Filtragem
  const approvedItems = libraryItems.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchType = typeFilter === 'all' || item.type === typeFilter;
    return item.status === 'approved' && matchSearch && matchType;
  });

  const pendingItems = libraryItems.filter((item) => item.status === 'pending_validation');

  const panelStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #09090e 0%, #111124 50%, #0d1527 100%)',
    fontFamily: "'Inter', sans-serif",
    color: '#f1f5f9',
    padding: '32px',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.09)',
    borderRadius: '16px',
    padding: '24px',
    backdropFilter: 'blur(16px)',
  };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #a78bfa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Biblioteca Digital Psicoeducativa
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
            Materiais de apoio validados contra relacionamentos abusivos e violência relacional.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: '10px 20px', background: '#6366f1', color: '#fff', border: 'none',
            borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <PlusCircle className="w-4 h-4" /> Sugerir Recurso
        </button>
      </div>

      {/* Formulário de Adicionar Recurso */}
      {showAddForm && (
        <div style={{ ...cardStyle, marginBottom: '24px', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>📝 Sugerir Novo Material</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Título</label>
              <input
                type="text"
                required
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Tipo</label>
                <select
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value as PiaraveLibraryItem['type'] })}
                  style={{ width: '100%', padding: '10px', background: '#1c1c36', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                >
                  {(Object.keys(TYPE_LABELS) as PiaraveLibraryItem['type'][]).map((t) => (
                    <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="Ex: CNV, Limites, Autoestima"
                  value={newItem.tags}
                  onChange={(e) => setNewItem({ ...newItem, tags: e.target.value })}
                  style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Descrição Breve</label>
              <textarea
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                style={{ width: '100%', height: '80px', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" style={{ padding: '10px 20px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>Enviar para Validação</button>
              <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: '10px 20px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: pendingItems.length > 0 ? '2fr 1fr' : '1fr', gap: '24px' }}>
        
        {/* Catálogo de Recursos Aprovados */}
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar materiais por título, tags ou conteúdo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 10px 10px 40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '12px', color: '#fff' }}
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: '10px 14px', background: '#1c1c36', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '12px', color: '#fff' }}
            >
              <option value="all">📚 Todos os Tipos</option>
              {(Object.keys(TYPE_LABELS) as PiaraveLibraryItem['type'][]).map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {approvedItems.map((item) => (
              <div key={item.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', fontSize: '11px', fontWeight: 600 }}>
                    {TYPE_LABELS[item.type]}
                  </span>
                  {TYPE_ICONS[item.type]}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>{item.title}</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, minHeight: '60px', margin: '0 0 12px 0' }}>
                  {item.description}
                </p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {item.tags.map((t) => (
                    <span key={t} style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(99,102,241,0.1)', color: '#a78bfa', borderRadius: '4px' }}>
                      #{t}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
                  <span>Por {item.createdBy}</span>
                  <span>Aprovado por {item.validatedBy?.split(' ')[0]}</span>
                </div>
              </div>
            ))}
            {approvedItems.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                Nenhum recurso aprovado atende aos critérios informados.
              </div>
            )}
          </div>
        </div>

        {/* Validação Técnica (Somente Profissionais / Pendentes) */}
        {pendingItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Validação Técnica Pendente</h2>
            </div>
            {pendingItems.map((item) => (
              <div key={item.id} style={{ ...cardStyle, borderColor: 'rgba(245,158,11,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', padding: '2px 6px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: '4px' }}>
                    Aguardando Validação
                  </span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{TYPE_LABELS[item.type]}</span>
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 6px 0' }}>{item.title}</h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px 0' }}>{item.description}</p>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {item.tags.map((t) => (
                    <span key={t} style={{ fontSize: '10px', padding: '1px 6px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px' }}>
                      #{t}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '12px' }}>Sugerido por: {item.createdBy}</div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                  <input
                    type="text"
                    placeholder="Notas de validação/revisão..."
                    value={validationNotes[item.id] || ''}
                    onChange={(e) => setValidationNotes({ ...validationNotes, [item.id]: e.target.value })}
                    style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', color: '#fff', fontSize: '12px', marginBottom: '8px', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleValidation(item.id, 'approved')}
                      style={{ flex: 1, padding: '6px 12px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => handleValidation(item.id, 'rejected')}
                      style={{ flex: 1, padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Rejeitar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
