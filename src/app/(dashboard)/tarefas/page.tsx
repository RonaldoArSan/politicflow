'use client';

import React, { useState, useRef } from 'react';
import { Plus, MoreVertical, Clock, Loader2, AlertCircle, X, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';

const COLUMNS = [
  { id: 'TODO',        label: 'A Fazer',      color: 'border-info'    },
  { id: 'IN_PROGRESS', label: 'Em Progresso', color: 'border-warning' },
  { id: 'REVIEW',      label: 'Revisão',      color: 'border-accent'  },
  { id: 'DONE',        label: 'Concluído',    color: 'border-success' },
];

const PRIORITY_PILL: Record<string, string> = {
  LOW:    'bg-info/10 text-info',
  MEDIUM: 'bg-warning/10 text-warning',
  HIGH:   'bg-danger/10 text-danger',
  URGENT: 'bg-danger text-white',
};
const PRIORITY_LABEL: Record<string, string> = { LOW: 'Baixa', MEDIUM: 'Média', HIGH: 'Alta', URGENT: 'Urgente' };

interface Task {
  id: string; title: string; description?: string;
  priority: string; status: string;
  dueDate?: string;
  assignee?: { id: string; name: string };
}

const inputCls = 'w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20';
const labelCls = 'block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5';

export default function TarefasPage() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const draggingId = useRef<string | null>(null);

  const { data: response, isLoading, error, mutate, request } = useApi<{ items: Task[] }>(
    '/api/tasks?limit=100'
  );

  const tasks = response?.items ?? [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Título é obrigatório.'); return; }
    setSubmitting(true); setFormError('');
    try {
      const res = await request('/api/tasks', {
        method: 'POST',
        body: {
          title: form.title,
          description: form.description || undefined,
          priority: form.priority,
          dueDate: form.dueDate || undefined,
          status: 'TODO',
        },
      });
      if (!res?.success) throw new Error(res?.error || 'Erro ao salvar');
      setShowForm(false);
      setForm({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
      mutate();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrop = async (columnId: string) => {
    const id = draggingId.current;
    if (!id) return;
    draggingId.current = null;
    const task = tasks.find(t => t.id === id);
    if (!task || task.status === columnId) return;

    // Optimistic update via mutate
    await request(`/api/tasks/${id}`, { method: 'PATCH', body: { status: columnId } });
    mutate();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir esta tarefa?')) return;
    await request(`/api/tasks/${id}`, { method: 'DELETE' });
    mutate();
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-extrabold font-headline text-primary">Tarefas</h2>
          <p className="text-text-secondary text-sm mt-1">Quadro Kanban da equipe</p>
        </div>
        <button onClick={() => setShowForm(true)} className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nova Tarefa
        </button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" /><span className="text-sm">{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : (
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar lg:grid lg:grid-cols-4 min-h-0">
          {COLUMNS.map(column => {
            const columnTasks = tasks.filter(t => t.status === column.id);
            return (
              <div key={column.id} className="flex-shrink-0 w-80 lg:w-full flex flex-col min-h-0"
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(column.id)}>
                <div className={cn('flex items-center justify-between mb-3 px-1 pb-3 border-b-2 shrink-0', column.color)}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs lg:text-[10px] xl:text-xs text-text-primary uppercase tracking-wider">{column.label}</h3>
                    <span className="bg-surface-muted text-text-muted text-[10px] font-bold px-1.5 py-0.5 rounded-md">{columnTasks.length}</span>
                  </div>
                  <button onClick={() => setShowForm(true)} className="p-1 rounded-lg hover:bg-surface-hover text-text-muted">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar p-1 pb-8 min-h-0">
                  {columnTasks.length === 0 && (
                    <div className="text-center p-8 text-xs text-text-muted font-medium border-2 border-dashed border-border/40 rounded-xl">Sem tarefas</div>
                  )}
                  {columnTasks.map(task => {
                    const isLate = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
                    return (
                      <div key={task.id} draggable
                        onDragStart={() => { draggingId.current = task.id; }}
                        className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing group bg-surface-card border border-border/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight', PRIORITY_PILL[task.priority])}>
                            {PRIORITY_LABEL[task.priority] ?? task.priority}
                          </span>
                          <button onClick={() => handleDelete(task.id)} className="p-0.5 rounded hover:bg-danger/10 hover:text-danger opacity-0 group-hover:opacity-100 transition-all text-text-muted">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="text-sm font-bold text-text-primary mb-1 group-hover:text-accent transition-colors">{task.title}</h4>
                        {task.description && <p className="text-xs text-text-muted line-clamp-2 mb-3 leading-relaxed">{task.description}</p>}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
                          {task.assignee ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white shadow-sm">
                                {task.assignee.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                              </div>
                              <span className="text-[10px] font-medium text-text-secondary">{task.assignee.name.split(' ')[0]}</span>
                            </div>
                          ) : <span />}
                          {task.dueDate && (
                            <div className={cn('flex items-center gap-1 text-[10px] font-bold p-1 rounded-md', isLate ? 'text-danger bg-danger/5' : 'text-text-muted bg-surface-muted')}>
                              <Clock className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !submitting && setShowForm(false)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl text-primary">Nova Tarefa</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{formError}</div>}
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className={labelCls}>Título *</label>
                <input name="title" value={form.title} onChange={handleChange} className={inputCls} placeholder="Descrição da tarefa" required />
              </div>
              <div>
                <label className={labelCls}>Descrição</label>
                <textarea name="description" value={form.description} onChange={handleChange} className={cn(inputCls, 'resize-none h-20')} placeholder="Detalhes opcionais..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Prioridade</label>
                  <select name="priority" value={form.priority} onChange={handleChange} className={inputCls}>
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Prazo</label>
                  <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className={inputCls} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} disabled={submitting} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 gradient-accent text-white font-bold text-sm py-2.5 rounded-xl shadow shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Salvando...' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
