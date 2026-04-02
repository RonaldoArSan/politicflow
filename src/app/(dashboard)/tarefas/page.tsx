'use client';

import React, { useState } from 'react';
import { Plus, MoreVertical, Clock, User, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MockTask {
  id: string;
  title: string;
  description?: string;
  priority: string;
  assigneeName: string;
  assigneeInitials: string;
  dueDate?: string;
  isLate?: boolean;
}

const COLUMNS = [
  { id: 'TODO', label: 'A Fazer', color: 'border-info' },
  { id: 'IN_PROGRESS', label: 'Em Progresso', color: 'border-warning' },
  { id: 'REVIEW', label: 'Revisão', color: 'border-accent' },
  { id: 'DONE', label: 'Concluído', color: 'border-success' },
];

const PRIORITY_PILL: Record<string, string> = {
  LOW: 'bg-info/10 text-info',
  MEDIUM: 'bg-warning/10 text-warning',
  HIGH: 'bg-danger/10 text-danger',
  URGENT: 'bg-danger text-white',
};

const MOCK_TASKS: Record<string, MockTask[]> = {
  TODO: [
    { id: '1', title: 'Preparar material de panfletagem', description: 'Design e impressão dos panfletos para zona norte', priority: 'HIGH', assigneeName: 'João Silva', assigneeInitials: 'JS', dueDate: 'Amanhã' },
    { id: '2', title: 'Confirmar local do comício', priority: 'URGENT', assigneeName: 'Maria Oliveira', assigneeInitials: 'MO', dueDate: 'Hoje', isLate: true },
    { id: '3', title: 'Atualizar lista de lideranças', priority: 'MEDIUM', assigneeName: 'Ana Costa', assigneeInitials: 'AC' },
  ],
  IN_PROGRESS: [
    { id: '4', title: 'Organizar carreata sábado', description: 'Logística de veículos e rota', priority: 'HIGH', assigneeName: 'Pedro Santos', assigneeInitials: 'PS', dueDate: 'Sexta' },
    { id: '5', title: 'Relatório de ações do mês', priority: 'MEDIUM', assigneeName: 'Lucas Mendes', assigneeInitials: 'LM', dueDate: '05/04' },
  ],
  REVIEW: [
    { id: '6', title: 'Discurso para plenária', description: 'Revisão do roteiro de fala', priority: 'HIGH', assigneeName: 'Fernanda Lima', assigneeInitials: 'FL', dueDate: 'Quarta' },
  ],
  DONE: [
    { id: '7', title: 'Fotografias do evento', priority: 'LOW', assigneeName: 'João Silva', assigneeInitials: 'JS' },
    { id: '8', title: 'Convites para reunião', priority: 'MEDIUM', assigneeName: 'Ana Costa', assigneeInitials: 'AC' },
  ],
};

export default function TarefasPage() {
  const [tasks] = useState(MOCK_TASKS);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold font-headline text-primary">Tarefas</h2>
          <p className="text-text-secondary text-sm mt-1">Quadro Kanban de tarefas da equipe</p>
        </div>
        <button className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nova Tarefa
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
        {COLUMNS.map((column) => {
          const columnTasks = tasks[column.id] || [];
          return (
            <div key={column.id} className="flex-shrink-0 w-72 lg:flex-1">
              {/* Column header */}
              <div className={cn("flex items-center justify-between mb-3 px-1 pb-3 border-b-2", column.color)}>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-text-primary">{column.label}</h3>
                  <span className="bg-surface-muted text-text-muted text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    {columnTasks.length}
                  </span>
                </div>
                <button className="p-1 rounded-lg hover:bg-surface-hover text-text-muted">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing group"
                  >
                    {/* Priority */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn("badge", PRIORITY_PILL[task.priority])}>
                        {task.priority === 'URGENT' ? 'Urgente' : task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
                      </span>
                      <button className="p-0.5 rounded hover:bg-surface-hover opacity-0 group-hover:opacity-100 transition-opacity text-text-muted">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-text-primary mb-1">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-text-muted line-clamp-2 mb-3">{task.description}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-[9px] font-bold">
                          {task.assigneeInitials}
                        </div>
                        <span className="text-[10px] text-text-muted">{task.assigneeName.split(' ')[0]}</span>
                      </div>
                      {task.dueDate && (
                        <div className={cn(
                          "flex items-center gap-1 text-[10px] font-medium",
                          task.isLate ? "text-danger" : "text-text-muted"
                        )}>
                          <Clock className="w-3 h-3" />
                          {task.dueDate}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
