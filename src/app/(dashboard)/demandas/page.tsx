'use client';

import React, { useState } from 'react';
import {
  Plus, Search, AlertCircle, MapPin, Clock,
  MoreVertical, ArrowUpCircle, ArrowRightCircle, CheckCircle2, Archive, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIORITY_CONFIG: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  LOW: { label: 'Baixa', class: 'badge-info', icon: ArrowRightCircle },
  MEDIUM: { label: 'Média', class: 'badge-warning', icon: ArrowUpCircle },
  HIGH: { label: 'Alta', class: 'badge-danger', icon: ArrowUpCircle },
  URGENT: { label: 'Urgente', class: 'bg-danger text-white', icon: AlertCircle },
};

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  OPEN: { label: 'Aberta', class: 'badge-info', icon: AlertCircle },
  ANALYZING: { label: 'Em análise', class: 'badge-warning', icon: Clock },
  FORWARDED: { label: 'Encaminhada', class: 'badge-accent', icon: ArrowRightCircle },
  RESOLVED: { label: 'Resolvida', class: 'badge-success', icon: CheckCircle2 },
  ARCHIVED: { label: 'Arquivada', class: 'badge-neutral', icon: Archive },
};

const MOCK_DEMANDS = [
  { id: '1', title: 'Recapeamento Rua das Flores', description: 'Via esburacada, moradores reclamam há meses', category: 'Infraestrutura', priority: 'HIGH', origin: 'Liderança', responsibleName: 'Carlos Mendes', status: 'OPEN', neighborhood: 'Centro', city: 'São Paulo', createdAt: '2026-03-28' },
  { id: '2', title: 'Iluminação Bairro Esperança', description: 'Postes queimados na rua principal', category: 'Infraestrutura', priority: 'MEDIUM', origin: 'População', responsibleName: 'Ana Lima', status: 'FORWARDED', neighborhood: 'Esperança', city: 'São Paulo', createdAt: '2026-03-25' },
  { id: '3', title: 'Posto de Saúde Lotado', description: 'Fila de espera excessiva no PS zona norte', category: 'Saúde', priority: 'URGENT', origin: 'Liderança', responsibleName: 'Pedro Alves', status: 'ANALYZING', neighborhood: 'Santana', city: 'São Paulo', createdAt: '2026-03-30' },
  { id: '4', title: 'Escola sem merenda', description: 'Crianças sem refeição há 2 semanas', category: 'Educação', priority: 'URGENT', origin: 'Comunidade', responsibleName: 'Maria Santos', status: 'OPEN', neighborhood: 'Vila Nova', city: 'Guarulhos', createdAt: '2026-03-31' },
  { id: '5', title: 'Praça abandonada', description: 'Equipamentos quebrados e mato alto', category: 'Lazer', priority: 'LOW', origin: 'Morador', responsibleName: 'Fernanda Costa', status: 'RESOLVED', neighborhood: 'Jardim América', city: 'São Paulo', createdAt: '2026-03-15' },
];

export default function DemandasPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = MOCK_DEMANDS.filter(d => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.neighborhood.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || d.status === statusFilter;
    const matchPriority = !priorityFilter || d.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  // Stats
  const statsByStatus = {
    OPEN: MOCK_DEMANDS.filter(d => d.status === 'OPEN').length,
    ANALYZING: MOCK_DEMANDS.filter(d => d.status === 'ANALYZING').length,
    FORWARDED: MOCK_DEMANDS.filter(d => d.status === 'FORWARDED').length,
    RESOLVED: MOCK_DEMANDS.filter(d => d.status === 'RESOLVED').length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold font-headline text-primary">Demandas Territoriais</h2>
          <p className="text-text-secondary text-sm mt-1">Solicitações da população e lideranças</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Demanda
        </button>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(statsByStatus).map(([status, count]) => {
          const info = STATUS_CONFIG[status];
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                statusFilter === status
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface-card text-text-secondary hover:border-accent/30"
              )}
            >
              <info.icon className="w-3.5 h-3.5" />
              {info.label}
              <span className="bg-surface-muted px-1.5 py-0.5 rounded-md text-[10px]">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar demanda ou bairro..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-surface-hover rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30"
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
          >
            <option value="">Todas as prioridades</option>
            {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Demands list */}
      <div className="space-y-3">
        {filtered.map((demand) => {
          const priority = PRIORITY_CONFIG[demand.priority];
          const status = STATUS_CONFIG[demand.status];

          return (
            <div key={demand.id} className="card-hover p-5 group">
              <div className="flex items-start gap-4">
                {/* Priority indicator */}
                <div className={cn(
                  "w-1.5 rounded-full self-stretch shrink-0",
                  demand.priority === 'URGENT' ? 'bg-danger animate-pulse' :
                  demand.priority === 'HIGH' ? 'bg-danger' :
                  demand.priority === 'MEDIUM' ? 'bg-warning' : 'bg-info'
                )} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">{demand.title}</h3>
                      <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{demand.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn("badge", priority.class)}>{priority.label}</span>
                      <span className={cn("badge", status.class)}>{status.label}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-text-muted" />
                      {demand.neighborhood}, {demand.city}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="badge badge-neutral">{demand.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted">
                      Origem: <span className="font-medium text-text-secondary">{demand.origin}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted">
                      Resp: <span className="font-medium text-text-secondary">{demand.responsibleName}</span>
                    </div>
                  </div>
                </div>

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

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline font-bold text-xl text-primary mb-6">Nova Demanda</h3>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Título</label>
                <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Descrição</label>
                <textarea className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20 resize-none h-20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Prioridade</label>
                  <select className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20">
                    {Object.entries(PRIORITY_CONFIG).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Categoria</label>
                  <select className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20">
                    <option>Infraestrutura</option>
                    <option>Saúde</option>
                    <option>Educação</option>
                    <option>Segurança</option>
                    <option>Lazer</option>
                    <option>Transporte</option>
                    <option>Outros</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Bairro</label>
                  <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Cidade</label>
                  <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Origem</label>
                <select className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20">
                  <option>Liderança</option>
                  <option>População</option>
                  <option>Comunidade</option>
                  <option>Morador</option>
                  <option>Vereador</option>
                  <option>Mídia</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 gradient-accent text-white font-bold text-sm py-2.5 rounded-xl shadow shadow-accent/20">Salvar Demanda</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
