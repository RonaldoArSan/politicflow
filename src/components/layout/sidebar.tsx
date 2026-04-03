'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, Zap, Users2, Users,
  Mic2, Star, Contact2, AlertCircle, ClipboardList,
  Settings, LogOut, Landmark, ChevronLeft, ChevronRight,
  Shield, BarChart3, Bell,  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const mainNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: CalendarDays, label: 'Agenda', path: '/agenda' },
  { icon: Zap, label: 'Ações', path: '/acoes' },
  { icon: Users2, label: 'Comitês', path: '/comites' },
  { icon: Users, label: 'Equipes', path: '/equipes' },
  { icon: Mic2, label: 'Assessores', path: '/assessores' },
  { icon: Star, label: 'Lideranças', path: '/liderancas' },
  { icon: Contact2, label: 'CRM Político', path: '/crm' },
  { icon: AlertCircle, label: 'Demandas', path: '/demandas' },
  { icon: ClipboardList, label: 'Tarefas', path: '/tarefas' },
];

const bottomNavItems = [
  { icon: BarChart3, label: 'Relatórios', path: '/relatorios' },
  { icon: Bell, label: 'Notificações', path: '/notificacoes' },
  { icon: Shield, label: 'Auditoria', path: '/auditoria' },
  { icon: Settings, label: 'Configurações', path: '/configuracoes' },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-surface-card border-r border-border/50 flex flex-col z-50 transition-all duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand */}
        <div className={cn(
          "flex items-center gap-3 px-4 h-16 border-b border-border/50 shrink-0",
          isCollapsed && "justify-center px-0"
        )}>
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-white shrink-0">
            <Landmark className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-base font-extrabold text-primary font-headline tracking-tight leading-none">
                PoliticFlow
              </h1>
              <p className="text-[9px] uppercase tracking-[0.2em] text-text-muted font-semibold">
                Gestão Política
              </p>
            </div>
          )}
          
          {/* Close button mobile */}
          <button
            onClick={onToggle}
            className="ml-auto lg:hidden p-1 rounded-lg hover:bg-surface-hover text-text-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-3 px-2">
          <div className={cn("space-y-0.5", !isCollapsed && "px-1")}>
            {mainNavItems.map((item) => {
              const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg transition-all duration-200 ease-in-out font-medium text-sm group relative",
                    isCollapsed ? "justify-center p-2.5 mx-auto w-11 h-11" : "px-3 py-2.5",
                    isActive
                      ? "bg-accent/10 text-accent font-bold"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-accent" />
                  )}
                  <item.icon className={cn(
                    "w-[18px] h-[18px] shrink-0",
                    isActive && "text-accent"
                  )} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  
                  {/* Tooltip for collapsed */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-primary text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className={cn("my-4 mx-2", isCollapsed ? "border-t border-border/50" : "border-t border-border/30")} />

          {/* Bottom nav items */}
          <div className={cn("space-y-0.5", !isCollapsed && "px-1")}>
            {bottomNavItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg transition-all duration-200 font-medium text-sm group relative",
                    isCollapsed ? "justify-center p-2.5 mx-auto w-11 h-11" : "px-3 py-2.5",
                    isActive
                      ? "bg-accent/10 text-accent font-bold"
                      : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                  )}
                >
                  <item.icon className="w-[18px] h-[18px] shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-primary text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex items-center justify-center h-8 border-t border-border/50 text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* User card */}
        <div className={cn("border-t border-border/50 p-3", isCollapsed && "px-2")}>
          <div className={cn(
            "flex items-center gap-3 rounded-xl transition-colors",
            !isCollapsed && "p-2 hover:bg-surface-hover"
          )}>
            <div className="w-9 h-9 rounded-full gradient-accent flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('') : 'PF'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">{user?.name || 'Coordenador'}</p>
                <p className="text-[10px] text-text-muted truncate">{user?.tenant?.name || 'Campanha'}</p>
              </div>
            )}
            {!isCollapsed && (
              <button 
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
