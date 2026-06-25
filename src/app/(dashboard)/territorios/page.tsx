'use client';

import React, { useState } from 'react';
import { Plus, Search, ChevronRight, MapPin, Loader2, AlertCircle, X, Trash2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  STATE:        { label: 'Estado',       color: 'text-primary bg-primary/10',  icon: '🗺️' },
  CITY:         { label: 'Município',    color: 'text-info bg-info/10',         icon: '🏙️' },
  NEIGHBORHOOD: { label: 'Bairro',       color: 'text-accent bg-accent/10',     icon: '🏘️' },
  DISTRICT:     { label: 'Distrito',     color: 'text-warning bg-warning/10',   icon: '📍' },
  ZONE:         { label: 'Zona Eleitoral', color: 'text-success bg-success/10', icon: '🗳️' },
};

const inputCls = 'w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20';
const labelCls = 'block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5';

interface Territory {
  id: string; name: string; type: string; population?: number;
  parent?: { id: string; name: string };
  _count?: { children: number };
}

const EMPTY_FORM = { name: '', type: 'CITY', parentId: '', population: '' };

export default function TerritoriosPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [parentId, setParentId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: response, isLoading, error, mutate, request } = useApi<{ items: Territory[] }>(
    `/api/territories?search=${search}&type=${typeFilter}&parentId=${parentId}&limit=100`
  );
  const territories = response?.items ?? [];

  // For parent selector in form
  const { data: allResp } = useApi<{ items: Territory[] }>('/api/territories?limit=200&type=STATE');
  const statesAndCities = allResp?.items ?? [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.type) { setFormError('Nome e tipo são obrigatórios.'); return; }
    setSubmitting(true); setFormError('');
    try {
      const res = await request('/api/territories', {
        method: 'POST',
        body: { name: form.name, type: form.type, parentId: form.parentId || undefined, population: form.population || undefined },
      });
      if (!res?.success) throw new Error(res?.error || 'Erro ao salvar');
      setShowForm(false); setForm(EMPTY_FORM); mutate();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Excluir território "${name}"?`)) return;
    await request(`/api/territories?id=${id}`, { method: 'DELETE' });
    mutate();
  };

  // Group by type for display
  const groupedByType: Record<string, Territory[]> = {};
  for (const t of territories) {
    if (!groupedByType[t.type]) groupedByType[t.type] = [];
    groupedByType[t.type].push(t);
  }

  const typeOrder = ['STATE', 'CITY', 'DISTRICT', 'NEIGHBORHOOD', 'ZONE'];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold font-headline text-primary">Territórios</h2>
          <p className="text-text-secondary text-sm mt-1">Mapeamento eleitoral — estados, municípios, zonas e bairros</p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setFormError(''); setShowForm(true); }} className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Território
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {typeOrder.map(type => {
          const cfg = TYPE_CONFIG[type];
          return (
            <button key={type} onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
              className={cn('card p-4 text-center transition-all', typeFilter === type && 'ring-2 ring-accent')}>
              <p className="text-xl mb-1">{cfg.icon}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">{cfg.label}</p>
              <p className="text-lg font-black font-headline text-primary">
                {isLoading ? '...' : (territories.filter(t => t.type === type).length || 0)}
              </p>
            </button>
          );
        })}
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" placeholder="Buscar território..." className="w-full pl-10 pr-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="px-4 py-2.5 bg-surface-hover rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Todos os tipos</option>
            {typeOrder.map(t => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5" /><span className="text-sm">{error}</span></div>}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : territories.length === 0 ? (
        <div className="card p-12 text-center">
          <MapPin className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="font-bold text-text-primary mb-1">Nenhum território mapeado</h3>
          <p className="text-text-muted text-sm mb-4">Comece adicionando o estado ou município principal da campanha.</p>
          <button onClick={() => { setForm(EMPTY_FORM); setShowForm(true); }} className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Adicionar Território
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {typeOrder.filter(type => (groupedByType[type] ?? []).length > 0).map(type => {
            const cfg = TYPE_CONFIG[type];
            const items = groupedByType[type] ?? [];
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{cfg.icon}</span>
                  <h3 className="font-bold text-sm text-text-primary uppercase tracking-wider">{cfg.label}s</h3>
                  <span className="badge badge-neutral">{items.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map(t => (
                    <div key={t.id} className="card-hover p-4 group flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0', cfg.color)}>
                          {cfg.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-text-primary truncate">{t.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-text-muted">
                            {t.parent && <span className="flex items-center gap-0.5"><ChevronRight className="w-3 h-3" />{t.parent.name}</span>}
                            {t.population && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{t.population.toLocaleString('pt-BR')}</span>}
                            {(t._count?.children ?? 0) > 0 && <span className="badge badge-neutral">{t._count?.children} sub</span>}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(t.id, t.name)} className="p-1 rounded hover:bg-danger/10 text-text-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100 shrink-0 ml-2">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !submitting && setShowForm(false)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl text-primary">Novo Território</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{formError}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className={labelCls}>Nome *</label>
                <input name="name" value={form.name} onChange={handleChange} className={inputCls} placeholder="Nome do território" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tipo *</label>
                  <select name="type" value={form.type} onChange={handleChange} className={inputCls}>
                    {typeOrder.map(t => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>População</label>
                  <input name="population" type="number" value={form.population} onChange={handleChange} className={inputCls} placeholder="Hab." />
                </div>
              </div>
              <div>
                <label className={labelCls}>Território pai (opcional)</label>
                <select name="parentId" value={form.parentId} onChange={handleChange} className={inputCls}>
                  <option value="">Nenhum (raiz)</option>
                  {statesAndCities.map(t => <option key={t.id} value={t.id}>{TYPE_CONFIG[t.type]?.label} — {t.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} disabled={submitting} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 gradient-accent text-white font-bold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Salvando...' : 'Criar Território'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
