'use client';

import React, { useState } from 'react';
import {
  Plus, Search, Mic2, Phone, Mail, MapPin,
  MoreVertical, Users, Briefcase, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  ACTIVE: { label: 'Ativo', class: 'badge-success' },
  INACTIVE: { label: 'Inativo', class: 'badge-warning' },
  ON_LEAVE: { label: 'Afastado', class: 'badge-info' },
  TERMINATED: { label: 'Desligado', class: 'badge-danger' },
};

const MOCK_ADVISORS = [
  { id: '1', personName: 'João Silva', email: 'joao@email.com', phone: '(11) 91234-0001', city: 'São Paulo', role: 'Assessor de Comunicação', specialty: 'Mídias Sociais', teamName: 'Equipe Digital', status: 'ACTIVE', productivity: 92 },
  { id: '2', personName: 'Maria Oliveira', email: 'maria@email.com', phone: '(11) 91234-0002', city: 'São Paulo', role: 'Assessor de Campo', specialty: 'Mobilização', teamName: 'Equipe Terreno', status: 'ACTIVE', productivity: 87 },
  { id: '3', personName: 'Pedro Santos', email: 'pedro@email.com', phone: '(11) 91234-0003', city: 'Guarulhos', role: 'Assessor Parlamentar', specialty: 'Legislativo', teamName: 'Equipe Gabinete', status: 'ACTIVE', productivity: 78 },
  { id: '4', personName: 'Ana Costa', email: 'ana@email.com', phone: '(11) 91234-0004', city: 'São Paulo', role: 'Assessora Jurídica', specialty: 'Direito Eleitoral', teamName: 'Equipe Jurídica', status: 'ON_LEAVE', productivity: 95 },
  { id: '5', personName: 'Lucas Mendes', email: 'lucas@email.com', phone: '(11) 91234-0005', city: 'Osasco', role: 'Assessor de Agenda', specialty: 'Logística', teamName: 'Equipe Agenda', status: 'ACTIVE', productivity: 65 },
  { id: '6', personName: 'Fernanda Lima', email: 'fernanda@email.com', phone: '(11) 91234-0006', city: 'São Paulo', role: 'Assessora de Imprensa', specialty: 'Relações com Mídia', teamName: 'Equipe Comunicação', status: 'INACTIVE', productivity: 70 },
];

export default function AssessoresPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const filtered = MOCK_ADVISORS.filter(a => {
    const matchSearch = !search || a.personName.toLowerCase().includes(search.toLowerCase()) || a.role.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold font-headline text-primary">Assessores</h2>
          <p className="text-text-secondary text-sm mt-1">Equipe de assessoria e suporte operacional</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Assessor
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar assessor..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-surface-hover rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-text-muted font-medium mb-4">{filtered.length} assessores encontrados</p>

      {/* Table */}
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
                <th className="text-right px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filtered.map((advisor) => {
                const statusInfo = STATUS_CONFIG[advisor.status];
                return (
                  <tr key={advisor.id} className="hover:bg-surface-hover/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {advisor.personName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">{advisor.personName}</p>
                          <p className="text-[10px] text-text-muted">{advisor.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-xs font-medium text-text-primary">{advisor.role}</p>
                      <p className="text-[10px] text-text-muted">{advisor.specialty}</p>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="badge badge-neutral">{advisor.teamName}</span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              advisor.productivity >= 80 ? 'bg-success' : advisor.productivity >= 60 ? 'bg-warning' : 'bg-danger'
                            )}
                            style={{ width: `${advisor.productivity}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-text-secondary">{advisor.productivity}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={cn("badge", statusInfo.class)}>{statusInfo.label}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-accent transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <Mic2 className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <h3 className="font-bold text-text-primary mb-1">Nenhum assessor encontrado</h3>
          <p className="text-text-muted text-sm">Tente ajustar os filtros ou cadastre um novo assessor.</p>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline font-bold text-xl text-primary mb-6">Novo Assessor</h3>
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Nome completo</label>
                <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">E-mail</label>
                  <input type="email" className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Telefone</label>
                  <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Função</label>
                  <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Especialidade</label>
                  <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Equipe</label>
                <select className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20">
                  <option value="">Selecione uma equipe</option>
                  <option>Equipe Digital</option>
                  <option>Equipe Terreno</option>
                  <option>Equipe Gabinete</option>
                  <option>Equipe Jurídica</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 gradient-accent text-white font-bold text-sm py-2.5 rounded-xl shadow shadow-accent/20">Salvar Assessor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
