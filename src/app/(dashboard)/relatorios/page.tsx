'use client';

import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  MapPin, 
  Download, 
  Filter, 
  ChevronDown,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock Data
const SUMMARY_STATS = [
  { id: 1, title: 'Total de Engajamento', value: '45.2K', change: '+12%', isPositive: true, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
  { id: 2, title: 'Eventos Realizados', value: '128', change: '+5%', isPositive: true, icon: Calendar, color: 'text-secondary', bg: 'bg-secondary/10' },
  { id: 3, title: 'Alcance Digital', value: '1.2M', change: '+24%', isPositive: true, icon: Activity, color: 'text-accent', bg: 'bg-accent/10' },
  { id: 4, title: 'Rejeição Estimada', value: '14%', change: '-2%', isPositive: true, icon: TrendingUp, color: 'text-warning', bg: 'bg-warning/10' }
];

const RECENT_REPORTS = [
  { id: 'REP-001', name: 'Desempenho por Zona Eleitoral', date: '02 Abr 2026', type: 'Geográfico', status: 'Gerado' },
  { id: 'REP-002', name: 'Engajamento em Redes Sociais', date: '01 Abr 2026', type: 'Marketing', status: 'Gerado' },
  { id: 'REP-003', name: 'Análise de Sentimento Público', date: '28 Mar 2026', type: 'IA / Sentimento', status: 'Gerado' },
  { id: 'REP-004', name: 'Relatório Financeiro Parcial', date: '25 Mar 2026', type: 'Financeiro', status: 'Pendente' },
];

export default function RelatoriosPage() {
  const [period, setPeriod] = useState('Últimos 30 dias');
  
  return (
    <div className="h-full flex flex-col pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shrink-0">
        <div>
          <h2 className="text-3xl font-extrabold font-headline text-primary tracking-tight">Relatórios & Análises</h2>
          <p className="text-text-secondary text-sm mt-1">Métricas de campanha, alcance e inteligência eleitoral</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex items-center justify-center flex-1 sm:flex-none gap-2 px-4 py-2 bg-surface-card border border-border/50 rounded-xl text-sm font-medium hover:bg-surface-hover transition-colors shadow-sm">
            <Filter className="w-4 h-4 text-text-muted" />
            <span className="hidden sm:inline">Filtrar</span>
          </button>
          <div className="relative flex-1 sm:flex-none">
            <button className="flex items-center justify-center w-full gap-2 px-4 py-2 bg-surface-card border border-border/50 rounded-xl text-sm font-medium hover:bg-surface-hover transition-colors shadow-sm">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{period}</span>
              <ChevronDown className="w-4 h-4 text-text-muted" />
            </button>
          </div>
          <button className="gradient-primary text-white font-bold text-sm px-4 py-2 rounded-xl shadow shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 shrink-0">
        {SUMMARY_STATS.map((stat) => (
          <div key={stat.id} className="bg-surface-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-gradient-to-br from-transparent to-surface-muted/50 rounded-full blur-2xl group-hover:bg-primary/5 transition-colors"></div>
            
            <div className="flex justify-between items-start mb-4 relative">
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon className={cn("w-6 h-6", stat.color)} />
              </div>
              <div className={cn("flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full", 
                stat.isPositive ? "text-success bg-success/10" : "text-danger bg-danger/10"
              )}>
                {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </div>
            </div>
            
            <div className="relative">
              <h3 className="text-3xl font-headline font-extrabold text-text-primary mb-1">{stat.value}</h3>
              <p className="text-sm font-medium text-text-secondary">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* Charts Section */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface-card rounded-2xl p-6 border border-border/50 shadow-sm flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                Desempenho Geral / Engajamento
              </h3>
              <select className="text-xs font-medium bg-surface-muted border-none text-text-secondary rounded-lg px-2 py-1.5 outline-none cursor-pointer">
                <option>Últimos 6 meses</option>
                <option>Este ano</option>
              </select>
            </div>
            
            {/* Visual CSS Bar Chart Mock */}
            <div className="h-64 flex items-end justify-between gap-2 overflow-hidden px-2 pb-2">
              {[40, 55, 45, 70, 65, 85, 100].map((height, i) => (
                <div key={i} className="w-full flex flex-col justify-end items-center group">
                  <div className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-primary mb-2 transition-opacity">{height}%</div>
                  <div 
                    className={cn(
                      "w-full max-w-[48px] rounded-t-lg transition-all duration-500 hover:opacity-80 bg-gradient-to-t",
                      i === 6 ? "from-accent to-accent/70 shadow-[0_0_15px_rgba(var(--accent),0.3)]" : "from-primary/60 to-primary/40"
                    )}
                    style={{ height: `${height}%` }}
                  ></div>
                  <div className="w-full text-center text-xs font-bold text-text-muted mt-3 hidden sm:block">
                    {['Out', 'Nov', 'Dez', 'Jan', 'Fev', 'Mar', 'Abr'][i]}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-surface-card rounded-2xl p-6 border border-border/50 shadow-sm">
              <h3 className="font-bold text-text-primary mb-5 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Zonas de Maior Impacto
              </h3>
              <div className="space-y-5">
                {[
                  { region: 'Centro Expandido', value: 85, color: 'bg-primary' },
                  { region: 'Zona Sul - Periferia', value: 65, color: 'bg-secondary' },
                  { region: 'Zona Leste', value: 45, color: 'bg-accent' },
                  { region: 'Zona Norte', value: 30, color: 'bg-warning' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm font-bold mb-2">
                      <span className="text-text-secondary">{item.region}</span>
                      <span className="text-text-primary">{item.value}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-surface-muted overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-1000", item.color)} style={{ width: `${item.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-surface-card rounded-2xl p-6 border border-border/50 shadow-sm flex flex-col">
              <h3 className="font-bold text-text-primary mb-6 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-secondary" />
                Demografia da Base
              </h3>
              <div className="flex-1 flex items-center justify-center gap-6">
                {/* Visual Representation of Pie Chart */}
                <div className="relative w-32 h-32 rounded-full border-8 border-primary flex items-center justify-center shrink-0">
                  <div className="absolute inset-[-8px] rounded-full border-8 border-secondary" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 50% 100%)' }}></div>
                  <div className="absolute inset-[-8px] rounded-full border-8 border-accent" style={{ clipPath: 'polygon(50% 50%, 0 0, 50% 0)' }}></div>
                  <div className="text-center z-10 bg-surface-card w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-inner">
                    <p className="text-[10px] font-bold text-text-muted uppercase">Total</p>
                    <p className="font-extrabold font-headline text-lg text-primary">24k</p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-text-secondary"><span className="w-3 h-3 rounded-full bg-primary"></span>Jovens (16-24)</div>
                  <div className="flex items-center gap-2 text-xs font-bold text-text-secondary"><span className="w-3 h-3 rounded-full bg-secondary"></span>Adultos (25-45)</div>
                  <div className="flex items-center gap-2 text-xs font-bold text-text-secondary"><span className="w-3 h-3 rounded-full bg-accent"></span>Sênior (45+)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Reports / Side Panel */}
        <div className="lg:col-span-1 bg-surface-card rounded-2xl p-6 border border-border/50 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-text-secondary" />
              Arquivos de Relatórios
            </h3>
            <button className="text-xs font-bold text-primary hover:underline">Ver todos</button>
          </div>
          
          <div className="space-y-4 flex-1">
            {RECENT_REPORTS.map((report) => (
              <div key={report.id} className="p-4 rounded-xl border border-border/40 hover:border-primary/30 bg-surface-lowest hover:bg-surface-hover transition-all group flex items-start gap-4">
                <div className="p-2 bg-surface-muted rounded-lg group-hover:bg-primary/10 transition-colors shrink-0">
                  <FileText className="w-5 h-5 text-text-secondary group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">{report.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-muted text-text-secondary">{report.type}</span>
                    <span className="text-xs text-text-muted opacity-50">•</span>
                    <span className="text-[10px] font-medium text-text-muted">{report.date}</span>
                  </div>
                </div>
                <button className="p-2 text-text-muted hover:text-accent transition-colors opacity-0 group-hover:opacity-100 shrink-0" title="Baixar PDF">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 py-3.5 border-2 border-dashed border-border/60 rounded-xl text-sm font-bold text-text-secondary hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 group">
            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
            Modo Personalizado
          </button>
        </div>
      </div>
    </div>
  );
}
