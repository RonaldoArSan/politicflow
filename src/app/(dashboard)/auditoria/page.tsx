'use client';

import React, { useState } from 'react';
import { 
  Search, ShieldAlert, ShieldCheck, User, Clock, Monitor, 
  Filter, Download, AlertTriangle, Key, Trash2 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MOCK_AUDIT_LOGS = [
  { id: 'log-1', action: 'USER_LOGIN', module: 'Auth', user: 'Maria Santos', email: 'maria@procampanha.com', timestamp: '2026-04-02 08:15:30', ip: '192.168.1.45', status: 'SUCCESS', severity: 'INFO' },
  { id: 'log-2', action: 'EXPORT_REPORT', module: 'Relatórios', user: 'Pedro Alves', email: 'pedro@procampanha.com', timestamp: '2026-04-02 08:30:12', ip: '172.16.0.8', status: 'SUCCESS', severity: 'WARNING' },
  { id: 'log-3', action: 'DELETE_LEADER', module: 'Lideranças', user: 'João Silva', email: 'joao@procampanha.com', timestamp: '2026-04-01 19:45:00', ip: '10.0.0.5', status: 'SUCCESS', severity: 'CRITICAL' },
  { id: 'log-4', action: 'FAILED_LOGIN', module: 'Auth', user: 'Desconhecido', email: 'admin@procampanha.com', timestamp: '2026-04-01 23:10:05', ip: '185.122.x.x', status: 'FAILED', severity: 'CRITICAL' },
  { id: 'log-5', action: 'UPDATE_ROLE', module: 'RBAC', user: 'Carlos Mendes', email: 'carlos@procampanha.com', timestamp: '2026-04-01 14:20:10', ip: '192.168.1.102', status: 'SUCCESS', severity: 'WARNING' },
  { id: 'log-6', action: 'CREATE_DEMAND', module: 'Demandas', user: 'Ana Lima', email: 'ana@procampanha.com', timestamp: '2026-04-01 09:12:00', ip: '172.16.0.4', status: 'SUCCESS', severity: 'INFO' },
];

const SEVERITY_CONFIG: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  INFO: { label: 'Informativo', class: 'text-info bg-info/10', icon: ShieldCheck },
  WARNING: { label: 'Atenção', class: 'text-warning bg-warning/10', icon: AlertTriangle },
  CRITICAL: { label: 'Crítico', class: 'text-danger bg-danger/10', icon: ShieldAlert },
};

const ACTION_MAP: Record<string, string> = {
  USER_LOGIN: 'Login no Sistema',
  FAILED_LOGIN: 'Falha de Autenticação',
  EXPORT_REPORT: 'Exportação de Dados',
  DELETE_LEADER: 'Exclusão de Registro',
  UPDATE_ROLE: 'Alteração de Permissões',
  CREATE_DEMAND: 'Criação de Registro',
};

export default function AuditoriaPage() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');

  const filtered = MOCK_AUDIT_LOGS.filter(log => {
    const matchSearch = !search || log.user.toLowerCase().includes(search.toLowerCase()) || log.action.toLowerCase().includes(search.toLowerCase());
    const matchSeverity = !severityFilter || log.severity === severityFilter;
    return matchSearch && matchSeverity;
  });

  return (
    <div className="h-full flex flex-col pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold font-headline text-primary tracking-tight">Trilha de Auditoria</h2>
          <p className="text-text-secondary text-sm mt-1">Monitoramento de segurança, acessos e ações críticas no tenant</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-card border border-border/50 rounded-xl text-sm font-medium hover:bg-surface-hover transition-colors shadow-sm flex-1 sm:flex-none">
            <Download className="w-4 h-4 text-text-muted" />
            <span className="hidden sm:inline">Exportar Logs (CSV)</span>
          </button>
        </div>
      </div>

      {/* Security Alerts / Top Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0">
        <div className="bg-surface-card rounded-2xl p-5 border border-border/50 shadow-sm flex items-center justify-between group hover:border-info/30 transition-colors">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Status de Segurança</p>
            <h3 className="text-lg font-bold text-success flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Normal</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success"><ShieldCheck className="w-6 h-6" /></div>
        </div>
        <div className="bg-surface-card rounded-2xl p-5 border border-border/50 shadow-sm flex items-center justify-between group hover:border-danger/30 transition-colors">
          <div>
             <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Tentativas Falhas (24h)</p>
             <h3 className="text-lg font-bold text-danger">3 bloqueadas</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger"><Key className="w-6 h-6" /></div>
        </div>
        <div className="bg-surface-card rounded-2xl p-5 border border-border/50 shadow-sm flex items-center justify-between group hover:border-warning/30 transition-colors">
          <div>
             <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-1">Ações Críticas (24h)</p>
             <h3 className="text-lg font-bold text-warning">2 eventos</h3>
          </div>
          <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center text-warning"><Trash2 className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar por usuário, ação ou módulo..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/30 font-medium transition-all"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2.5 bg-surface-hover rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary/30 cursor-pointer text-text-secondary w-full sm:w-auto"
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
          >
            <option value="">Severidade: Todas</option>
            {Object.keys(SEVERITY_CONFIG).map(s => <option key={s} value={s}>{SEVERITY_CONFIG[s].label}</option>)}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-surface-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
             <thead>
               <tr className="border-b border-border/50 bg-surface-lowest/50">
                 <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Ação</th>
                 <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Módulo</th>
                 <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Usuário / Ator</th>
                 <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Data/Hora & IP</th>
                 <th className="text-left px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">Severidade</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-border/30">
               {filtered.map((log) => {
                 const severityInfo = SEVERITY_CONFIG[log.severity];
                 
                 return (
                   <tr key={log.id} className="hover:bg-surface-hover/30 transition-colors">
                     <td className="px-6 py-4">
                       <span className="font-bold text-sm text-text-primary block">{ACTION_MAP[log.action] || log.action}</span>
                       <span className="text-[10px] text-text-muted font-mono bg-surface-muted px-1.5 py-0.5 rounded mt-1 inline-block">{log.action}</span>
                     </td>
                     <td className="px-6 py-4">
                        <span className="badge badge-neutral">{log.module}</span>
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center text-text-secondary border border-border/50 shrink-0">
                           <User className="w-4 h-4" />
                         </div>
                         <div className="flex flex-col">
                           <span className="text-sm font-bold text-text-primary">{log.user}</span>
                           <span className="text-[10px] text-text-muted">{log.email}</span>
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                           <Clock className="w-3.5 h-3.5" />
                           {log.timestamp}
                         </div>
                         <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-mono">
                           <Monitor className="w-3 h-3" />
                           {log.ip}
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", severityInfo.class)}>
                         <severityInfo.icon className="w-3.5 h-3.5" />
                         {severityInfo.label}
                       </div>
                     </td>
                   </tr>
                 )
               })}
             </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
           <div className="p-12 text-center flex flex-col items-center justify-center flex-1">
             <ShieldAlert className="w-12 h-12 text-border mb-4" />
             <h3 className="font-bold text-text-primary mb-1">Nenhum evento registrado</h3>
             <p className="text-text-muted text-sm max-w-sm">Nenhum log corresponde aos filtros informados. A trilha de auditoria armazena apenas os últimos 90 dias neste plano.</p>
           </div>
        )}
      </div>

    </div>
  );
}
