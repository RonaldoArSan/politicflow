'use client';

import React, { useState } from 'react';
import { Plus, Search, Star, MapPin, Phone, MoreVertical, TrendingUp, Loader2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';

const INFLUENCE_LEVELS: Record<string, { label: string; class: string; stars: number }> = {
  LOW:       { label: 'Baixa',      class: 'text-text-muted', stars: 1 },
  MEDIUM:    { label: 'Média',      class: 'text-warning',    stars: 2 },
  HIGH:      { label: 'Alta',       class: 'text-accent',     stars: 3 },
  VERY_HIGH: { label: 'Muito Alta', class: 'text-danger',     stars: 4 },
};

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  ACTIVE:    { label: 'Ativa',      class: 'badge-success' },
  INACTIVE:  { label: 'Inativa',    class: 'badge-neutral' },
  POTENTIAL: { label: 'Potencial',  class: 'badge-info'    },
  LOST:      { label: 'Perdida',    class: 'badge-danger'  },
};

const EMPTY_FORM = { name: '', email: '', phone: '', city: '', neighborhood: '', region: '', segment: '', influenceLevel: 'MEDIUM', estimatedSupporters: '', observations: '' };
const inputCls = 'w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20';
const labelCls = 'block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5';

interface Leader {
  id: string;
  status: string;
  influenceLevel: string;
  estimatedSupporters?: number;
  lastContactAt?: string;
  region?: string;
  segment?: string;
  person: { name: string; phone?: string; city?: string; neighborhood?: string };
}

export default function LiderancasPage() {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: response, isLoading, error, mutate, request } = useApi<{ items: Leader[]; pagination: { total: number } }>(
    `/api/leaders?search=${search}&region=${regionFilter}&limit=50`
  );

  const leaders = response?.items ?? [];
  const regions = [...new Set(leaders.map(l => l.region).filter(Boolean))] as string[];
  const totalSupporters = leaders.reduce((s, l) => s + (l.estimatedSupporters || 0), 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Nome é obrigatório.'); return; }
    setSubmitting(true); setFormError('');
    try {
      const res = await request('/api/leaders', {
        method: 'POST',
        body: {
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          city: form.city || undefined,
          neighborhood: form.neighborhood || undefined,
          region: form.region || undefined,
          segment: form.segment || undefined,
          influenceLevel: form.influenceLevel,
          estimatedSupporters: form.estimatedSupporters ? parseInt(form.estimatedSupporters) : undefined,
          observations: form.observations || undefined,
        },
      });
      if (!res?.success) throw new Error(res?.error || 'Erro ao salvar');
      setShowForm(false); setForm(EMPTY_FORM); mutate();
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
          <h2 className="text-2xl font-extrabold font-headline text-primary">Lideranças</h2>
          <p className="text-text-secondary text-sm mt-1">Base de lideranças e apoiadores estratégicos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Liderança
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: leaders.length, color: 'text-primary' },
          { label: 'Apoiadores Est.', value: totalSupporters.toLocaleString('pt-BR'), color: 'text-accent' },
          { label: 'Alta Influência', value: leaders.filter(l => l.influenceLevel === 'HIGH' || l.influenceLevel === 'VERY_HIGH').length, color: 'text-warning' },
          { label: 'Regiões', value: regions.length, color: 'text-info' },
        ].map((s, i) => (
          <div key={i} className="card p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">{s.label}</p>
            <p className={cn('text-xl font-black font-headline', s.color)}>{isLoading ? '...' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" placeholder="Buscar liderança ou segmento..." className="w-full pl-10 pr-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30 transition-all" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="px-4 py-2.5 bg-surface-hover rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30" value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
            <option value="">Todas as regiões</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {leaders.map(leader => {
            const influence = INFLUENCE_LEVELS[leader.influenceLevel] ?? INFLUENCE_LEVELS.MEDIUM;
            const status = STATUS_CONFIG[leader.status] ?? STATUS_CONFIG.ACTIVE;
            return (
              <div key={leader.id} className="card-hover p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {leader.person.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text-primary">{leader.person.name}</h3>
                      {leader.segment && <span className="badge badge-neutral">{leader.segment}</span>}
                    </div>
                  </div>
                  <span className={cn('badge', status.class)}>{status.label}</span>
                </div>

                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Influência:</span>
                  <div className="flex">
                    {[1, 2, 3, 4].map(s => (
                      <Star key={s} className={cn('w-3.5 h-3.5', s <= influence.stars ? `${influence.class} fill-current` : 'text-surface-muted')} />
                    ))}
                  </div>
                  <span className={cn('text-[10px] font-bold', influence.class)}>{influence.label}</span>
                </div>

                <div className="space-y-1.5 mb-3">
                  {(leader.person.neighborhood || leader.person.city) && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <MapPin className="w-3.5 h-3.5 text-text-muted" />
                      {[leader.person.neighborhood, leader.person.city, leader.region].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {leader.person.phone && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <Phone className="w-3.5 h-3.5 text-text-muted" />{leader.person.phone}
                    </div>
                  )}
                </div>

                <div className="border-t border-border/50 pt-3 flex items-center justify-between">
                  {leader.estimatedSupporters ? (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-accent" />
                      <span className="text-xs font-bold text-accent">{leader.estimatedSupporters.toLocaleString('pt-BR')}</span>
                      <span className="text-[10px] text-text-muted">apoiadores</span>
                    </div>
                  ) : <span />}
                  {leader.lastContactAt && (
                    <div className="text-[10px] text-text-muted">
                      Contato: {new Date(leader.lastContactAt).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {leaders.length === 0 && !isLoading && (
            <div className="col-span-full card p-12 text-center">
              <Star className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="font-bold text-text-primary mb-1">Nenhuma liderança encontrada</h3>
              <p className="text-text-muted text-sm">Cadastre a primeira liderança para começar.</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !submitting && setShowForm(false)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl text-primary">Nova Liderança</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{formError}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Nome completo *</label>
                  <input name="name" value={form.name} onChange={handleChange} className={inputCls} placeholder="Nome da liderança" required />
                </div>
                <div>
                  <label className={labelCls}>Telefone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} placeholder="(11) 90000-0000" />
                </div>
                <div>
                  <label className={labelCls}>E-mail</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className={labelCls}>Cidade</label>
                  <input name="city" value={form.city} onChange={handleChange} className={inputCls} placeholder="Cidade" />
                </div>
                <div>
                  <label className={labelCls}>Bairro</label>
                  <input name="neighborhood" value={form.neighborhood} onChange={handleChange} className={inputCls} placeholder="Bairro" />
                </div>
                <div>
                  <label className={labelCls}>Região</label>
                  <input name="region" value={form.region} onChange={handleChange} className={inputCls} placeholder="Ex: Zona Norte" />
                </div>
                <div>
                  <label className={labelCls}>Segmento</label>
                  <input name="segment" value={form.segment} onChange={handleChange} className={inputCls} placeholder="Ex: Comércio, Religioso..." />
                </div>
                <div>
                  <label className={labelCls}>Influência</label>
                  <select name="influenceLevel" value={form.influenceLevel} onChange={handleChange} className={inputCls}>
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="VERY_HIGH">Muito Alta</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Apoiadores Estimados</label>
                  <input name="estimatedSupporters" type="number" value={form.estimatedSupporters} onChange={handleChange} className={inputCls} placeholder="0" />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Observações</label>
                  <textarea name="observations" value={form.observations} onChange={handleChange} className={cn(inputCls, 'resize-none h-20')} placeholder="Anotações..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} disabled={submitting} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 gradient-accent text-white font-bold text-sm py-2.5 rounded-xl shadow shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Salvando...' : 'Salvar Liderança'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
