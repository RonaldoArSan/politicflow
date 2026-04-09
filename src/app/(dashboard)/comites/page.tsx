'use client';

import React, { useState } from 'react';
import {
  Plus, Search, MapPin, Phone,
  MoreVertical, Building2, Users,
  Zap, Loader2, X
} from 'lucide-react';

const inputClass = 'w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5';

import { cn } from '@/lib/utils';
import { CommitteeDetailModal } from '@/components/committees/committee-detail-modal';

type CommitteeType = 'CENTRAL' | 'REGIONAL' | 'MUNICIPAL' | 'NEIGHBORHOOD';
type UnitStatus = 'ACTIVE' | 'INACTIVE' | 'CLOSED';

interface Committee {
  id: string;
  name: string;
  type: CommitteeType;
  city: string | null;
  neighborhood: string | null;
  responsibleName: string | null;
  phone: string | null;
  status: UnitStatus;
  _count?: {
    teams: number;
    actions: number;
  };
}

interface FormData {
  name: string;
  type: CommitteeType;
  responsibleName: string;
  city: string;
  neighborhood: string;
  address: string;
  phone: string;
  observations: string;
}

const EMPTY_FORM: FormData = {
  name: '',
  type: 'CENTRAL',
  responsibleName: '',
  city: '',
  neighborhood: '',
  address: '',
  phone: '',
  observations: '',
};

const TYPE_LABELS: Record<CommitteeType, string> = {
  CENTRAL: 'Central',
  REGIONAL: 'Regional',
  MUNICIPAL: 'Municipal',
  NEIGHBORHOOD: 'Bairro',
};

const STATUS_CONFIG: Record<UnitStatus, { label: string; class: string }> = {
  ACTIVE: { label: 'Ativo', class: 'badge-success' },
  INACTIVE: { label: 'Inativo', class: 'badge-warning' },
  CLOSED: { label: 'Fechado', class: 'badge-danger' },
};

import { useApi } from '@/hooks/use-api';

export default function ComitesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const { data: response, error, isLoading, mutate } = useApi<{ items: Committee[] }>(
    `/api/committees?search=${search}&type=${typeFilter}`
  );

  const filtered = response?.items || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Nome é obrigatório.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const token = localStorage.getItem('pf_access_token');
      const res = await fetch('/api/committees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          responsibleName: form.responsibleName || undefined,
          city: form.city || undefined,
          neighborhood: form.neighborhood || undefined,
          address: form.address || undefined,
          phone: form.phone || undefined,
          observations: form.observations || undefined,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Erro ao criar comitê');

      setShowForm(false);
      setForm(EMPTY_FORM);
      mutate();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao criar comitê');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold font-headline text-primary">Comitês</h2>
          <p className="text-text-secondary text-sm mt-1">Gerencie seus comitês e núcleos de campanha</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Comitê
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar comitê..."
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
            <option value="CENTRAL">Central</option>
            <option value="REGIONAL">Regional</option>
            <option value="MUNICIPAL">Municipal</option>
            <option value="NEIGHBORHOOD">Bairro</option>
          </select>
        </div>
      </div>

      {/* Status */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-primary mb-4 p-4 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-bold">Carregando comitês...</span>
        </div>
      ) : error ? (
        <div className="text-danger text-sm font-bold mb-4 p-4 text-center">
          Erro ao carregar comitês. {(error as Error).message}
        </div>
      ) : (
        <p className="text-xs text-text-muted font-medium mb-4">{filtered.length} comitês encontrados</p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((committee) => (
          <div
            key={committee.id}
            className="card-hover p-5 group cursor-pointer"
            onClick={() => {
              setSelectedCommittee(committee);
              setShowDetailModal(true);
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                  committee.type === 'CENTRAL' ? 'bg-accent/10 text-accent' :
                  committee.type === 'REGIONAL' ? 'bg-info/10 text-info' :
                  committee.type === 'MUNICIPAL' ? 'bg-success/10 text-success' :
                  'bg-warning/10 text-warning'
                )}>
                  <Building2 className="w-5 h-5" />
                </div>
                <span className={cn('badge', committee.type === 'CENTRAL' ? 'badge-accent' : 'badge-neutral')}>
                  {TYPE_LABELS[committee.type]}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className={cn('badge', STATUS_CONFIG[committee.status].class)}>
                  {STATUS_CONFIG[committee.status].label}
                </span>
                <button className="p-1 rounded-lg hover:bg-surface-hover opacity-0 group-hover:opacity-100 transition-all">
                  <MoreVertical className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            </div>

            <h3 className="font-bold text-sm text-text-primary mb-2 truncate">{committee.name}</h3>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <MapPin className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span className="truncate">{committee.neighborhood}, {committee.city}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <Phone className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span>{committee.phone}</span>
              </div>
            </div>

            <div className="border-t border-border/50 pt-3 flex justify-between items-center">
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Users className="w-3.5 h-3.5" />
                  <span className="font-bold text-text-secondary">{committee._count?.teams || 0}</span> equipes
                </div>
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="font-bold text-text-secondary">{committee._count?.actions || 0}</span> ações
                </div>
              </div>
              <div className="text-[10px] text-text-muted font-medium truncate max-w-[120px]">
                {committee.responsibleName || 'Sem responsável'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedCommittee && (
        <CommitteeDetailModal
          committee={selectedCommittee}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCommittee(null);
          }}
          onUpdate={() => mutate()}
        />
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleClose}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl text-primary">Novo Comitê</h3>
              <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
                {formError}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className={labelClass}>Nome *</label>
                <input name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="Nome do comitê" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Tipo</label>
                  <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
                    <option value="CENTRAL">Central</option>
                    <option value="REGIONAL">Regional</option>
                    <option value="MUNICIPAL">Municipal</option>
                    <option value="NEIGHBORHOOD">Bairro</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Responsável</label>
                  <input name="responsibleName" value={form.responsibleName} onChange={handleChange} className={inputClass} placeholder="Nome do responsável" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Cidade</label>
                  <input name="city" value={form.city} onChange={handleChange} className={inputClass} placeholder="Cidade" />
                </div>
                <div>
                  <label className={labelClass}>Bairro</label>
                  <input name="neighborhood" value={form.neighborhood} onChange={handleChange} className={inputClass} placeholder="Bairro" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Endereço</label>
                <input name="address" value={form.address} onChange={handleChange} className={inputClass} placeholder="Endereço completo" />
              </div>

              <div>
                <label className={labelClass}>Telefone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="(00) 00000-0000" />
              </div>

              <div>
                <label className={labelClass}>Observações</label>
                <textarea name="observations" value={form.observations} onChange={handleChange} className={cn(inputClass, 'resize-none h-20')} placeholder="Observações..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 gradient-accent text-white font-bold text-sm py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Salvando...' : 'Salvar Comitê'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
