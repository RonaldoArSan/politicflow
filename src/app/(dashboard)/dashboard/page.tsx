'use client';

import React from 'react';
import {
  Zap, Calendar, Star, AlertTriangle, ChevronRight,
  UserPlus, CheckCircle2, MessageSquare, MoreVertical,
  TrendingUp, TrendingDown, ArrowUpRight, Users2, Target, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useApi } from '@/hooks/use-api';

interface DashboardStats {
  actions: { total: number; confirmed: number };
  schedules: { thisWeek: number };
  leaders: { active: number };
  demands: { open: number };
  crm: { total: number };
  tasks: { pending: number };
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: stats, isLoading } = useApi<DashboardStats>(
    !authLoading && isAuthenticated ? '/api/dashboard/stats' : null
  );

  const statCards = [
    {
      label: 'Ações do Mês',
      value: isLoading ? '...' : String(stats?.actions?.total ?? 0),
      trend: stats?.actions?.confirmed ? `${stats.actions.confirmed} confirmadas` : 'Carregando',
      trendType: 'positive',
      icon: Zap,
      color: 'text-accent bg-accent/10',
    },
    {
      label: 'Agendas da Semana',
      value: isLoading ? '...' : String(stats?.schedules?.thisWeek ?? 0),
      trend: stats?.schedules?.thisWeek === 0 ? 'Sem eventos' : 'Esta semana',
      trendType: (stats?.schedules?.thisWeek ?? 0) > 5 ? 'warning' : 'neutral',
      icon: Calendar,
      color: 'text-warning bg-warning/10',
    },
    {
      label: 'Lideranças Ativas',
      value: isLoading ? '...' : (stats?.leaders?.active ?? 0).toLocaleString('pt-BR'),
      trend: 'Estável',
      trendType: 'neutral',
      icon: Star,
      color: 'text-info bg-info/10',
    },
    {
      label: 'Demandas Abertas',
      value: isLoading ? '...' : String(stats?.demands?.open ?? 0),
      trend: (stats?.demands?.open ?? 0) > 0 ? 'Pendentes' : 'Em dia',
      trendType: (stats?.demands?.open ?? 0) > 0 ? 'danger' : 'positive',
      icon: AlertTriangle,
      color: 'text-danger bg-danger/10',
    },
  ];

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
        {statCards.map((stat, i) => (
          <div key={i} className="card-hover p-5 group" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex justify-between items-start mb-4">
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center transition-all', stat.color)}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <stat.icon className="w-5 h-5" />}
              </div>
              <span className={cn(
                'badge',
                stat.trendType === 'positive' && 'badge-success',
                stat.trendType === 'warning' && 'badge-warning',
                stat.trendType === 'neutral' && 'badge-info',
                stat.trendType === 'danger' && 'badge-danger',
              )}>
                {stat.trend}
              </span>
            </div>
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-1">{stat.label}</p>
            <h3 className="stat-value text-primary">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Pipeline CRM + Demandas por categoria */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6 mb-8">
        {/* CRM Pipeline resumo */}
        <div className="col-span-12 lg:col-span-8 card p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h4 className="font-headline font-bold text-lg text-primary">Pipeline CRM</h4>
              <p className="text-xs text-text-muted">Distribuição de contatos por etapa</p>
            </div>
          </div>
          <CrmPipelineChart />
        </div>

        {/* Resumo rápido */}
        <div className="col-span-12 lg:col-span-4 card p-6">
          <h4 className="font-headline font-bold text-lg text-primary mb-1">Visão Geral</h4>
          <p className="text-xs text-text-muted mb-6">Totais do tenant</p>
          <QuickSummary stats={stats} isLoading={isLoading} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        <DemandsProgress />
        <RecentAuditActivity />
        <UpcomingSchedules />
      </div>
    </div>
  );
}

function CrmPipelineChart() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading } = useApi<{ stage: string; count: number }[]>(
    !authLoading && isAuthenticated ? '/api/dashboard/crm-pipeline' : null
  );

  const stages = [
    { id: 'NEW_CONTACT', label: 'Prospecção', color: 'bg-info' },
    { id: 'POTENTIAL_SUPPORTER', label: 'Contatados', color: 'bg-warning' },
    { id: 'ACTIVE_LEADER', label: 'Engajados', color: 'bg-primary' },
    { id: 'STRATEGIC_PARTNER', label: 'Apoiadores', color: 'bg-success' },
    { id: 'CONFIRMED_MOBILIZER', label: 'Multiplicadores', color: 'bg-accent' },
  ];

  const total = data?.reduce((s, d) => s + d.count, 0) ?? 0;
  const max = data?.reduce((m, d) => Math.max(m, d.count), 1) ?? 1;

  if (isLoading) {
    return <div className="h-40 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>;
  }

  return (
    <div className="flex items-end gap-3 h-40 px-2">
      {stages.map((stage) => {
        const found = data?.find(d => d.stage === stage.id);
        const count = found?.count ?? 0;
        const height = total === 0 ? 8 : Math.max(8, (count / max) * 140);
        return (
          <div key={stage.id} className="flex-1 flex flex-col items-center gap-2 group">
            <span className="text-[10px] font-bold text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">{count}</span>
            <div
              className={cn('w-full rounded-t-lg transition-all duration-500', stage.color, count === 0 && 'opacity-20')}
              style={{ height: `${height}px` }}
            />
            <span className="text-[9px] font-bold text-text-muted uppercase tracking-tight text-center leading-tight">{stage.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function QuickSummary({ stats, isLoading }: { stats: DashboardStats | null; isLoading: boolean }) {
  const items = [
    { label: 'Contatos CRM', value: stats?.crm?.total ?? 0, color: 'bg-accent' },
    { label: 'Tarefas Pendentes', value: stats?.tasks?.pending ?? 0, color: 'bg-warning' },
    { label: 'Lideranças', value: stats?.leaders?.active ?? 0, color: 'bg-info' },
    { label: 'Demandas Abertas', value: stats?.demands?.open ?? 0, color: 'bg-danger' },
  ];

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('w-3 h-3 rounded-full', item.color)} />
            <span className="text-xs font-medium text-text-secondary">{item.label}</span>
          </div>
          <span className="text-sm font-black text-text-primary">
            {isLoading ? '...' : item.value.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  );
}

function DemandsProgress() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading } = useApi<{ category: string; resolved: number; total: number }[]>(
    !authLoading && isAuthenticated ? '/api/dashboard/demands-progress' : null
  );

  return (
    <div className="col-span-12 lg:col-span-4 card p-6">
      <h4 className="font-headline font-bold text-lg text-primary mb-6">Demandas por Categoria</h4>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
      ) : !data?.length ? (
        <p className="text-sm text-text-muted text-center py-8">Nenhuma demanda registrada</p>
      ) : (
        <div className="space-y-5">
          {data.map((item, i) => {
            const pct = item.total === 0 ? 0 : Math.round((item.resolved / item.total) * 100);
            const colors = ['bg-accent', 'bg-info', 'bg-success', 'bg-warning', 'bg-danger'];
            return (
              <div key={i}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-text-secondary">{item.category || 'Outros'}</span>
                  <span className={pct > 60 ? 'text-success' : pct > 40 ? 'text-warning' : 'text-danger'}>{pct}%</span>
                </div>
                <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700 ease-out', colors[i % colors.length])}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RecentAuditActivity() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading } = useApi<{ id: string; action: string; entityType: string; createdAt: string; user?: { name: string } }[]>(
    !authLoading && isAuthenticated ? '/api/dashboard/recent-activity' : null
  );

  const ACTION_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
    CREATE: { icon: UserPlus, color: 'bg-accent' },
    UPDATE: { icon: CheckCircle2, color: 'bg-success' },
    DELETE: { icon: AlertTriangle, color: 'bg-danger' },
    STATUS_UPDATE: { icon: MessageSquare, color: 'bg-info' },
  };

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    if (m < 1) return 'Agora';
    if (m < 60) return `Há ${m}m`;
    if (h < 24) return `Há ${h}h`;
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const entityLabel: Record<string, string> = {
    leader: 'Liderança',
    demand: 'Demanda',
    task: 'Tarefa',
    political_action: 'Ação',
    schedule: 'Agenda',
    crm: 'CRM',
    advisor: 'Assessor',
    committee: 'Comitê',
    team: 'Equipe',
  };

  return (
    <div className="col-span-12 lg:col-span-4 card p-6">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-headline font-bold text-lg text-primary">Atividade Recente</h4>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
      ) : !data?.length ? (
        <p className="text-sm text-text-muted text-center py-8">Nenhuma atividade recente</p>
      ) : (
        <div className="space-y-5 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-hover">
          {data.map((item) => {
            const cfg = ACTION_ICONS[item.action] ?? ACTION_ICONS.CREATE;
            return (
              <div key={item.id} className="flex gap-4 relative">
                <div className={cn('w-6 h-6 rounded-full ring-4 ring-surface-card z-10 flex items-center justify-center shrink-0', cfg.color)}>
                  <cfg.icon className="w-3 h-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text-primary truncate">
                    {item.action === 'CREATE' ? 'Novo' : item.action === 'DELETE' ? 'Removeu' : 'Atualizou'} {entityLabel[item.entityType] ?? item.entityType}
                  </p>
                  <p className="text-[10px] text-text-muted">{item.user?.name ?? 'Sistema'} • {formatTime(item.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UpcomingSchedules() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, isLoading } = useApi<{ id: string; title: string; startDate: string; type: string; status: string }[]>(
    !authLoading && isAuthenticated ? '/api/dashboard/upcoming-schedules' : null
  );

  const STATUS_COLOR: Record<string, string> = {
    SCHEDULED: 'bg-info',
    CONFIRMED: 'bg-success',
    IN_PROGRESS: 'bg-warning',
    COMPLETED: 'bg-accent',
    CANCELLED: 'bg-danger',
    POSTPONED: 'bg-text-muted',
  };

  return (
    <div className="col-span-12 lg:col-span-4 card p-6">
      <h4 className="font-headline font-bold text-lg text-primary mb-6">Próximas Agendas</h4>
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-accent" /></div>
      ) : !data?.length ? (
        <p className="text-sm text-text-muted text-center py-8">Nenhuma agenda próxima</p>
      ) : (
        <div className="space-y-1">
          {data.map((item) => {
            const date = new Date(item.startDate);
            const isLate = date < new Date() && item.status !== 'COMPLETED';
            return (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover transition-colors group">
                <div className={cn('w-1.5 h-10 rounded-full shrink-0', STATUS_COLOR[item.status] ?? 'bg-info')} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate text-text-primary">{item.title}</p>
                  <p className={cn('text-[10px]', isLate ? 'text-danger font-bold' : 'text-text-muted')}>
                    {isLate ? 'Atrasado · ' : ''}{date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
