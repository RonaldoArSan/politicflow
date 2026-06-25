'use client';

import React, { useState, useEffect } from 'react';
import { Building2, CreditCard, Shield, Webhook, Save, Bell, Plus, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';

const TABS = [
  { id: 'general',       label: 'Geral do Tenant',     icon: Building2  },
  { id: 'billing',       label: 'Plano e Assinatura',  icon: CreditCard },
  { id: 'rbac',          label: 'Permissões & Cargos', icon: Shield     },
  { id: 'integrations',  label: 'Integrações (API)',   icon: Webhook    },
  { id: 'notifications', label: 'Notificações',         icon: Bell       },
];

const inputCls = 'w-full px-4 py-3 bg-surface-lowest border border-border/60 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium transition-all';

interface UsageStats {
  plan: { name: string; limits: { maxUsers: number; maxCommittees: number; maxActionsMonth: number } };
  usage: { users: number; committees: number; actionsThisMonth: number };
  percentages: { users: number; committees: number; actions: number };
}

interface Role {
  id: string; name: string; slug: string; description?: string; isSystem: boolean;
  _count?: { userRoles: number };
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('general');
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  return (
    <div className="h-full flex flex-col pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shrink-0">
        <div>
          <h2 className="text-3xl font-extrabold font-headline text-primary tracking-tight">Configurações do Workspace</h2>
          <p className="text-text-secondary text-sm mt-1">Gerencie preferências do tenant, assinaturas e permissões</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        <div className="w-full lg:w-64 shrink-0">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto custom-scrollbar pb-2 lg:pb-0">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn('flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap',
                  activeTab === tab.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                )}>
                <tab.icon className={cn('w-5 h-5', activeTab === tab.id ? 'text-white' : 'text-text-muted')} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 bg-surface-card border border-border/50 rounded-2xl shadow-sm p-6 lg:p-8">
          {activeTab === 'general'       && <GeneralTab />}
          {activeTab === 'billing'       && <BillingTab />}
          {activeTab === 'rbac'          && <RbacTab />}
          {(activeTab === 'integrations' || activeTab === 'notifications') && <StubTab />}
        </div>
      </div>
    </div>
  );
}

function GeneralTab() {
  const { data: tenant, request, mutate } = useApi<{ name: string; slug: string; domain?: string }>('/api/auth/me');
  const [form, setForm] = useState({ name: '', domain: '' });
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (tenant) setForm({ name: (tenant as unknown as { tenant?: { name: string; domain?: string } }).tenant?.name ?? '', domain: (tenant as unknown as { tenant?: { name: string; domain?: string } }).tenant?.domain ?? '' });
  }, [tenant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await request('/api/settings/tenant', { method: 'PATCH', body: form });
      if (!res?.success) throw new Error(res?.error || 'Erro ao salvar');
      setNotification({ type: 'success', msg: 'Configurações salvas com sucesso!' });
      mutate();
    } catch (err) {
      setNotification({ type: 'error', msg: err instanceof Error ? err.message : 'Erro ao salvar' });
    } finally {
      setSaving(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <form className="space-y-8" onSubmit={handleSave}>
      {notification && (
        <div className={cn('p-3 rounded-xl flex items-center gap-2 text-sm font-medium', notification.type === 'success' ? 'bg-success/10 text-success border border-success/30' : 'bg-danger/10 text-danger border border-danger/30')}>
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {notification.msg}
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-text-primary mb-1">Informações Cadastrais</h3>
        <p className="text-sm text-text-secondary mb-6">Informações visíveis em relatórios e cabeçalhos.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Nome do Workspace / Campanha</label>
            <input className={inputCls} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome da campanha" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Domínio personalizado (opcional)</label>
            <input className={inputCls} value={form.domain} onChange={e => setForm(p => ({ ...p, domain: e.target.value }))} placeholder="campanha.com.br" />
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 pt-8">
        <h3 className="text-lg font-bold text-text-primary mb-1">Personalização Visual</h3>
        <p className="text-sm text-text-secondary mb-6">Logotipo e identidade do workspace.</p>
        <div className="flex gap-6 items-center">
          <div className="w-24 h-24 rounded-2xl bg-surface-muted border-2 border-dashed border-border/60 flex items-center justify-center text-text-muted hover:bg-surface-hover hover:border-primary/40 transition-colors cursor-pointer shrink-0">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-3">
            <button type="button" className="px-4 py-2 border border-border/60 rounded-lg text-sm font-bold text-text-primary hover:bg-surface-hover transition-colors">Fazer Upload Logo</button>
            <p className="text-xs text-text-muted max-w-sm">Formato quadrado, fundo transparente, max 2MB (SVG ou PNG).</p>
          </div>
        </div>
      </div>

      <div className="border-t border-border/50 pt-8 flex justify-between items-center">
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 flex-1 mr-6">
          <h4 className="font-bold text-danger flex items-center gap-2 mb-1"><AlertCircle className="w-4 h-4" /> Zona de Perigo</h4>
          <p className="text-xs text-danger/80">Excluir workspace apagará todos os dados permanentemente.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" className="px-4 py-2 bg-danger text-white font-bold text-sm rounded-lg hover:bg-danger/90 transition-colors shrink-0">Excluir Workspace</button>
          <button type="submit" disabled={saving} className="gradient-primary text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow shadow-primary/20 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-60 shrink-0">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </form>
  );
}

function BillingTab() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: usage, isLoading } = useApi<UsageStats>(
    !authLoading && isAuthenticated ? '/api/billing/usage' : null
  );

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;
  if (!usage) return <div className="text-sm text-text-muted text-center py-16">Sem dados de plano disponíveis.</div>;

  const { plan, usage: u, percentages: pct } = usage;

  const barColor = (p: number) => p >= 90 ? 'bg-danger' : p >= 70 ? 'bg-warning' : 'bg-success';
  const fmt = (v: number) => v === -1 ? 'Ilimitado' : v.toLocaleString('pt-BR');

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-2xl gradient-primary text-white relative overflow-hidden shadow-lg shadow-primary/20">
        <div className="absolute top-0 right-0 p-8 opacity-10"><CreditCard className="w-32 h-32" /></div>
        <h3 className="text-xl font-bold mb-6">{plan.name}</h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {[
            { label: 'Usuários',    used: u.users,            limit: plan.limits.maxUsers,        pct: pct.users    },
            { label: 'Comitês',     used: u.committees,       limit: plan.limits.maxCommittees,   pct: pct.committees },
            { label: 'Ações/mês',  used: u.actionsThisMonth, limit: plan.limits.maxActionsMonth, pct: pct.actions  },
          ].map(item => (
            <div key={item.label}>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">{item.label}</p>
              <p className="font-bold text-lg">{item.used.toLocaleString('pt-BR')} <span className="text-sm font-normal opacity-70">/ {fmt(item.limit)}</span></p>
              {item.limit !== -1 && (
                <div className="h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-white/80 rounded-full transition-all duration-700" style={{ width: `${Math.min(item.pct, 100)}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white text-primary font-bold text-sm rounded-lg hover:bg-white/90 transition-colors">Fazer Upgrade</button>
          <button className="px-4 py-2 border border-white/30 font-bold text-sm rounded-lg hover:bg-white/10 transition-colors">Métodos de Pagamento</button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-text-primary mb-4">Uso detalhado</h3>
        <div className="space-y-4">
          {[
            { label: 'Usuários ativos',       value: u.users,            max: plan.limits.maxUsers,        pct: pct.users        },
            { label: 'Comitês ativos',        value: u.committees,       max: plan.limits.maxCommittees,   pct: pct.committees   },
            { label: 'Ações este mês',        value: u.actionsThisMonth, max: plan.limits.maxActionsMonth, pct: pct.actions      },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-sm font-medium mb-1.5">
                <span className="text-text-secondary">{item.label}</span>
                <span className="text-text-primary font-bold">{item.value} / {fmt(item.max)}</span>
              </div>
              {item.max !== -1 && (
                <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all duration-700', barColor(item.pct))} style={{ width: `${Math.min(item.pct, 100)}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RbacTab() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: response, isLoading } = useApi<{ items: Role[] }>(
    !authLoading && isAuthenticated ? '/api/roles?limit=50' : null
  );
  const roles = response?.items ?? [];

  const ROLE_BADGE: Record<string, string> = {
    admin: 'badge-danger', coordinator: 'badge-accent', leader: 'badge-info', viewer: 'badge-neutral',
  };

  if (isLoading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-border/50">
        <div>
          <h3 className="text-lg font-bold text-text-primary">Papéis e Perfis</h3>
          <p className="text-sm text-text-secondary">Controle quem pode acessar, editar e deletar informações.</p>
        </div>
        <button className="px-4 py-2 border border-border/60 rounded-lg text-sm font-bold text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> Novo Perfil
        </button>
      </div>

      {roles.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-8">Nenhum perfil cadastrado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map(role => (
            <div key={role.id} className="p-5 border border-border/50 rounded-xl bg-surface-lowest hover:border-primary/30 transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-text-primary group-hover:text-primary transition-colors">{role.name}</h4>
                <span className={cn('badge', ROLE_BADGE[role.slug] ?? 'badge-neutral')}>
                  {role._count?.userRoles ?? 0} usuários
                </span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{role.description || 'Sem descrição'}</p>
              {role.isSystem && <span className="badge badge-neutral mt-2">Sistema</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StubTab() {
  return (
    <div className="h-64 flex flex-col items-center justify-center text-center">
      <Webhook className="w-12 h-12 text-border mb-4" />
      <h3 className="font-bold text-text-primary text-lg">Módulo em Integração</h3>
      <p className="text-sm text-text-muted max-w-sm mt-1">Conexões nativas com WhatsApp Business API e Google Calendar serão liberadas em breve.</p>
    </div>
  );
}
