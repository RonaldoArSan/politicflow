'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, CheckCircle2, AlertCircle,
  Trash2, Check, ExternalLink,
  Info, CheckCircle, AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';

type NotificationType = 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'REMINDER';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: string;
  isRead: boolean;
  createdAt: string;
  sentAt?: string | null;
  link?: string;
  actor?: string;
  data?: Record<string, unknown> | null;
}

const ICONS: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  INFO: { icon: Info, color: 'text-accent', bg: 'bg-accent/10' },
  WARNING: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  SUCCESS: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  ERROR: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/10' },
  REMINDER: { icon: Bell, color: 'text-info', bg: 'bg-info/10' },
};

function formatTimeAgo(dateString?: string | null) {
  if (!dateString) return 'Agora';
  const date = new Date(dateString);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(diff / 1000 / 60 / 60);

  if (minutes < 1) return 'Agora';
  if (minutes < 60) return `Há ${minutes} min`;
  if (hours < 24) return `Há ${hours} h`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function NotificacoesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data, error, isLoading, mutate, request } = useApi<Notification[]>(!authLoading && isAuthenticated ? '/api/notifications' : null);
  const notifications = data ?? [];
  const [activeTab, setActiveTab] = React.useState<'ALL' | 'UNREAD'>('ALL');

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const loadNotifications = async () => {
    await mutate();
  };

  const markAllAsRead = async () => {
    const result = await request('/api/notifications', {
      method: 'PATCH',
      body: { action: 'markAllRead' },
    });

    if (result?.success) {
      await loadNotifications();
    }
  };

  const markAsRead = async (id: string) => {
    const result = await request(`/api/notifications/${id}`, {
      method: 'PATCH',
      body: { action: 'markRead' },
    });

    if (result?.success) {
      await loadNotifications();
    }
  };

  const deleteNotification = async (id: string, event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const result = await request(`/api/notifications/${id}`, {
      method: 'DELETE',
    });

    if (result?.success) {
      await loadNotifications();
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'UNREAD') {
      return !notification.isRead;
    }
    return true;
  });

  return (
    <div className="h-full flex flex-col pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold font-headline text-primary tracking-tight">Notificações</h2>
          <p className="text-text-secondary text-sm mt-1">Acompanhe atualizações, alertas e as novidades da equipe.</p>
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
        <div className="flex border-b border-border/50">
          <button
            onClick={() => setActiveTab('ALL')}
            className={cn(
              'flex-1 relative py-4 text-sm font-bold transition-colors outline-none',
              activeTab === 'ALL' ? 'text-primary' : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover/30'
            )}
          >
            Todas as Notificações
            {activeTab === 'ALL' && <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary" />}
          </button>
          <button
            onClick={() => setActiveTab('UNREAD')}
            className={cn(
              'flex-1 relative py-4 text-sm font-bold transition-colors outline-none flex items-center justify-center gap-2',
              activeTab === 'UNREAD' ? 'text-primary' : 'text-text-muted hover:text-text-secondary hover:bg-surface-hover/30'
            )}
          >
            Não Lidas
            {unreadCount > 0 && (
              <span className="bg-danger text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">{unreadCount}</span>
            )}
            {activeTab === 'UNREAD' && <div className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary" />}
          </button>
        </div>

        <div className="flex flex-col divide-y divide-border/30 overflow-y-auto custom-scrollbar" style={{ maxHeight: 800 }}>
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <Bell className="w-12 h-12 text-border mb-4 opacity-50" />
              <h3 className="font-bold text-text-primary mb-1">Carregando notificações...</h3>
            </div>
          ) : error ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 text-danger mb-4" />
              <h3 className="font-bold text-text-primary mb-1">Erro ao carregar notificações</h3>
              <p className="text-sm text-text-secondary">{error}</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <Bell className="w-12 h-12 text-border mb-4 opacity-50" />
              <h3 className="font-bold text-text-primary mb-1">Nenhuma notificação</h3>
              <p className="text-sm text-text-secondary">Você está atualizado. Não há novos alertas.</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const config = ICONS[notification.type] || ICONS.INFO;
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    'p-5 flex items-start gap-4 transition-colors relative group',
                    notification.isRead ? 'bg-transparent opacity-75 hover:opacity-100' : 'bg-primary/2 hover:bg-primary/4',
                    notification.link && 'cursor-pointer'
                  )}
                >
                  {!notification.isRead && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                  )}

                  <div className="shrink-0 relative mt-1">
                    {notification.actor ? (
                      <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center text-xs font-bold text-text-secondary border border-border/50">
                        {notification.actor}
                      </div>
                    ) : (
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', config.bg, config.color)}>
                        <config.icon className="w-5 h-5" />
                      </div>
                    )}
                    {notification.actor && (
                      <div className={cn('absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-surface-card flex items-center justify-center', config.bg, config.color)}>
                        <config.icon className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-12">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={cn('font-bold text-sm', notification.isRead ? 'text-text-primary' : 'text-primary')}>
                        {notification.title}
                      </h4>
                      <span className="text-[10px] text-text-muted font-medium whitespace-nowrap pt-0.5">
                        {formatTimeAgo(notification.sentAt ?? notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed mb-2">{notification.message}</p>

                    {notification.link && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent hover:underline">
                        Acessar link <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.isRead && (
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          void markAsRead(notification.id);
                        }}
                        className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success/10 transition-colors tooltip"
                        title="Marcar como lido"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(event) => void deleteNotification(notification.id, event)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors tooltip"
                      title="Remover"
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
