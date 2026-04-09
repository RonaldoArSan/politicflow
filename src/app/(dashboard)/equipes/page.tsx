'use client';

import React, { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import {
  Plus, Search, Users, MoreVertical, Shield, Target,
  Filter, Activity, Loader2, X, Edit, Trash2, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  name: string;
  supervisorName: string | null;
  status: string;
  committeeId: string | null;
  _count?: {
    advisors: number;
    actions: number;
  };
}

interface FormData {
  name: string;
  supervisorName: string;
  committeeId: string;
  status: string;
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  ACTIVE:   { label: 'Em Operação', class: 'badge-success' },
  INACTIVE: { label: 'Inativa',     class: 'badge-neutral' },
  CLOSED:   { label: 'Inativa',     class: 'badge-neutral' },
};

const EMPTY_FORM: FormData = { name: '', supervisorName: '', committeeId: '', status: 'ACTIVE' };
const inputClass = 'w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-primary/30 focus:ring-2 focus:ring-primary/20';
const labelClass = 'block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5';

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('pf_access_token') : null;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.data.items as Team[];
};

function TeamMenu({ team, onEdit, onDelete }: { team: Team; onEdit: (t: Team) => void; onDelete: (t: Team) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-colors"
      >
        <MoreVertical className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 bg-surface-card border border-border/50 rounded-xl shadow-lg py-1 w-40">
          <button
            onClick={() => { setOpen(false); onEdit(team); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors"
          >
            <Edit className="w-4 h-4 text-text-muted" /> Editar
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(team); }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger/5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}

export default function EquipesPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: teams, error, isLoading, mutate } = useSWR<Team[]>(
    `/api/teams?search=${search}`,
    fetcher
  );

  const { data: committees } = useSWR<{ id: string; name: string }[]>(
    '/api/committees?limit=100',
    fetcher
  );

  const filtered = teams || [];
  const totalMembers = filtered.reduce((sum, t) => sum + (t._count?.advisors || 0), 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const openCreate = () => {
    setEditingTeam(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (team: Team) => {
    setEditingTeam(team);
    setForm({
      name: team.name,
      supervisorName: team.supervisorName || '',
      committeeId: team.committeeId || '',
      status: team.status,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingTeam(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Nome é obrigatório.'); return; }

    setSubmitting(true);
    setFormError('');

    try {
      const token = localStorage.getItem('pf_access_token');
      const url = editingTeam ? `/api/teams/${editingTeam.id}` : '/api/teams';
      const method = editingTeam ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          supervisorName: form.supervisorName || undefined,
          committeeId: form.committeeId || undefined,
          status: form.status,
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Erro ao salvar equipe');

      handleClose();
      mutate();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar equipe');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTeam) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('pf_access_token');
      const res = await fetch(`/api/teams/${deletingTeam.id}`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Erro ao excluir equipe');
      setDeletingTeam(null);
      mutate();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

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
            onClick={openCreate}
            className="gradient-primary text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" /> Nova Equipe
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 shrink-0">
        {[
          { label: 'Total de Equipes', value: filtered.length, color: 'text-primary', icon: <Users className="w-24 h-24" /> },
          { label: 'Membros Alocados', value: totalMembers, color: 'text-accent', icon: <Target className="w-24 h-24" /> },
          { label: 'Em Operação', value: filtered.filter(t => t.status === 'ACTIVE').length, color: 'text-success', icon: <Activity className="w-24 h-24" /> },
          { label: 'Líderes Ativos', value: filtered.filter(t => t.supervisorName).length, color: 'text-warning', icon: <Shield className="w-24 h-24" /> },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-card rounded-2xl p-5 border border-border/50 shadow-sm relative overflow-hidden">
            <div className="absolute -right-4 -bottom-4 opacity-5">{stat.icon}</div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">{stat.label}</p>
            <h3 className={cn('text-3xl font-headline font-extrabold', stat.color)}>{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="card p-4 mb-8">
        <div className="relative">
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((team) => (
          <div key={team.id} className="bg-surface-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-inner">
                  {team.name.charAt(0)}
                </div>
                <h3 className="font-bold text-base text-text-primary leading-tight">{team.name}</h3>
              </div>
              <TeamMenu team={team} onEdit={openEdit} onDelete={setDeletingTeam} />
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-text-secondary border border-border/50 shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-text-muted leading-none">Líder</span>
                  <span className="text-sm font-medium text-text-primary leading-tight mt-0.5">{team.supervisorName || 'Não alocado'}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center text-text-secondary border border-border/50 shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-text-muted leading-none mb-1">Status</span>
                  <span className={cn('badge', STATUS_CONFIG[team.status]?.class || 'badge-neutral')}>
                    {STATUS_CONFIG[team.status]?.label || team.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium" title="Membros">
                <Users className="w-4 h-4" />
                <span>{team._count?.advisors || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium" title="Ações">
                <Target className="w-4 h-4" />
                <span>{team._count?.actions || 0}</span>
              </div>
            </div>
          </div>
        ))}

        {/* Placeholder card */}
        <div
          onClick={openCreate}
          className="border-2 border-dashed border-border/70 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-hover hover:border-primary/40 transition-all text-text-muted hover:text-primary min-h-[260px] group"
        >
          <div className="w-14 h-14 rounded-full bg-surface-muted group-hover:bg-primary/10 flex items-center justify-center mb-4 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm">Criar Nova Equipe</h3>
          <p className="text-xs text-center mt-2 max-w-[200px] opacity-70">Estruture um novo núcleo para separar ações e demandas.</p>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={handleClose}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl text-primary">
                {editingTeam ? 'Editar Equipe' : 'Nova Equipe'}
              </h3>
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
                <input name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="Nome da equipe" required />
              </div>
              <div>
                <label className={labelClass}>Líder / Supervisor</label>
                <input name="supervisorName" value={form.supervisorName} onChange={handleChange} className={inputClass} placeholder="Nome do líder" />
              </div>
              <div>
                <label className={labelClass}>Comitê</label>
                <select name="committeeId" value={form.committeeId} onChange={handleChange} className={inputClass}>
                  <option value="">Nenhum</option>
                  {committees?.map(committee => (
                    <option key={committee.id} value={committee.id}>{committee.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                  <option value="ACTIVE">Em Operação</option>
                  <option value="INACTIVE">Inativa</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleClose} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 gradient-primary text-white font-bold text-sm py-2.5 rounded-xl shadow shadow-primary/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Salvando...' : editingTeam ? 'Salvar Alterações' : 'Criar Equipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTeam && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeletingTeam(null)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline font-bold text-xl text-primary mb-2">Excluir Equipe</h3>
            <p className="text-text-secondary text-sm mb-6">
              Tem certeza que deseja excluir <span className="font-bold text-text-primary">{deletingTeam.name}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingTeam(null)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 bg-danger text-white font-bold text-sm py-2.5 rounded-xl hover:bg-danger/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
