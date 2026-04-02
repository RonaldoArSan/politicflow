'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
  Plus, Search, Users, MoreVertical, Shield, Target, Clock, Filter, Activity, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

type UnitStatus = 'ACTIVE' | 'STANDBY' | 'INACTIVE'; // STANDBY is not in prisma UnitStatus (ACTIVE, INACTIVE, CLOSED) but we'll map CLOSED to INACTIVE visual if needed

interface Team {
  id: string;
  name: string;
  supervisorName: string | null;
  status: string;
  _count?: {
    advisors: number;
    actions: number;
  };
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  ACTIVE: { label: 'Em Operação', class: 'badge-success' },
  STANDBY: { label: 'Standby', class: 'badge-warning' },
  INACTIVE: { label: 'Inativa', class: 'badge-neutral' },
  CLOSED: { label: 'Inativa', class: 'badge-neutral' },
};

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pf_access_token') : null;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data.items as Team[];
};

export default function EquipesPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: teams, error, isLoading } = useSWR<Team[]>(
    `/api/teams?search=${search}`,
    fetcher
  );

  const filtered = teams || [];
  const totalMembers = filtered.reduce((sum, t) => sum + (t._count?.advisors || 0), 0);

  return (
    <div className="h-full flex flex-col pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold font-headline text-primary tracking-tight">Equipes e Núcleos</h2>
          <p className="text-text-secondary text-sm mt-1">Gestão de times de campanha e assessores agrupados</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center justify-center flex-1 sm:flex-none gap-2 px-4 py-2.5 bg-surface-card border border-border/50 rounded-xl text-sm font-medium hover:bg-surface-hover transition-colors shadow-sm">
            <Filter className="w-4 h-4 text-text-muted" />
            <span className="hidden sm:inline">Filtrar</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="gradient-primary text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            Nova Equipe
          </button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 shrink-0">
        <div className="bg-surface-card rounded-2xl p-5 border border-border/50 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5"><Users className="w-24 h-24" /></div>
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Total de Equipes</p>
          <h3 className="text-3xl font-headline font-extrabold text-primary">{filtered.length}</h3>
        </div>
        <div className="bg-surface-card rounded-2xl p-5 border border-border/50 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5"><Target className="w-24 h-24" /></div>
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Membros Alocados</p>
          <h3 className="text-3xl font-headline font-extrabold text-accent">{totalMembers}</h3>
        </div>
        <div className="bg-surface-card rounded-2xl p-5 border border-border/50 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5"><Activity className="w-24 h-24" /></div>
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Em Operação</p>
          <h3 className="text-3xl font-headline font-extrabold text-success">{filtered.filter(t => t.status === 'ACTIVE').length}</h3>
        </div>
        <div className="bg-surface-card rounded-2xl p-5 border border-border/50 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-5"><Shield className="w-24 h-24" /></div>
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Líderes Ativos</p>
          <h3 className="text-3xl font-headline font-extrabold text-warning">{filtered.filter(t => t.supervisorName).length}</h3>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card p-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar equipe ou líder..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/30 font-medium transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-primary mb-8 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-bold">Carregando equipes...</span>
        </div>
      )}
      {error && (
        <div className="text-danger text-sm font-bold mb-8 text-center">
           Erro ao carregar equipes. {(error as Error).message}
        </div>
      )}

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((team) => (
          <div key={team.id} className="bg-surface-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-inner">
                  {team.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-text-primary leading-tight hover:text-primary transition-colors cursor-pointer">{team.name}</h3>
                </div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-text-secondary border border-border/50 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-text-muted leading-none">Líder</span>
                  <span className="text-sm font-medium text-text-primary leading-tight mt-0.5">{team.supervisorName || 'Membro não alocado'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-text-secondary border border-border/50 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex flex-col w-full">
                  <span className="text-[10px] font-bold uppercase text-text-muted leading-none mb-1">Status</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("badge", STATUS_CONFIG[team.status]?.class || 'badge-neutral')}>{STATUS_CONFIG[team.status]?.label || team.status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 flex items-center justify-between">
              <div className="flex gap-4">
                 <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium hover:text-primary cursor-pointer transition-colors" title="Membros">
                    <Users className="w-4 h-4" />
                    <span>{team._count?.advisors || 0}</span>
                 </div>
                 <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium hover:text-accent cursor-pointer transition-colors" title="Campanhas Ativas">
                    <Target className="w-4 h-4" />
                    <span>{team._count?.actions || 0}</span>
                 </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Adicionar nova equipe (Card de placeholder) */}
        <div 
          onClick={() => setShowForm(true)}
          className="border-2 border-dashed border-border/70 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-hover hover:border-primary/40 transition-all text-text-muted hover:text-primary min-h-[260px] group"
        >
          <div className="w-14 h-14 rounded-full bg-surface-muted group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm">Criar Nova Equipe</h3>
          <p className="text-xs text-center mt-2 max-w-[200px] opacity-70">Estruture um novo núcleo para separar ações e demandas.</p>
        </div>
      </div>

    </div>
  );
}
