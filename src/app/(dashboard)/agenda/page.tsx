'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Loader2, X, AlertCircle, MapPin, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PUBLIC_EVENT:      { label: 'Evento Público',    color: 'bg-accent',   bg: 'bg-accent/10 text-accent'   },
  INTERNAL_MEETING:  { label: 'Reunião Interna',   color: 'bg-primary',  bg: 'bg-primary/10 text-primary' },
  INTERVIEW:         { label: 'Entrevista',        color: 'bg-info',     bg: 'bg-info/10 text-info'       },
  VISIT:             { label: 'Visita',            color: 'bg-success',  bg: 'bg-success/10 text-success' },
  RECORDING:         { label: 'Gravação',          color: 'bg-accent',   bg: 'bg-accent/10 text-accent'   },
  TRAVEL:            { label: 'Viagem',            color: 'bg-warning',  bg: 'bg-warning/10 text-warning' },
  OTHER:             { label: 'Outro',             color: 'bg-text-muted', bg: 'bg-surface-muted text-text-secondary' },
};

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  SCHEDULED:   { label: 'Agendado',    class: 'badge-info'    },
  CONFIRMED:   { label: 'Confirmado',  class: 'badge-success' },
  IN_PROGRESS: { label: 'Em andamento',class: 'badge-warning' },
  COMPLETED:   { label: 'Concluído',   class: 'badge-neutral' },
  CANCELLED:   { label: 'Cancelado',   class: 'badge-danger'  },
  POSTPONED:   { label: 'Adiado',      class: 'badge-accent'  },
};

const inputCls = 'w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20';
const labelCls = 'block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5';

interface Schedule {
  id: string; title: string; type: string; status: string;
  startDate: string; endDate?: string; location?: string;
  responsibleName?: string; description?: string; isPublic: boolean;
}

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function AgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Schedule | null>(null);
  const [form, setForm] = useState({ title: '', type: 'PUBLIC_EVENT', startDate: '', endDate: '', location: '', responsibleName: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch schedules for current month range
  const startOfMonth = new Date(year, month, 1).toISOString();
  const endOfMonth   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data: response, isLoading, error, mutate, request } = useApi<{ items: Schedule[] }>(
    `/api/agenda?startDate=${startOfMonth}&endDate=${endOfMonth}&limit=100`
  );
  const schedules = response?.items ?? [];

  // Calendar grid
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const firstDayWeek = new Date(year, month, 1).getDay();
  const prevDays     = new Date(year, month, 0).getDate();
  const totalCells   = firstDayWeek + daysInMonth > 35 ? 42 : 35;

  const days = [];
  for (let i = firstDayWeek - 1; i >= 0; i--)  days.push({ day: prevDays - i, current: false });
  for (let i = 1; i <= daysInMonth; i++)         days.push({ day: i, current: true });
  for (let i = 1; days.length < totalCells; i++) days.push({ day: i, current: false });

  const today = new Date();

  const eventsForDay = (day: number) =>
    schedules.filter(s => {
      const d = new Date(s.startDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startDate) { setFormError('Título e data de início são obrigatórios.'); return; }
    setSubmitting(true); setFormError('');
    try {
      const body = {
        title: form.title,
        type: form.type,
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        location: form.location || undefined,
        responsibleName: form.responsibleName || undefined,
        description: form.description || undefined,
      };
      const res = await request('/api/agenda', { method: 'POST', body });
      if (!res?.success) throw new Error(res?.error || 'Erro ao salvar');
      setShowForm(false);
      setForm({ title: '', type: 'PUBLIC_EVENT', startDate: '', endDate: '', location: '', responsibleName: '', description: '' });
      mutate();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-headline font-extrabold text-2xl md:text-3xl text-primary tracking-tight">Agenda</h2>
          <p className="text-text-secondary text-sm mt-1">Compromissos e eventos do candidato</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-surface-hover rounded-xl p-1 border border-border/50">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-surface-card rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4 text-text-secondary" />
            </button>
            <span className="px-3 font-bold text-sm text-text-primary min-w-[140px] text-center">{MONTH_NAMES[month]} {year}</span>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-surface-card rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
          <button onClick={() => setShowForm(true)} className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Evento
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /><span className="text-sm">{error}</span>
        </div>
      )}

      {/* Calendar */}
      <div className="card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-border bg-surface-hover/30">
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
            <div key={d} className="py-3 text-center font-bold text-[10px] uppercase text-text-muted tracking-wider">{d}</div>
          ))}
        </div>

        {isLoading ? (
          <div className="h-96 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
        ) : (
          <div className={cn('grid grid-cols-7 divide-x divide-y divide-border', days.length > 35 ? 'grid-rows-6' : 'grid-rows-5')}>
            {days.map((d, i) => {
              const isToday = d.current && today.getFullYear() === year && today.getMonth() === month && today.getDate() === d.day;
              const events  = d.current ? eventsForDay(d.day) : [];
              return (
                <div key={i} className={cn('p-1.5 flex flex-col min-h-[100px] lg:min-h-[120px]', !d.current && 'bg-surface-muted/10 opacity-40')}>
                  <span className={cn('text-xs font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-lg self-end transition-colors',
                    isToday ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-text-primary'
                  )}>{d.day}</span>
                  <div className="space-y-0.5">
                    {events.slice(0, 3).map(ev => {
                      const cfg = TYPE_LABELS[ev.type] ?? TYPE_LABELS.OTHER;
                      return (
                        <button key={ev.id} onClick={() => setSelected(ev)}
                          className={cn('w-full text-left border-l-2 px-1.5 py-0.5 rounded-r text-[10px] font-bold truncate hover:opacity-80 transition-opacity', cfg.bg,
                            `border-l-[${cfg.color}]`
                          )}>
                          {ev.title}
                        </button>
                      );
                    })}
                    {events.length > 3 && (
                      <span className="text-[9px] text-text-muted font-medium px-1">+{events.length - 3} mais</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming list */}
      {schedules.length > 0 && (
        <div className="mt-6 card p-6">
          <h3 className="font-bold text-base text-primary mb-4">Próximos eventos do mês</h3>
          <div className="space-y-3">
            {schedules
              .filter(s => new Date(s.startDate) >= new Date())
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .slice(0, 5)
              .map(s => {
                const cfg = TYPE_LABELS[s.type] ?? TYPE_LABELS.OTHER;
                const status = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.SCHEDULED;
                const date = new Date(s.startDate);
                return (
                  <div key={s.id} onClick={() => setSelected(s)} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-hover transition-colors cursor-pointer group">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0', cfg.color)}>
                      {date.getDate()}<br /><span className="text-[8px]">{MONTH_NAMES[date.getMonth()].slice(0,3)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-text-primary group-hover:text-accent transition-colors truncate">{s.title}</p>
                      <div className="flex items-center gap-3 text-[10px] text-text-muted mt-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        {s.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.location}</span>}
                      </div>
                    </div>
                    <span className={cn('badge shrink-0', status.class)}>{status.label}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={cn('badge mb-2', (TYPE_LABELS[selected.type] ?? TYPE_LABELS.OTHER).bg)}>
                  {(TYPE_LABELS[selected.type] ?? TYPE_LABELS.OTHER).label}
                </span>
                <h3 className="font-headline font-bold text-lg text-primary">{selected.title}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-text-secondary">
                <Clock className="w-4 h-4 text-text-muted" />
                {new Date(selected.startDate).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}
              </div>
              {selected.location && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <MapPin className="w-4 h-4 text-text-muted" />{selected.location}
                </div>
              )}
              {selected.responsibleName && (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Users className="w-4 h-4 text-text-muted" />{selected.responsibleName}
                </div>
              )}
              {selected.description && <p className="text-text-secondary leading-relaxed pt-2 border-t border-border/50">{selected.description}</p>}
              <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                <span className={cn('badge', (STATUS_CONFIG[selected.status] ?? STATUS_CONFIG.SCHEDULED).class)}>
                  {(STATUS_CONFIG[selected.status] ?? STATUS_CONFIG.SCHEDULED).label}
                </span>
                {selected.isPublic && <span className="badge badge-info">Público</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !submitting && setShowForm(false)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl text-primary">Novo Evento</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{formError}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className={labelCls}>Título *</label>
                <input name="title" value={form.title} onChange={handleChange} className={inputCls} placeholder="Nome do evento" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tipo</label>
                  <select name="type" value={form.type} onChange={handleChange} className={inputCls}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Responsável</label>
                  <input name="responsibleName" value={form.responsibleName} onChange={handleChange} className={inputCls} placeholder="Nome" />
                </div>
                <div>
                  <label className={labelCls}>Início *</label>
                  <input type="datetime-local" name="startDate" value={form.startDate} onChange={handleChange} className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Fim</label>
                  <input type="datetime-local" name="endDate" value={form.endDate} onChange={handleChange} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Local</label>
                  <input name="location" value={form.location} onChange={handleChange} className={inputCls} placeholder="Endereço ou nome do local" />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Descrição</label>
                  <textarea name="description" value={form.description} onChange={handleChange} className={cn(inputCls, 'resize-none h-20')} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} disabled={submitting} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 gradient-accent text-white font-bold text-sm py-2.5 rounded-xl shadow shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Salvando...' : 'Salvar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
