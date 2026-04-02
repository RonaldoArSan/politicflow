'use client';

import React, { useState } from 'react';
import {
  Plus, Search, Zap, MapPin, Calendar as CalendarIcon,
  Users, DollarSign, MoreVertical, Target, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTION_TYPE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  COMICIO: { label: 'Comício', emoji: '🎤', color: 'bg-accent/10 text-accent' },
  CARREATA: { label: 'Carreata', emoji: '🚗', color: 'bg-info/10 text-info' },
  PASSEATA: { label: 'Passeata', emoji: '🚶', color: 'bg-success/10 text-success' },
  REUNIAO: { label: 'Reunião', emoji: '🤝', color: 'bg-warning/10 text-warning' },
  CAMINHADA: { label: 'Caminhada', emoji: '👟', color: 'bg-primary/10 text-primary' },
  PANFLETAGEM: { label: 'Panfletagem', emoji: '📄', color: 'bg-danger/10 text-danger' },
  VISITA: { label: 'Visita', emoji: '🏠', color: 'bg-info/10 text-info' },
  GRAVACAO: { label: 'Gravação', emoji: '🎬', color: 'bg-accent/10 text-accent' },
  ENTREVISTA: { label: 'Entrevista', emoji: '🎙️', color: 'bg-success/10 text-success' },
  ENCONTRO_LIDERANCAS: { label: 'Encontro Lideranças', emoji: '⭐', color: 'bg-warning/10 text-warning' },
};

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  PLANNED: { label: 'Planejada', class: 'badge-info' },
  CONFIRMED: { label: 'Confirmada', class: 'badge-success' },
  IN_PROGRESS: { label: 'Em andamento', class: 'badge-warning' },
  COMPLETED: { label: 'Concluída', class: 'badge-neutral' },
  CANCELLED: { label: 'Cancelada', class: 'badge-danger' },
};

const MOCK_ACTIONS = [
  { id: '1', title: 'Carreata Grande ABC', type: 'CARREATA', startDate: '2026-04-05T09:00', location: 'Av. Brasil, Centro', responsibleName: 'Carlos Mendes', estimatedPublic: 500, estimatedCost: 8500, status: 'CONFIRMED', committeeName: 'Comitê Central' },
  { id: '2', title: 'Panfletagem Zona Norte', type: 'PANFLETAGEM', startDate: '2026-04-06T07:00', location: 'Praça Central', responsibleName: 'Ana Lima', estimatedPublic: 200, estimatedCost: 1200, status: 'PLANNED', committeeName: 'Comitê Zona Norte' },
  { id: '3', title: 'Reunião Lideranças Zona Sul', type: 'ENCONTRO_LIDERANCAS', startDate: '2026-04-07T19:00', location: 'Salão Comunitário', responsibleName: 'Pedro Alves', estimatedPublic: 80, estimatedCost: 3000, status: 'CONFIRMED', committeeName: 'Comitê Zona Sul' },
  { id: '4', title: 'Comício Praça da República', type: 'COMICIO', startDate: '2026-04-10T17:00', location: 'Praça da República', responsibleName: 'Maria Santos', estimatedPublic: 2000, estimatedCost: 25000, status: 'PLANNED', committeeName: 'Comitê Central' },
  { id: '5', title: 'Caminhada Periferia', type: 'CAMINHADA', startDate: '2026-04-12T06:00', location: 'Bairro Esperança', responsibleName: 'Fernanda Costa', estimatedPublic: 300, estimatedCost: 2500, status: 'PLANNED', committeeName: 'Comitê Regional' },
  { id: '6', title: 'Entrevista Rádio Local', type: 'ENTREVISTA', startDate: '2026-04-08T08:00', location: 'Rádio FM 99.5', responsibleName: 'Carlos Mendes', estimatedPublic: null, estimatedCost: 0, status: 'CONFIRMED', committeeName: null },
];

export default function AcoesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = MOCK_ACTIONS.filter(a => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || a.type === typeFilter;
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold font-headline text-primary">Ações Políticas</h2>
          <p className="text-text-secondary text-sm mt-1">Atividades de campanha e mobilização</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Ação
        </button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: MOCK_ACTIONS.length, color: 'text-primary' },
          { label: 'Confirmadas', value: MOCK_ACTIONS.filter(a => a.status === 'CONFIRMED').length, color: 'text-success' },
          { label: 'Planejadas', value: MOCK_ACTIONS.filter(a => a.status === 'PLANNED').length, color: 'text-info' },
          { label: 'Público Est.', value: MOCK_ACTIONS.reduce((sum, a) => sum + (a.estimatedPublic || 0), 0).toLocaleString('pt-BR'), color: 'text-accent' },
        ].map((s, i) => (
          <div key={i} className="card p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">{s.label}</p>
            <p className={cn("text-xl font-black font-headline", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar ação..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-surface-hover rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            {Object.entries(ACTION_TYPE_LABELS).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <select
            className="px-4 py-2.5 bg-surface-hover rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions list */}
      <div className="space-y-3">
        {filtered.map((action) => {
          const typeInfo = ACTION_TYPE_LABELS[action.type];
          const statusInfo = STATUS_CONFIG[action.status];
          const date = new Date(action.startDate);

          return (
            <div key={action.id} className="card-hover p-5 group">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Type icon */}
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0", typeInfo.color)}>
                  {typeInfo.emoji}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">{action.title}</h3>
                      <span className="text-[10px] font-medium text-text-muted">{typeInfo.label}</span>
                    </div>
                    <span className={cn("badge shrink-0", statusInfo.class)}>{statusInfo.label}</span>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="w-3.5 h-3.5 text-text-muted" />
                      {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    {action.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-text-muted" />
                        <span className="truncate max-w-[180px]">{action.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-text-muted" />
                      {action.responsibleName}
                    </div>
                    {action.estimatedPublic && (
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-text-muted" />
                        {action.estimatedPublic.toLocaleString('pt-BR')} pessoas
                      </div>
                    )}
                    {action.estimatedCost > 0 && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-text-muted" />
                        R$ {action.estimatedCost.toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>

                  {action.committeeName && (
                    <div className="mt-2">
                      <span className="badge badge-neutral">{action.committeeName}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-accent transition-colors">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Zap className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="font-bold text-text-primary mb-1">Nenhuma ação encontrada</h3>
          <p className="text-text-muted text-sm">Tente ajustar os filtros ou crie uma nova ação.</p>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline font-bold text-xl text-primary mb-6">Nova Ação Política</h3>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Título</label>
                <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Tipo</label>
                  <select className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20">
                    {Object.entries(ACTION_TYPE_LABELS).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Data/hora</label>
                  <input type="datetime-local" className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Local</label>
                <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Público estimado</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Custo previsto (R$)</label>
                  <input type="number" className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Descrição</label>
                <textarea className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20 resize-none h-20" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 gradient-accent text-white font-bold text-sm py-2.5 rounded-xl shadow shadow-accent/20">Salvar Ação</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
