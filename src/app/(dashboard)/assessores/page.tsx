'use client';

import React, { useState } from 'react';
import { Plus, Search, Mic2, MoreVertical, Eye, Loader2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  ACTIVE:     { label: 'Ativo',      class: 'badge-success' },
  INACTIVE:   { label: 'Inativo',    class: 'badge-warning' },
  ON_LEAVE:   { label: 'Afastado',   class: 'badge-info'    },
  TERMINATED: { label: 'Desligado',  class: 'badge-danger'  },
};

const inputCls = 'w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20';
const labelCls = 'block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5';

interface Advisor {
  id: string; role?: string; specialty?: string; status: string; productivity?: number;
  person: { name: string; email?: string; phone?: string; city?: string };
  team?: { name: string };
}

export default function AssessoresPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', role: '', specialty: '', teamId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: response, isLoading, error, mutate, request } = useApi<{ items: Advisor[]; pagination: { total: number } }>(
    `/api/advisors?search=${search}&status=${statusFilter}&limit=50`
  );
  const { data: teamsResp } = useApi<{ items: { id: string; name: string }[] }>('/api/teams?limit=100');

  const advisors = response?.items ?? [];
  const teams = teamsResp?.items ?? [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Nome é obrigatório.'); return; }
    setSubmitting(true); setFormError('');
    try {
      const res = await request('/api/advisors', {
        method: 'POST',
        body: {
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          city: form.city || undefined,
          role: form.role || undefined,
          specialty: form.specialty || undefined,
          teamId: form.teamId || undefined,
        },
      });
      if (!res?.success) throw new Error(res?.error || 'Erro ao salvar');
      setShowForm(false);
      setForm({ name: '', email: '', phone: '', city: '', role: '', specialty: '', teamId: '' });
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
          <h2 className="text-2xl font-extrabold font-headline text-primary">Assessores</h2>
          <p className="text-text-secondary text-sm mt-1">Equipe de assessoria e suporte operacional</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Assessor
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" placeholder="Buscar assessor..." className="w-full pl-10 pr-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30 transition-all" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="px-4 py-2.5 bg-surface-hover rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
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
        <>
          <p className="text-xs text-text-muted font-medium mb-4">{advisors.length} assessores encontrados</p>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted">Assessor</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted hidden md:table-cell">Função</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted hidden lg:table-cell">Equipe</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted hidden lg:table-cell">Produtividade</th>
                    <th className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {advisors.map(advisor => {
                    const statusInfo = STATUS_CONFIG[advisor.status] ?? STATUS_CONFIG.ACTIVE;
                    const prod = advisor.productivity ?? 0;
                    return (
                      <tr key={advisor.id} className="hover:bg-surface-hover/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {advisor.person.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-text-primary">{advisor.person.name}</p>
                              <p className="text-[10px] text-text-muted">{advisor.person.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <p className="text-xs font-medium text-text-primary">{advisor.role || '—'}</p>
                          {advisor.specialty && <p className="text-[10px] text-text-muted">{advisor.specialty}</p>}
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          {advisor.team ? <span className="badge badge-neutral">{advisor.team.name}</span> : <span className="text-text-muted text-xs">—</span>}
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                              <div className={cn('h-full rounded-full', prod >= 80 ? 'bg-success' : prod >= 60 ? 'bg-warning' : 'bg-danger')} style={{ width: `${prod}%` }} />
                            </div>
                            <span className="text-xs font-bold text-text-secondary">{prod}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn('badge', statusInfo.class)}>{statusInfo.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {advisors.length === 0 && (
            <div className="card p-12 text-center mt-4">
              <Mic2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="font-bold text-text-primary mb-1">Nenhum assessor encontrado</h3>
              <p className="text-text-muted text-sm">Cadastre o primeiro assessor para começar.</p>
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !submitting && setShowForm(false)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl text-primary">Novo Assessor</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{formError}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className={labelCls}>Nome completo *</label>
                <input name="name" value={form.name} onChange={handleChange} className={inputCls} placeholder="Nome do assessor" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>E-mail</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Telefone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} placeholder="(11) 90000-0000" />
                </div>
                <div>
                  <label className={labelCls}>Função</label>
                  <input name="role" value={form.role} onChange={handleChange} className={inputCls} placeholder="Ex: Assessor de Campo" />
                </div>
                <div>
                  <label className={labelCls}>Especialidade</label>
                  <input name="specialty" value={form.specialty} onChange={handleChange} className={inputCls} placeholder="Ex: Mobilização" />
                </div>
                <div>
                  <label className={labelCls}>Cidade</label>
                  <input name="city" value={form.city} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Equipe</label>
                  <select name="teamId" value={form.teamId} onChange={handleChange} className={inputCls}>
                    <option value="">Nenhuma</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} disabled={submitting} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 gradient-accent text-white font-bold text-sm py-2.5 rounded-xl shadow shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Salvando...' : 'Salvar Assessor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
