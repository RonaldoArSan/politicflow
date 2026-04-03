'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Calendar, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'Mês' | 'Semana' | 'Dia'>('Mês');

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Pad the start with days from previous month
  const prevMonthDays = getDaysInMonth(currentYear, currentMonth - 1);
  const days = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, isCurrentMonth: true });
  }

  // Pad the end with days from next month
  // If we have more than 35 days (e.g., month starts on Saturday), we need 42 cells
  const totalCells = days.length > 35 ? 42 : 35;
  const endPadding = totalCells - days.length;

  for (let i = 1; i <= endPadding; i++) {
    days.push({ day: i, isCurrentMonth: false });
  }

  const today = new Date();
  const isCurrentMonthView = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

  return (
    <div className="h-full px-4 sm:px-0">
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-text-muted mb-2">
          <span>Pro Campanha</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-accent font-bold">Agenda</span>
        </nav>
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div>
            <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-text-primary tracking-tight">Agenda do Candidato</h2>
            <p className="text-text-secondary font-body mt-1 opacity-70">Planejamento estratégico e compromissos institucionais.</p>
          </div>
          <div className="flex items-center gap-4 bg-surface-hover p-1.5 rounded-xl border border-border/50">
            <div className="flex border-r border-border pr-3 mr-1">
              <button onClick={handlePrevMonth} className="p-2 hover:bg-surface-muted rounded-lg transition-colors"><ChevronLeft className="w-4 h-4 text-text-secondary" /></button>
              <button className="px-4 font-bold text-text-primary text-sm min-w-[140px]">{monthNames[currentMonth]} {currentYear}</button>
              <button onClick={handleNextMonth} className="p-2 hover:bg-surface-muted rounded-lg transition-colors"><ChevronRight className="w-4 h-4 text-text-secondary" /></button>
            </div>
            <div className="flex gap-1">
              {(['Mês', 'Semana', 'Dia'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                    viewMode === mode
                      ? "bg-surface-card shadow-sm text-accent ring-1 ring-border/50"
                      : "hover:bg-surface-muted text-text-secondary"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 items-start">
        {/* Left Sidebar */}
        <aside className="w-full xl:w-72 flex-shrink-0 space-y-8">
          <div className="bg-surface-card p-6 rounded-2xl shadow-sm border border-border/60">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-sm text-text-primary">{monthNames[currentMonth]} {currentYear}</span>
              <div className="flex gap-2 text-text-secondary">
                <ChevronLeft className="w-4 h-4 cursor-pointer hover:text-accent transition-colors" onClick={handlePrevMonth} />
                <ChevronRight className="w-4 h-4 cursor-pointer hover:text-accent transition-colors" onClick={handleNextMonth} />
              </div>
            </div>
            <div className="grid grid-cols-7 text-center text-[10px] text-text-muted font-bold mb-4">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, index) => <span key={index}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-y-3 text-center text-xs">
              {days.map((d, i) => {
                const isToday = isCurrentMonthView && d.isCurrentMonth && d.day === today.getDate();
                return (
                  <span key={i} className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-xl mx-auto cursor-pointer transition-all",
                    !d.isCurrentMonth ? "text-text-muted/30" : "font-medium hover:bg-surface-hover text-text-primary",
                    isToday && "bg-accent text-white font-bold shadow-md shadow-accent/20"
                  )}>
                    {d.day}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="bg-surface-hover/50 p-6 rounded-2xl space-y-4 border border-border/40">
            <h4 className="font-bold text-[10px] uppercase tracking-widest text-text-muted">Categorias</h4>
            <ul className="space-y-3">
              {[
                { label: 'Eventos Institucionais', color: 'bg-primary', checked: true },
                { label: 'Atos de Campanha', color: 'bg-secondary', checked: true },
                { label: 'Viagens e Logística', color: 'bg-text-muted', checked: false },
                { label: 'Gravações e Mídia', color: 'bg-text-muted', checked: false },
              ].map((cat, i) => (
                <li key={i} className="flex items-center gap-3 cursor-pointer group">
                  <div className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                    cat.checked ? `${cat.color} border-transparent` : "border-border bg-surface-card"
                  )}>
                    {cat.checked && <Check className="w-3 h-3 text-white stroke-[4px]" />}
                  </div>
                  <span className={cn("text-xs font-semibold transition-colors", cat.checked ? "text-text-primary" : "text-text-muted")}>
                    {cat.label}
                  </span>
                  {cat.checked && <span className={cn("ml-auto w-1.5 h-1.5 rounded-full", cat.color)} />}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-2xl gradient-primary text-white p-6 shadow-xl">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Calendar className="w-32 h-32" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Próximo Compromisso</span>
            <h5 className="text-xl font-headline font-bold mt-2">Comício Central</h5>
            <p className="text-xs mt-1 opacity-80">Praça da Sé • 19:00</p>
            <div className="mt-6 flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2].map(i => (
                  <img key={i} className="w-6 h-6 rounded-full border border-white/20 object-cover" src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="avatar" />
                ))}
              </div>
              <span className="text-[10px] font-medium opacity-70">+4 assessores</span>
            </div>
          </div>
        </aside>

        {/* Calendar Grid & Other Views */}
        <div className="flex-1 bg-surface-card rounded-2xl overflow-hidden shadow-sm border border-border/80">

          {viewMode === 'Mês' && (
            <>
              <div className="grid grid-cols-7 border-b border-border bg-surface-hover/30 text-center">
                {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((d, index) => (
                  <div key={index} className="py-4 font-bold text-[10px] uppercase text-text-muted tracking-tighter sm:tracking-normal">{d}</div>
                ))}
              </div>
              <div className={cn(
                "grid grid-cols-7 divide-x divide-y divide-border min-h-[700px]",
                days.length > 35 ? "grid-rows-6" : "grid-rows-5"
              )}>
                {days.map((d, i) => {
                  const isToday = isCurrentMonthView && d.isCurrentMonth && d.day === today.getDate();

                  // Simple mock events linked correctly to specific dates
                  const hasMockEvent1 = isCurrentMonthView && d.isCurrentMonth && d.day === 1;
                  const hasMockEvent4 = isCurrentMonthView && d.isCurrentMonth && d.day === 4;
                  const hasMockEvent12 = isCurrentMonthView && d.isCurrentMonth && d.day === 12;
                  const hasMockEvent20 = isCurrentMonthView && d.isCurrentMonth && d.day === 20;

                  return (
                    <div key={i} className={cn(
                      "p-1.5 flex flex-col items-end transition-colors min-h-[120px] lg:min-h-0",
                      !d.isCurrentMonth && "bg-surface-muted/10 opacity-30"
                    )}>
                      <span className={cn(
                        "text-xs font-bold mb-2 w-7 h-7 flex items-center justify-center rounded-xl",
                        isToday ? "bg-accent text-white shadow-md shadow-accent/20" : "text-text-secondary"
                      )}>
                        {d.day}
                      </span>

                      {hasMockEvent1 && (
                        <div className="w-full bg-primary/10 border-l-2 border-primary p-2 rounded-r mb-1">
                          <p className="text-[10px] font-bold text-text-primary leading-tight truncate">Almoço Federativo</p>
                        </div>
                      )}
                      {hasMockEvent4 && (
                        <>
                          <div className="w-full bg-secondary/10 border-l-2 border-secondary p-2 rounded-r mb-1">
                            <p className="text-[10px] font-bold text-text-primary leading-tight truncate">Caminhada Bairro Azul</p>
                          </div>
                          <div className="w-full bg-primary/10 border-l-2 border-primary p-2 rounded-r">
                            <p className="text-[10px] font-bold text-text-primary leading-tight truncate">Entrevista TV</p>
                          </div>
                        </>
                      )}
                      {hasMockEvent12 && (
                        <div className="w-full bg-secondary text-white p-2 rounded-xl shadow-sm mb-1">
                          <p className="text-[10px] font-bold leading-tight">Grande Comício Sul</p>
                          <p className="text-[8px] opacity-80">18:30 - 22:00</p>
                        </div>
                      )}
                      {hasMockEvent20 && (
                        <div className="w-full bg-primary text-white p-2 rounded-xl shadow-sm">
                          <p className="text-[10px] font-bold leading-tight">Debate Televisivo</p>
                          <p className="text-[8px] opacity-80">21:00 - 23:30</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {viewMode === 'Semana' && (
            <div className="min-h-[700px] flex flex-col items-center justify-center text-center p-8 bg-surface-muted/5">
              <Calendar className="w-16 h-16 text-text-muted mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-text-primary">Visão Semanal em Construção</h3>
              <p className="text-text-secondary max-w-md mt-2">A visualização detalhada por semana será liberada com integração aos dados reais da agenda.</p>
            </div>
          )}

          {viewMode === 'Dia' && (
            <div className="min-h-[700px] flex flex-col items-center justify-center text-center p-8 bg-surface-muted/5">
              <Calendar className="w-16 h-16 text-text-muted mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-text-primary">Visão Diária em Construção</h3>
              <p className="text-text-secondary max-w-md mt-2">A agenda detalhada hora a hora estará disponível num futuro próximo com sistema de marcação e arrasto.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
