'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Plus, Search, Filter, MapPin, Phone, Mail,
  MoreVertical, Building2, Users, ChevronDown, Edit, Trash2,
  Zap, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pf_access_token') : null;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data.items as Committee[];
};

export default function ComitesPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: committees, error, isLoading } = useSWR<Committee[]>(
    `/api/committees?search=${search}&type=${typeFilter}`,
    fetcher
  );

  const filtered = committees || [];

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

      {/* Results count & Loading */}
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
          <div key={committee.id} className="card-hover p-5 group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                  committee.type === 'CENTRAL' ? 'bg-accent/10 text-accent' :
                  committee.type === 'REGIONAL' ? 'bg-info/10 text-info' :
                  committee.type === 'MUNICIPAL' ? 'bg-success/10 text-success' :
                  'bg-warning/10 text-warning'
                )}>
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <span className={cn("badge mb-1", 
                    committee.type === 'CENTRAL' ? 'badge-accent' : 'badge-neutral'
                  )}>
                    {TYPE_LABELS[committee.type]}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={cn("badge", STATUS_CONFIG[committee.status].class)}>
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

      {/* New Committee Modal would go here */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline font-bold text-xl text-primary mb-6">Novo Comitê</h3>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Nome</label>
                <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" placeholder="Nome do comitê" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Tipo</label>
                  <select className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20">
                    <option value="CENTRAL">Central</option>
                    <option value="REGIONAL">Regional</option>
                    <option value="MUNICIPAL">Municipal</option>
                    <option value="NEIGHBORHOOD">Bairro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Responsável</label>
                  <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" placeholder="Nome do responsável" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Cidade</label>
                  <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" placeholder="Cidade" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Bairro</label>
                  <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" placeholder="Bairro" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Endereço</label>
                <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" placeholder="Endereço completo" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Telefone</label>
                <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" placeholder="(00) 00000-0000" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Observações</label>
                <textarea className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20 resize-none h-20" placeholder="Observações..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 gradient-accent text-white font-bold text-sm py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg transition-all">
                  Salvar Comitê
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
