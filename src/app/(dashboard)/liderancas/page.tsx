'use client';

import React, { useState } from 'react';
import { Plus, Search, Star, MapPin, Phone, MoreVertical, Eye, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const INFLUENCE_LEVELS: Record<string, { label: string; class: string; stars: number }> = {
  LOW: { label: 'Baixa', class: 'text-text-muted', stars: 1 },
  MEDIUM: { label: 'Média', class: 'text-warning', stars: 2 },
  HIGH: { label: 'Alta', class: 'text-accent', stars: 3 },
  VERY_HIGH: { label: 'Muito Alta', class: 'text-danger', stars: 4 },
};

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  ACTIVE: { label: 'Ativa', class: 'badge-success' },
  INACTIVE: { label: 'Inativa', class: 'badge-neutral' },
  POTENTIAL: { label: 'Potencial', class: 'badge-info' },
  LOST: { label: 'Perdida', class: 'badge-danger' },
};

const MOCK_LEADERS = [
  { id: '1', personName: 'José Ribeiro', phone: '(11) 91234-1001', city: 'São Paulo', neighborhood: 'Centro', region: 'Centro', segment: 'Comércio', influenceLevel: 'VERY_HIGH', estimatedSupporters: 500, status: 'ACTIVE', lastContactAt: '2026-03-30' },
  { id: '2', personName: 'Dona Maria do Carmo', phone: '(11) 91234-1002', city: 'São Paulo', neighborhood: 'Vila Nova', region: 'Zona Norte', segment: 'Comunidade', influenceLevel: 'HIGH', estimatedSupporters: 300, status: 'ACTIVE', lastContactAt: '2026-03-28' },
  { id: '3', personName: 'Pastor Antônio', phone: '(11) 91234-1003', city: 'São Paulo', neighborhood: 'Jardim Esperança', region: 'Zona Leste', segment: 'Religioso', influenceLevel: 'HIGH', estimatedSupporters: 800, status: 'ACTIVE', lastContactAt: '2026-03-25' },
  { id: '4', personName: 'Prof. Carlos Henrique', phone: '(11) 91234-1004', city: 'Guarulhos', neighborhood: 'Centro', region: 'Guarulhos', segment: 'Educação', influenceLevel: 'MEDIUM', estimatedSupporters: 150, status: 'POTENTIAL', lastContactAt: '2026-03-15' },
  { id: '5', personName: 'Sra. Ana Beatriz', phone: '(11) 91234-1005', city: 'São Paulo', neighborhood: 'Morumbi', region: 'Zona Sul', segment: 'Empresarial', influenceLevel: 'VERY_HIGH', estimatedSupporters: 1200, status: 'ACTIVE', lastContactAt: '2026-03-31' },
  { id: '6', personName: 'Diego Santos', phone: '(11) 91234-1006', city: 'Osasco', neighborhood: 'Centro', region: 'Osasco', segment: 'Juventude', influenceLevel: 'MEDIUM', estimatedSupporters: 200, status: 'INACTIVE', lastContactAt: '2026-02-20' },
];

export default function LiderancasPage() {
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('');

  const filtered = MOCK_LEADERS.filter(l => {
    const matchSearch = !search || l.personName.toLowerCase().includes(search.toLowerCase()) || l.segment.toLowerCase().includes(search.toLowerCase());
    const matchRegion = !regionFilter || l.region === regionFilter;
    return matchSearch && matchRegion;
  });

  const regions = [...new Set(MOCK_LEADERS.map(l => l.region))];
  const totalSupporters = filtered.reduce((sum, l) => sum + (l.estimatedSupporters || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold font-headline text-primary">Lideranças</h2>
          <p className="text-text-secondary text-sm mt-1">Base de lideranças e apoiadores estratégicos</p>
        </div>
        <button className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Liderança
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Total</p>
          <p className="text-xl font-black font-headline text-primary">{filtered.length}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Apoiadores Est.</p>
          <p className="text-xl font-black font-headline text-accent">{totalSupporters.toLocaleString('pt-BR')}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Alta Influência</p>
          <p className="text-xl font-black font-headline text-warning">{filtered.filter(l => l.influenceLevel === 'HIGH' || l.influenceLevel === 'VERY_HIGH').length}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Regiões</p>
          <p className="text-xl font-black font-headline text-info">{regions.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar liderança ou segmento..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30 transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-surface-hover rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30"
            value={regionFilter}
            onChange={e => setRegionFilter(e.target.value)}
          >
            <option value="">Todas as regiões</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Leader cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((leader) => {
          const influence = INFLUENCE_LEVELS[leader.influenceLevel];
          const status = STATUS_CONFIG[leader.status];

          return (
            <div key={leader.id} className="card-hover p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {leader.personName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">{leader.personName}</h3>
                    <span className="badge badge-neutral">{leader.segment}</span>
                  </div>
                </div>
                <span className={cn("badge", status.class)}>{status.label}</span>
              </div>

              {/* Influence stars */}
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Influência:</span>
                <div className="flex">
                  {[1, 2, 3, 4].map(s => (
                    <Star
                      key={s}
                      className={cn(
                        "w-3.5 h-3.5",
                        s <= influence.stars ? `${influence.class} fill-current` : 'text-surface-muted'
                      )}
                    />
                  ))}
                </div>
                <span className={cn("text-[10px] font-bold", influence.class)}>{influence.label}</span>
              </div>

              <div className="space-y-1.5 mb-3">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <MapPin className="w-3.5 h-3.5 text-text-muted" />
                  {leader.neighborhood}, {leader.city} — {leader.region}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Phone className="w-3.5 h-3.5 text-text-muted" />
                  {leader.phone}
                </div>
              </div>

              <div className="border-t border-border/50 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-bold text-accent">{leader.estimatedSupporters?.toLocaleString('pt-BR')}</span>
                  <span className="text-[10px] text-text-muted">apoiadores</span>
                </div>
                <div className="text-[10px] text-text-muted">
                  Contato: {new Date(leader.lastContactAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
