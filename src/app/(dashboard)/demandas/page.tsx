'use client';

import React, { useState } from 'react';
import { Plus, Search, AlertCircle, MapPin, Clock, MoreVertical, ArrowUpCircle, ArrowRightCircle, CheckCircle2, Archive, Eye, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';

const PRIORITY_CONFIG: Record<string, { label: string; class: string; icon: React.ElementType; bar: string }> = {
  LOW:    { label: 'Baixa',   class: 'badge-info',              icon: ArrowRightCircle, bar: 'bg-info' },
  MEDIUM: { label: 'Média',   class: 'badge-warning',           icon: ArrowUpCircle,    bar: 'bg-warning' },
  HIGH:   { label: 'Alta',    class: 'badge-danger',            icon: ArrowUpCircle,    bar: 'bg-danger' },
  URGENT: { label: 'Urgente', class: 'bg-danger text-white',    icon: AlertCircle,      bar: 'bg-danger' },
};

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  OPEN:      { label: 'Aberta',       class: 'badge-info',    icon: AlertCircle   },
  ANALYZING: { label: 'Em análise',   class: 'badge-warning', icon: Clock         },
  FORWARDED: { label: 'Encaminhada',  class: 'badge-accent',  icon: ArrowRightCircle },
  RESOLVED:  { label: 'Resolvida',    class: 'badge-success', icon: CheckCircle2  },
  ARCHIVED:  { label: 'Arquivada',    class: 'badge-neutral', icon: Archive       },
};

const inputCls = 'w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20';
const labelCls = 'block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5';

interface Demand {
  id: string; title: string; description?: string; category?: string;
  priority: string; origin?: string; status: string;
  neighborhood?: string; city?: string; createdAt: string;
  responsible?: { name: string };
}

export default function DemandasPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'Infraestrutura', priority: 'MEDIUM', origin: 'Liderança', neighborhood: '', city: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: response, isLoading, error, mutate, request } = useApi<{ items: Demand[]; pagination: { total: number } }>(
    `/api/demands?search=${search}&status=${statusFilter}&priority=${priorityFilter}&limit=50`
  );

  const demands = response?.items ?? [];

  const statsByStatus = {
    OPEN:      demands.filter(d => d.status === 'OPEN').length,
    ANALYZING: demands.filter(d => d.status === 'ANALYZING').length,
    FORWARDED: demands.filter(d => d.status === 'FORWARDED').length,
    RESOLVED:  demands.filter(d => d.status === 'RESOLVED').length,
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Título é obrigatório.'); return; }
    setSubmitting(true); setFormError('');
    try {
      const res = await request('/api/demands', {
        method: 'POST',
        body: { ...form, city: form.city || undefined, neighborhood: form.neighborhood || undefined },
      });
      if (!res?.success) throw new Error(res?.error || 'Erro ao salvar');
      setShowForm(false);
      setForm({ title: '', description: '', category: 'Infraestrutura', priority: 'MEDIUM', origin: 'Liderança', neighborhood: '', city: '' });
      mutate();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold font-headline text-primary">Demandas Territoriais</h2>
          <p className="text-text-secondary text-sm mt-1">Solicitações da população e lideranças</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Demanda
        </button>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        {(Object.keys(statsByStatus) as (keyof typeof statsByStatus)[]).map(status => {
          const info = STATUS_CONFIG[status];
          return (
            <button key={status} onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border',
                statusFilter === status ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface-card text-text-secondary hover:border-accent/30'
              )}>
              <info.icon className="w-3.5 h-3.5" /> {info.label}
              <span className="bg-surface-muted px-1.5 py-0.5 rounded-md text-[10px]">{statsByStatus[status]}</span>
            </button>
          );
        })}
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" placeholder="Buscar demanda ou bairro..." className="w-full pl-10 pr-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30 transition-all" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="px-4 py-2.5 bg-surface-hover rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">Todas as prioridades</option>
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /><span className="text-sm">{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : (
        <div className="space-y-3">
          {demands.map(demand => {
            const priority = PRIORITY_CONFIG[demand.priority] ?? PRIORITY_CONFIG.MEDIUM;
            const status = STATUS_CONFIG[demand.status] ?? STATUS_CONFIG.OPEN;
            return (
              <div key={demand.id} className="card-hover p-5 group">
                <div className="flex items-start gap-4">
                  <div className={cn('w-1.5 rounded-full self-stretch shrink-0', priority.bar, demand.priority === 'URGENT' && 'animate-pulse')} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-bold text-sm text-text-primary">{demand.title}</h3>
                        {demand.description && <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{demand.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn('badge', priority.class)}>{priority.label}</span>
                        <span className={cn('badge', status.class)}>{status.label}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-text-secondary">
                      {(demand.neighborhood || demand.city) && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-text-muted" />
                          {[demand.neighborhood, demand.city].filter(Boolean).join(', ')}
                        </div>
                      )}
                      {demand.category && <span className="badge badge-neutral">{demand.category}</span>}
                      {demand.origin && <div className="text-text-muted">Origem: <span className="font-medium text-text-secondary">{demand.origin}</span></div>}
                      {demand.responsible && <div className="text-text-muted">Resp: <span className="font-medium text-text-secondary">{demand.responsible.name}</span></div>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {demands.length === 0 && (
            <div className="card p-12 text-center">
              <AlertCircle className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="font-bold text-text-primary mb-1">Nenhuma demanda encontrada</h3>
              <p className="text-text-muted text-sm">Ajuste os filtros ou registre uma nova demanda.</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !submitting && setShowForm(false)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl text-primary">Nova Demanda</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{formError}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className={labelCls}>Título *</label>
                <input name="title" value={form.title} onChange={handleChange} className={inputCls} placeholder="Descreva brevemente a demanda" required />
              </div>
              <div>
                <label className={labelCls}>Descrição</label>
                <textarea name="description" value={form.description} onChange={handleChange} className={cn(inputCls, 'resize-none h-20')} placeholder="Detalhes adicionais..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Prioridade</label>
                  <select name="priority" value={form.priority} onChange={handleChange} className={inputCls}>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Categoria</label>
                  <select name="category" value={form.category} onChange={handleChange} className={inputCls}>
                    {['Infraestrutura','Saúde','Educação','Segurança','Lazer','Transporte','Outros'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Bairro</label>
                  <input name="neighborhood" value={form.neighborhood} onChange={handleChange} className={inputCls} placeholder="Bairro" />
                </div>
                <div>
                  <label className={labelCls}>Cidade</label>
                  <input name="city" value={form.city} onChange={handleChange} className={inputCls} placeholder="Cidade" />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Origem</label>
                  <select name="origin" value={form.origin} onChange={handleChange} className={inputCls}>
                    {['Liderança','População','Comunidade','Morador','Vereador','Mídia'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} disabled={submitting} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 gradient-accent text-white font-bold text-sm py-2.5 rounded-xl shadow shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Salvando...' : 'Salvar Demanda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
