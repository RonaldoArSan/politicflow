'use client';

import React from 'react';
import { 
  Zap, Calendar, Star, AlertTriangle, ChevronRight, 
  UserPlus, CheckCircle2, MessageSquare, MoreVertical,
  TrendingUp, TrendingDown, ArrowUpRight, Users2, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const stats = [
  { label: 'Ações do Mês', value: '142', trend: '+12%', trendType: 'positive', icon: Zap, color: 'text-accent bg-accent/10' },
  { label: 'Agendas da Semana', value: '28', trend: 'Crítico', trendType: 'warning', icon: Calendar, color: 'text-warning bg-warning/10' },
  { label: 'Lideranças Ativas', value: '1.204', trend: 'Estável', trendType: 'neutral', icon: Star, color: 'text-info bg-info/10' },
  { label: 'Demandas Abertas', value: '87', trend: 'Pendentes', trendType: 'danger', icon: AlertTriangle, color: 'text-danger bg-danger/10' },
];

const recentActivity = [
  { icon: UserPlus, color: 'bg-accent', title: 'Nova Liderança cadastrada', desc: 'João Silva em Setor Central', time: 'Há 15m' },
  { icon: CheckCircle2, color: 'bg-success', title: 'Demanda #482 Concluída', desc: 'Recapeamento asfáltico', time: 'Há 2h' },
  { icon: MessageSquare, color: 'bg-info', title: 'Feedback de Reunião', desc: 'Coordenadoria Regional', time: 'Há 4h' },
  { icon: Target, color: 'bg-warning', title: 'Ação confirmada', desc: 'Carreata Centro-Oeste', time: 'Há 5h' },
];

const upcomingTasks = [
  { title: 'Reunião de Alinhamento', time: 'Hoje, 14:30 • Sala 04', color: 'bg-accent' },
  { title: 'Relatório de Impacto', time: 'Amanhã, 09:00', color: 'bg-info' },
  { title: 'Visita Técnica: Bairro Novo', time: 'Atrasado • Ontem', color: 'bg-danger', isLate: true },
  { title: 'Preparar Panfletagem', time: 'Quinta, 07:00', color: 'bg-success' },
];

const actionsByMonth = [
  { month: 'Out', value: 40 },
  { month: 'Nov', value: 65 },
  { month: 'Dez', value: 55 },
  { month: 'Jan', value: 85 },
  { month: 'Fev', value: 70 },
  { month: 'Mar', value: 95 },
];

const leadersByRegion = [
  { color: 'bg-primary', label: 'Norte/Centro', value: '45%', count: 542 },
  { color: 'bg-accent', label: 'Sul/Oeste', value: '30%', count: 361 },
  { color: 'bg-accent-light', label: 'Leste', value: '15%', count: 181 },
  { color: 'bg-info', label: 'Outros', value: '10%', count: 120 },
];

const demandProgress = [
  { label: 'Infraestrutura', value: 82, color: 'bg-accent' },
  { label: 'Saúde Pública', value: 45, color: 'bg-info' },
  { label: 'Educação', value: 67, color: 'bg-success' },
  { label: 'Segurança', value: 31, color: 'bg-warning' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Welcome Header */}
      <div className="mb-8">
        <h2 className="text-2xl lg:text-3xl font-extrabold font-headline text-primary tracking-tight">
          Bem-vindo, {user?.name?.split(' ')[0] || 'Coordenador'}
        </h2>
        <p className="text-text-secondary text-sm mt-1">
          Panorama estratégico da sua base eleitoral – {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            className="card-hover p-5 group"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center transition-all", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "badge",
                stat.trendType === 'positive' && "badge-success",
                stat.trendType === 'warning' && "badge-warning",
                stat.trendType === 'neutral' && "badge-info",
                stat.trendType === 'danger' && "badge-danger",
              )}>
                {stat.trend}
              </span>
            </div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className="stat-value text-primary">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6 mb-8">
        {/* Actions Chart */}
        <div className="col-span-12 lg:col-span-8 card p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="font-headline font-bold text-lg text-primary">Ações por Mês</h4>
              <p className="text-xs text-text-muted">Volume de atividades políticas no último semestre</p>
            </div>
            <select className="text-xs font-bold border border-border bg-surface-hover rounded-lg focus:ring-1 focus:ring-accent px-3 py-2 outline-none">
              <option>Últimos 6 meses</option>
              <option>Este ano</option>
            </select>
          </div>
          <div className="h-64 flex items-end gap-3 px-4">
            {actionsByMonth.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="relative w-full group">
                  <div
                    className={cn(
                      "w-full rounded-t-lg transition-all duration-500 ease-out",
                      i === actionsByMonth.length - 1
                        ? "gradient-accent shadow-lg shadow-accent/20"
                        : "bg-accent/10 hover:bg-accent/25"
                    )}
                    style={{ height: `${(item.value / 100) * 220}px` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] px-2 py-1 rounded-md hidden group-hover:block whitespace-nowrap font-bold">
                      {Math.floor(item.value * 1.5)} ações
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{item.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leaders by Region */}
        <div className="col-span-12 lg:col-span-4 card p-6">
          <h4 className="font-headline font-bold text-lg text-primary mb-1">Lideranças por Região</h4>
          <p className="text-xs text-text-muted mb-6">Distribuição geográfica da base</p>
          
          {/* Donut Chart */}
          <div className="flex justify-center mb-6">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#f1f5f9" strokeWidth="3.5" />
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#0a1628" strokeDasharray="45 100" strokeDashoffset="0" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#7c3aed" strokeDasharray="30 100" strokeDashoffset="-45" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#a78bfa" strokeDasharray="15 100" strokeDashoffset="-75" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="18" cy="18" fill="transparent" r="15.915" stroke="#3b82f6" strokeDasharray="10 100" strokeDashoffset="-90" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-primary font-headline">1.2k</span>
                <span className="text-[10px] font-bold uppercase text-text-muted">Total</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {leadersByRegion.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("w-3 h-3 rounded-full", item.color)} />
                  <span className="text-xs font-medium text-text-secondary">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">{item.count}</span>
                  <span className="text-xs font-bold text-text-primary">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Demand Progress */}
        <div className="col-span-12 lg:col-span-4 card p-6">
          <h4 className="font-headline font-bold text-lg text-primary mb-6">Demandas Resolvidas</h4>
          <div className="space-y-5">
            {demandProgress.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-text-secondary">{item.label}</span>
                  <span className={item.value > 60 ? "text-success" : item.value > 40 ? "text-warning" : "text-danger"}>
                    {item.value}%
                  </span>
                </div>
                <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700 ease-out", item.color)}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-4 card p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-headline font-bold text-lg text-primary">Atividades Recentes</h4>
            <button className="text-xs text-accent font-bold hover:underline">Ver tudo</button>
          </div>
          <div className="space-y-5 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-hover">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex gap-4 relative">
                <div className={cn("w-6 h-6 rounded-full ring-4 ring-surface-card z-10 flex items-center justify-center shrink-0", item.color)}>
                  <item.icon className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-primary truncate">{item.title}</p>
                  <p className="text-[10px] text-text-muted">{item.desc} • {item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="col-span-12 lg:col-span-4 card p-6">
          <h4 className="font-headline font-bold text-lg text-primary mb-6">Próximas Tarefas</h4>
          <div className="space-y-1">
            {upcomingTasks.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors group">
                <div className={cn("w-1.5 h-10 rounded-full shrink-0", item.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-text-primary">{item.title}</p>
                  <p className={cn(
                    "text-[10px]",
                    item.isLate ? "text-danger font-bold" : "text-text-muted"
                  )}>
                    {item.time}
                  </p>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-surface-muted rounded">
                  <MoreVertical className="w-4 h-4 text-text-muted" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
