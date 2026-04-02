'use client';

import React, { useState } from 'react';
import {
  Bell, CheckCircle2, MessageSquare, AlertCircle, FileText,
  UserPlus, Calendar, MoreVertical, Trash2, Check, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Constantes e Mock
type NotifType = 'MENTION' | 'SYSTEM' | 'EVENT' | 'DOC' | 'REMINDER';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  link?: string;
  actor?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'MENTION', title: 'Você foi mencionado', message: 'Carlos Mendes mencionou você na Demanda #45: "Precismos avaliar urgente essa rua esburacada."', time: 'Há 5 minutos', isRead: false, actor: 'CM', link: '/demandas/45' },
  { id: '2', type: 'SYSTEM', title: 'Alerta de Faturamento', message: 'Fatura da assinatura Pro CampanhaPremium do mês atual processada com sucesso.', time: 'Há 1 hora', isRead: false },
  { id: '3', type: 'EVENT', title: 'Mudança de Agenda', message: 'O Comício Central teve a data alterada para 12/04/2026 às 19:00.', time: 'Há 3 horas', isRead: false, actor: 'SA' },
  { id: '4', type: 'DOC', title: 'Relatório Finalizado', message: 'Seu relatório de "Análise de Sentimento Público" foi gerado e está pronto para download.', time: 'Ontem', isRead: true },
  { id: '5', type: 'USER_PLUS' as NotifType, title: 'Novo Membro', message: 'Ana Costa aceitou o convite e agora faz parte da Equipe Jurídica.', time: 'Ontem', isRead: true, actor: 'AC' },
  { id: '6', type: 'REMINDER', title: 'Tarefa Atrasada', message: 'A tarefa "Confirmar local do comício" expirou hoje às 10:00.', time: 'Há 2 dias', isRead: true },
];

const ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  MENTION: { icon: MessageSquare, color: 'text-accent', bg: 'bg-accent/10' },
  SYSTEM: { icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10' },
  EVENT: { icon: Calendar, color: 'text-info', bg: 'bg-info/10' },
  DOC: { icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
  REMINDER: { icon: Bell, color: 'text-danger', bg: 'bg-danger/10' },
  USER_PLUS: { icon: UserPlus, color: 'text-success', bg: 'bg-success/10' },
};

export default function NotificacoesPage() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filtered = notifications.filter(n => {
    if (activeTab === 'UNREAD') return !n.isRead;
    return true;
  });

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="h-full flex flex-col pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold font-headline text-primary tracking-tight">Notificações</h2>
          <p className="text-text-secondary text-sm mt-1">Acompanhe atualizações, alertas e as novidades da equipe</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-surface-lowest text-text-secondary hover:text-primary hover:bg-primary/5 rounded-xl border border-border/50 text-sm font-bold transition-all shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" /> Marcar tudo como lido
          </button>
        )}
      </div>

      <div className="bg-surface-card border border-border/50 rounded-2xl shadow-sm flex flex-col max-w-4xl w-full mx-auto overflow-hidden">

        {/* Tabs */}
        <div className="flex border-b border-border/50">
          <button
            onClick={() => setActiveTab('ALL')}
            className={cn(
              "flex-1 relative py-4 text-sm font-bold transition-colors outline-none",
              activeTab === 'ALL' ? "text-primary" : "text-text-muted hover:text-text-secondary hover:bg-surface-hover/30"
            )}
          >
            Todas as Notificações
            {activeTab === 'ALL' && <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary" />}
          </button>
          <button
            onClick={() => setActiveTab('UNREAD')}
            className={cn(
              "flex-1 relative py-4 text-sm font-bold transition-colors outline-none flex items-center justify-center gap-2",
              activeTab === 'UNREAD' ? "text-primary" : "text-text-muted hover:text-text-secondary hover:bg-surface-hover/30"
            )}
          >
            Não Lidas
            {unreadCount > 0 && (
              <span className="bg-danger text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">{unreadCount}</span>
            )}
            {activeTab === 'UNREAD' && <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary" />}
          </button>
        </div>

        {/* List */}
        <div className="flex flex-col divide-y divide-border/30 max-h-[800px] overflow-y-auto custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <Bell className="w-12 h-12 text-border mb-4 opacity-50" />
              <h3 className="font-bold text-text-primary mb-1">Nenhuma notificação</h3>
              <p className="text-sm text-text-secondary">Você está atualizado. Não há novos alertas.</p>
            </div>
          ) : (
            filtered.map(notif => {
              const conf = ICONS[notif.type] || ICONS.SYSTEM;
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.isRead && markAsRead(notif.id)}
                  className={cn(
                    "p-5 flex items-start gap-4 transition-colors relative group",
                    notif.isRead ? "bg-transparent opacity-75 hover:opacity-100" : "bg-primary/[0.02] hover:bg-primary/[0.04]",
                    notif.link && "cursor-pointer"
                  )}
                >
                  {/* Unread dot */}
                  {!notif.isRead && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}

                  {/* Icon or Avatar */}
                  <div className="shrink-0 relative mt-1">
                    {notif.actor ? (
                      <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center text-xs font-bold text-text-secondary border border-border/50">
                        {notif.actor}
                      </div>
                    ) : (
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", conf.bg, conf.color)}>
                        <conf.icon className="w-5 h-5" />
                      </div>
                    )}
                    {/* Tiny badge if avatar present */}
                    {notif.actor && (
                      <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-surface-card flex items-center justify-center", conf.bg, conf.color)}>
                        <conf.icon className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={cn("font-bold text-sm", notif.isRead ? "text-text-primary" : "text-primary")}>
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-text-muted font-medium whitespace-nowrap pt-0.5">{notif.time}</span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed mb-2">{notif.message}</p>

                    {notif.link && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent hover:underline">
                        Acessar link <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Actions hover */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                        className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success/10 transition-colors tooltip" title="Marcar como lido"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => deleteNotification(notif.id, e)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors tooltip" title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
