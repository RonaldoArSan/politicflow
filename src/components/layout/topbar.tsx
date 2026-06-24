'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, Menu, ChevronRight, Check, Trash2, ExternalLink, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';
import { useAuth } from '@/hooks/use-auth';
import { SearchDialog } from '@/components/search/search-dialog';
import { ThemeToggle } from './theme-toggle';
import { useRouter } from 'next/navigation';

interface TopBarProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  onMenuClick: () => void;
}

export function TopBar({ title, breadcrumbs, onMenuClick }: TopBarProps) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: notifications, mutate: mutateNotif, request } = useApi<{
    id: string; type: string; title: string; message: string;
    isRead: boolean; createdAt: string; sentAt?: string | null; link?: string; actor?: string;
  }[]>(!authLoading && isAuthenticated ? '/api/notifications' : null);

  const notifList = notifications ?? [];
  const unreadCount = notifList.filter(n => !n.isRead).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const NOTIF_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    INFO: { icon: Info, color: 'text-accent', bg: 'bg-accent/10' },
    WARNING: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
    SUCCESS: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
    ERROR: { icon: AlertCircle, color: 'text-danger', bg: 'bg-danger/10' },
    REMINDER: { icon: Bell, color: 'text-info', bg: 'bg-info/10' },
  };

  const formatTimeAgo = (d?: string | null) => {
    if (!d) return 'Agora';
    const diff = Date.now() - new Date(d).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    if (m < 1) return 'Agora';
    if (m < 60) return `Há ${m} min`;
    if (h < 24) return `Há ${h}h`;
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const markAsRead = async (id: string) => {
    await request(`/api/notifications/${id}`, { method: 'PATCH', body: { action: 'markRead' } });
    await mutateNotif();
  };

  const markAllRead = async () => {
    await request('/api/notifications', { method: 'PATCH', body: { action: 'markAllRead' } });
    await mutateNotif();
  };

  const deleteNotif = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await request(`/api/notifications/${id}`, { method: 'DELETE' });
    await mutateNotif();
  };

  const handleNotifClick = async (n: typeof notifList[0]) => {
    if (!n.isRead) await markAsRead(n.id);
    if (n.link) { router.push(n.link); setNotifOpen(false); }
  };

  const handleSearchClick = () => {
    setSearchOpen(true);
  };

  return (
    <>
      <header className="h-16 border-b border-border/50 bg-surface-card/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          {/* Mobile menu */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-surface-hover text-text-secondary"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumbs */}
          {breadcrumbs ? (
            <nav className="flex items-center gap-1.5 text-xs font-semibold">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="w-3 h-3 text-text-muted" />}
                  <span className={cn(
                    i === breadcrumbs.length - 1 
                      ? "text-accent font-bold" 
                      : "text-text-muted uppercase tracking-wider"
                  )}>
                    {crumb.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          ) : title ? (
            <h2 className="text-lg font-bold font-headline text-text-primary">{title}</h2>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <button
            onClick={handleSearchClick}
            className="hidden md:flex items-center gap-2 bg-surface-hover rounded-lg px-3 py-2 w-64 group hover:bg-surface-hover/80 transition-all"
          >
            <Search className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
            <span className="text-sm text-text-muted flex-1 text-left">Buscar...</span>
            <kbd className="hidden lg:inline-flex h-5 items-center gap-0.5 rounded border border-border px-1.5 text-[10px] font-medium text-text-muted">
              ⌘K
            </kbd>
          </button>

          {/* Search button for mobile */}
          <button
            onClick={handleSearchClick}
            className="md:hidden p-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen(o => !o)}
              className={cn('relative p-2 rounded-lg hover:bg-surface-hover text-text-secondary transition-colors', notifOpen && 'bg-surface-hover')}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4 rounded-full bg-danger px-1.5 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-surface-card">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-surface-card" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-surface-card border border-border/60 rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-accent" />
                    <span className="font-bold text-sm text-text-primary">Notificações</span>
                    {unreadCount > 0 && (
                      <span className="bg-danger text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-bold text-accent hover:text-accent-dark transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Marcar todas
                    </button>
                  )}
                </div>

                {/* List */}
                <div className="overflow-y-auto custom-scrollbar max-h-[420px] divide-y divide-border/30">
                  {notifList.length === 0 ? (
                    <div className="py-12 flex flex-col items-center text-center gap-2">
                      <Bell className="w-8 h-8 text-border opacity-50" />
                      <p className="text-sm font-medium text-text-muted">Nenhuma notificação</p>
                    </div>
                  ) : (
                    notifList.slice(0, 8).map(n => {
                      const cfg = NOTIF_ICONS[n.type] ?? NOTIF_ICONS.INFO;
                      return (
                        <div
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={cn(
                            'flex items-start gap-3 px-4 py-3 group relative transition-colors',
                            n.isRead ? 'hover:bg-surface-hover/60' : 'bg-primary/[0.02] hover:bg-primary/[0.05]',
                            n.link && 'cursor-pointer'
                          )}
                        >
                          {!n.isRead && (
                            <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent" />
                          )}
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5', cfg.bg, cfg.color)}>
                            <cfg.icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className={cn('text-xs font-bold truncate', n.isRead ? 'text-text-primary' : 'text-primary')}>{n.title}</p>
                              <span className="text-[10px] text-text-muted whitespace-nowrap shrink-0">{formatTimeAgo(n.sentAt ?? n.createdAt)}</span>
                            </div>
                            <p className="text-[11px] text-text-secondary line-clamp-2 mt-0.5">{n.message}</p>
                            {n.link && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-accent mt-1">
                                Ver <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            {!n.isRead && (
                              <button
                                onClick={e => { e.stopPropagation(); void markAsRead(n.id); }}
                                className="p-1 rounded-md text-text-muted hover:text-success hover:bg-success/10 transition-colors"
                                title="Marcar como lido"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={e => void deleteNotif(e, n.id)}
                              className="p-1 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                              title="Remover"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-border/50 px-4 py-2.5">
                  <button
                    onClick={() => { router.push('/notificacoes'); setNotifOpen(false); }}
                    className="w-full text-xs font-bold text-accent hover:text-accent-dark transition-colors text-center py-1"
                  >
                    Ver todas as notificações →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <div className="mx-1">
            <ThemeToggle />
          </div>

          {/* User avatar */}
          <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold ml-1">
            {user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'PF'}
          </div>
        </div>
      </header>

      {/* Search Dialog */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
