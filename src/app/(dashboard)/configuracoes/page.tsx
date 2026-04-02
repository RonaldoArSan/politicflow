'use client';

import React, { useState } from 'react';
import {
  Building2, CreditCard, Shield, Webhook, Save,
  Users, Key, AlertCircle, Bell, UserPlus, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SETTINGS_TABS = [
  { id: 'general', label: 'Geral do Tenant', icon: Building2 },
  { id: 'billing', label: 'Plano e Assinatura', icon: CreditCard },
  { id: 'rbac', label: 'Permissões & Cargos', icon: Shield },
  { id: 'integrations', label: 'Integrações (API)', icon: Webhook },
  { id: 'notifications', label: 'Notificações', icon: Bell },
];

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="h-full flex flex-col pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shrink-0">
        <div>
          <h2 className="text-3xl font-extrabold font-headline text-primary tracking-tight">Configurações do Workspace</h2>
          <p className="text-text-secondary text-sm mt-1">Gerencie preferências do tenant, assinaturas e permissões</p>
        </div>
        <button className="gradient-primary text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2">
          <Save className="w-4 h-4" />
          Salvar Alterações
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* Sidebar Tabs */}
        <div className="w-full lg:w-64 shrink-0">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto custom-scrollbar pb-2 lg:pb-0">
            {SETTINGS_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  )}
                >
                  <tab.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-text-muted")} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-surface-card border border-border/50 rounded-2xl shadow-sm p-6 lg:p-8">

          {/* Aba: Geral do Tenant */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h3 className="text-lg font-bold text-text-primary mb-1">Informações Cadastrais</h3>
                <p className="text-sm text-text-secondary mb-6">Informações visíveis em relatórios e cabeçalhos de comunicados.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Nome do Workspace / Campanha</label>
                    <input className="w-full px-4 py-3 bg-surface-lowest border border-border/60 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium transition-all" defaultValue="Pro Campanha Oficial - 2026" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">CNPJ do Partido/Comitê (Opcional)</label>
                    <input className="w-full px-4 py-3 bg-surface-lowest border border-border/60 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium transition-all" defaultValue="00.000.000/0001-00" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Endereço Principal</label>
                    <input className="w-full px-4 py-3 bg-surface-lowest border border-border/60 rounded-xl text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-medium transition-all" defaultValue="Av. Paulista, 1500 - Bela Vista, São Paulo/SP" />
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 pt-8">
                <h3 className="text-lg font-bold text-text-primary mb-1">Personalização Visual</h3>
                <p className="text-sm text-text-secondary mb-6">Logotipo e esquema de cores base do painel para os usuários do tenant.</p>
                <div className="flex gap-6 items-center">
                  <div className="w-24 h-24 rounded-2xl bg-surface-muted border-2 border-dashed border-border/60 flex items-center justify-center text-text-muted hover:bg-surface-hover hover:border-primary/40 transition-colors cursor-pointer shrink-0">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div className="space-y-3">
                    <button className="px-4 py-2 border border-border/60 rounded-lg text-sm font-bold text-text-primary hover:bg-surface-hover transition-colors">Fazer Upload Logo</button>
                    <p className="text-xs text-text-muted max-w-sm">Recomendado formato quadrado, fundo transparente, max 2MB (SVG ou PNG).</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/50 pt-8">
                <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div>
                    <h4 className="font-bold text-danger flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Zona de Perigo</h4>
                    <p className="text-xs text-danger/80 mt-1">Excluir tenant apagará todos os membros, dados de engajamento e histórico.</p>
                  </div>
                  <button className="px-4 py-2 bg-danger text-white font-bold text-sm rounded-lg shadow-sm hover:bg-danger/90 transition-colors shrink-0">Excluir Workspace</button>
                </div>
              </div>
            </div>
          )}

          {/* Aba: Plano e Assinatura */}
          {activeTab === 'billing' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary to-accent border border-primary/20 text-white relative overflow-hidden shadow-lg shadow-primary/20">
                <div className="absolute top-0 right-0 p-8 opacity-10"><CreditCard className="w-32 h-32" /></div>
                <h3 className="text-xl font-bold mb-1">Pro Campanha<span className="opacity-80">Premium</span></h3>
                <p className="text-sm opacity-80 mb-6">Cobrado anualmente — Próxima renovação em 15/10/2026</p>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">Lideranças</p>
                    <p className="font-bold text-lg">1.250 <span className="text-sm font-normal opacity-70">/ Ilimitado</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">Membros (Time)</p>
                    <p className="font-bold text-lg">14 <span className="text-sm font-normal opacity-70">/ 50</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">Comitês</p>
                    <p className="font-bold text-lg">5 <span className="text-sm font-normal opacity-70">/ 10</span></p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">Armazenamento HD</p>
                    <p className="font-bold text-lg">15GB <span className="text-sm font-normal opacity-70">/ 100GB</span></p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-white text-primary font-bold text-sm rounded-lg shadow-sm hover:bg-white/90 transition-colors">Fazer Upgrade do Plano</button>
                  <button className="px-4 py-2 border border-white/30 font-bold text-sm rounded-lg hover:bg-white/10 transition-colors">Métodos de Pagamento</button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-text-primary mb-4">Histórico de Faturas</h3>
                <div className="overflow-x-auto border border-border/50 rounded-xl">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-lowest border-b border-border/50 text-left">
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted">Data</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted">Descrição</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted">Valor</th>
                        <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-muted">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30 text-sm">
                      <tr className="hover:bg-surface-hover/30">
                        <td className="px-4 py-3 text-text-secondary">15/10/2025</td>
                        <td className="px-4 py-3 font-medium text-text-primary">Anuidade Premium 2025-2026</td>
                        <td className="px-4 py-3 text-text-primary font-mono">R$ 4.990,00</td>
                        <td className="px-4 py-3"><span className="badge badge-success">Pago</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Aba: RBAC */}
          {activeTab === 'rbac' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center pb-4 border-b border-border/50">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Papéis Restritos e Perfis</h3>
                  <p className="text-sm text-text-secondary">Controle quem pode acessar editar, e deletar informações vitais.</p>
                </div>
                <button className="px-4 py-2 border border-border/60 rounded-lg text-sm font-bold text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Novo Perfil
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Administrador Global', users: 2, desc: 'Acesso completo a todas as funções e exclusão de tenant.', badge: 'badge-danger' },
                  { name: 'Coordenador de Campanha', users: 5, desc: 'Pode gerenciar CRM, lideranças, caixa e ações.', badge: 'badge-accent' },
                  { name: 'Líder de Equipe', users: 8, desc: 'Acesso limitado à sua equipe e ações da base delegada.', badge: 'badge-info' },
                  { name: 'Visualizador (Somente Leitura)', users: 15, desc: 'Acesso a relatórios e visualização de painéis.', badge: 'badge-neutral' }
                ].map((role) => (
                  <div key={role.name} className="p-5 border border-border/50 rounded-xl bg-surface-lowest hover:border-primary/30 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-text-primary group-hover:text-primary transition-colors">{role.name}</h4>
                      <span className="text-[10px] font-bold text-text-muted bg-surface-muted px-2 py-0.5 rounded">{role.users} usrs</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{role.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Demais Abas para ilustrar que são stubbed out mas interativas */}
          {(activeTab === 'integrations' || activeTab === 'notifications') && (
            <div className="h-64 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300">
              <Webhook className="w-12 h-12 text-border mb-4" />
              <h3 className="font-bold text-text-primary text-lg">Módulo em Integração</h3>
              <p className="text-sm text-text-muted max-w-sm mt-1">Conexões nativas com CRM, WhatsApp Business API e Google Calendar serão liberadas em breve.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
