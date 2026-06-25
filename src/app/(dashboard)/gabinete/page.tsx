'use client';

import React, { useState } from 'react';
import { Plus, Search, MapPin, Phone, Mail, Edit, Trash2, Loader2, AlertCircle, X, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  GABINETE:         { label: 'Gabinete',          color: 'badge-accent'   },
  COMITE_CENTRAL:   { label: 'Comitê Central',    color: 'badge-info'     },
  COMITE_REGIONAL:  { label: 'Comitê Regional',   color: 'badge-warning'  },
  NUCLEO:           { label: 'Núcleo',             color: 'badge-success'  },
};

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  ACTIVE:   { label: 'Ativo',    class: 'badge-success' },
  INACTIVE: { label: 'Inativo',  class: 'badge-neutral' },
  CLOSED:   { label: 'Fechado',  class: 'badge-danger'  },
};

const inputCls = 'w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20';
const labelCls = 'block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5';

interface GabUnit {
  id: string; name: string; type: string; status: string;
  address?: string; city?: string; state?: string; neighborhood?: string;
  region?: string; phone?: string; email?: string; responsibleName?: string; observations?: string;
}

const EMPTY_FORM = { name: '', type: 'GABINETE', status: 'ACTIVE', address: '', city: '', state: '', neighborhood: '', region: '', phone: '', email: '', responsibleName: '', observations: '' };

export default function GabinetePage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<GabUnit | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: response, isLoading, error, mutate, request } = useApi<{ items: GabUnit[] }>(
    `/api/gabinete?search=${search}&type=${typeFilter}&limit=50`
  );
  const units = response?.items ?? [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setShowForm(true); };
  const openEdit = (u: GabUnit) => {
    setEditing(u);
    setForm({ name: u.name, type: u.type, status: u.status, address: u.address ?? '', city: u.city ?? '', state: u.state ?? '', neighborhood: u.neighborhood ?? '', region: u.region ?? '', phone: u.phone ?? '', email: u.email ?? '', responsibleName: u.responsibleName ?? '', observations: u.observations ?? '' });
    setFormError(''); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.type) { setFormError('Nome e tipo são obrigatórios.'); return; }
    setSubmitting(true); setFormError('');
    try {
      const body = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, v || undefined]));
      const res = editing
        ? await request(`/api/gabinete/${editing.id}`, { method: 'PATCH', body })
        : await request('/api/gabinete', { method: 'POST', body });
      if (!res?.success) throw new Error(res?.error || 'Erro ao salvar');
      setShowForm(false); mutate();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Excluir "${name}"?`)) return;
    await request(`/api/gabinete/${id}`, { method: 'DELETE' });
    mutate();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold font-headline text-primary">Gabinete & Unidades</h2>
          <p className="text-text-secondary text-sm mt-1">Gabinetes, comitês e núcleos do mandato</p>
        </div>
        <button onClick={openCreate} className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Unidade
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {Object.entries(TYPE_LABELS).map(([type, cfg]) => (
          <div key={type} className="card p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">{cfg.label}</p>
            <p className="text-xl font-black font-headline text-primary">{units.filter(u => u.type === type).length}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input type="text" placeholder="Buscar unidade..." className="w-full pl-10 pr-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="px-4 py-2.5 bg-surface-hover rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Todos os tipos</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5" /><span className="text-sm">{error}</span></div>}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {units.map(u => {
            const type   = TYPE_LABELS[u.type]   ?? { label: u.type,   color: 'badge-neutral' };
            const status = STATUS_CONFIG[u.status] ?? STATUS_CONFIG.ACTIVE;
            return (
              <div key={u.id} className="card-hover p-5 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <span className={cn('badge mb-1', type.color)}>{type.label}</span>
                      <h3 className="font-bold text-sm text-text-primary leading-tight">{u.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={cn('badge', status.class)}>{status.label}</span>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      <button onClick={() => openEdit(u)} className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-accent transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(u.id, u.name)} className="p-1 rounded hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {(u.neighborhood || u.city) && (
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      {[u.address, u.neighborhood, u.city, u.state].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {u.phone && <div className="flex items-center gap-2 text-xs text-text-secondary"><Phone className="w-3.5 h-3.5 text-text-muted" />{u.phone}</div>}
                  {u.email && <div className="flex items-center gap-2 text-xs text-text-secondary"><Mail className="w-3.5 h-3.5 text-text-muted" />{u.email}</div>}
                  {u.responsibleName && <p className="text-xs text-text-muted mt-2">Resp: <span className="text-text-secondary font-medium">{u.responsibleName}</span></p>}
                </div>
              </div>
            );
          })}
          {units.length === 0 && !isLoading && (
            <div className="col-span-full card p-12 text-center">
              <Building2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="font-bold text-text-primary mb-1">Nenhuma unidade cadastrada</h3>
              <p className="text-text-muted text-sm">Cadastre o gabinete ou comitê principal para começar.</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !submitting && setShowForm(false)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl text-primary">{editing ? 'Editar Unidade' : 'Nova Unidade'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{formError}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Nome *</label>
                  <input name="name" value={form.name} onChange={handleChange} className={inputCls} placeholder="Nome da unidade" required />
                </div>
                <div>
                  <label className={labelCls}>Tipo *</label>
                  <select name="type" value={form.type} onChange={handleChange} className={inputCls}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Status</label>
                  <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Responsável</label>
                  <input name="responsibleName" value={form.responsibleName} onChange={handleChange} className={inputCls} placeholder="Nome" />
                </div>
                <div>
                  <label className={labelCls}>Telefone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className={inputCls} placeholder="(00) 00000-0000" />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>E-mail</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Endereço</label>
                  <input name="address" value={form.address} onChange={handleChange} className={inputCls} placeholder="Rua, nº..." />
                </div>
                <div>
                  <label className={labelCls}>Bairro</label>
                  <input name="neighborhood" value={form.neighborhood} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Cidade</label>
                  <input name="city" value={form.city} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Estado</label>
                  <input name="state" value={form.state} onChange={handleChange} className={inputCls} placeholder="UF" maxLength={2} />
                </div>
                <div>
                  <label className={labelCls}>Região</label>
                  <input name="region" value={form.region} onChange={handleChange} className={inputCls} placeholder="Ex: Zona Norte" />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Observações</label>
                  <textarea name="observations" value={form.observations} onChange={handleChange} className={cn(inputCls, 'resize-none h-16')} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} disabled={submitting} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 gradient-accent text-white font-bold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Criar Unidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
