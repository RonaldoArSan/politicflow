'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { TopBar } from '@/components/layout/topbar';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const ROUTE_TITLES: Record<string, { title: string; breadcrumbs: { label: string }[] }> = {
  '/dashboard': { title: 'Dashboard', breadcrumbs: [{ label: 'Início' }, { label: 'Dashboard' }] },
  '/agenda': { title: 'Agenda', breadcrumbs: [{ label: 'Início' }, { label: 'Agenda' }] },
  '/acoes': { title: 'Ações Políticas', breadcrumbs: [{ label: 'Início' }, { label: 'Ações' }] },
  '/comites': { title: 'Comitês', breadcrumbs: [{ label: 'Início' }, { label: 'Comitês' }] },
  '/equipes': { title: 'Equipes', breadcrumbs: [{ label: 'Início' }, { label: 'Equipes' }] },
  '/assessores': { title: 'Assessores', breadcrumbs: [{ label: 'Início' }, { label: 'Assessores' }] },
  '/liderancas': { title: 'Lideranças', breadcrumbs: [{ label: 'Início' }, { label: 'Lideranças' }] },
  '/crm': { title: 'CRM Político', breadcrumbs: [{ label: 'Início' }, { label: 'CRM' }] },
  '/demandas': { title: 'Demandas', breadcrumbs: [{ label: 'Início' }, { label: 'Demandas' }] },
  '/tarefas': { title: 'Tarefas', breadcrumbs: [{ label: 'Início' }, { label: 'Tarefas' }] },
  '/configuracoes': { title: 'Configurações', breadcrumbs: [{ label: 'Início' }, { label: 'Configurações' }] },
  '/auditoria': { title: 'Auditoria', breadcrumbs: [{ label: 'Início' }, { label: 'Auditoria' }] },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-accent animate-pulse" />
          <p className="text-text-muted text-sm font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const routeInfo = ROUTE_TITLES[pathname || ''];

  return (
    <div className="min-h-screen bg-surface flex">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen transition-all duration-300">
        <TopBar
          title={routeInfo?.title}
          breadcrumbs={routeInfo?.breadcrumbs}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <div className="p-4 lg:p-8 flex-1 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
