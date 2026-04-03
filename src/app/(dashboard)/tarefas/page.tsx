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
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggingId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessário para permitir o drop
  };

  const handleDrop = (columnId: string) => {
    if (!draggingId) return;

    setTasks(current => {
      const newTasks = { ...current };
      let taskToMove: MockTask | undefined;
      let sourceColumnId: string | undefined;

      // Encontrar a tarefa e remover da coluna de origem
      for (const colId in newTasks) {
        const index = newTasks[colId].findIndex(t => t.id === draggingId);
        if (index !== -1) {
          sourceColumnId = colId;
          taskToMove = newTasks[colId][index];
          newTasks[colId] = newTasks[colId].filter(t => t.id !== draggingId);
          break;
        }
      }

      // Se moveu para a mesma coluna ou não encontrou, não faz nada
      if (!taskToMove || !sourceColumnId) return current;

      // Adicionar na nova coluna
      newTasks[columnId] = [...newTasks[columnId], taskToMove];
      return newTasks;
    });

    setDraggingId(null);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
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
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar lg:grid lg:grid-cols-4 min-h-0">
        {COLUMNS.map((column) => {
          const columnTasks = tasks[column.id] || [];
          return (
            <div 
              key={column.id} 
              className="flex-shrink-0 w-80 lg:w-full flex flex-col min-h-0"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.id)}
            >
              {/* Column header */}
              <div className={cn("flex items-center justify-between mb-3 px-1 pb-3 border-b-2 shrink-0", column.color)}>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs lg:text-[10px] xl:text-xs text-text-primary uppercase tracking-wider">{column.label}</h3>
                  <span className="bg-surface-muted text-text-muted text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                    {columnTasks.length}
                  </span>
                </div>
                <button className="p-1 rounded-lg hover:bg-surface-hover text-text-muted">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks Container */}
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar p-1 pb-8 min-h-0">
                {columnTasks.length === 0 && (
                  <div className="text-center p-8 text-xs text-text-muted font-medium border-2 border-dashed border-border/40 rounded-xl">
                    Sem tarefas
                  </div>
                )}
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    className={cn(
                      "card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing group bg-surface-card border border-border/60",
                      draggingId === task.id ? "opacity-50 grayscale scale-95" : "opacity-100"
                    )}
                  >
                    {/* Priority */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-tight", PRIORITY_PILL[task.priority])}>
                        {task.priority === 'URGENT' ? 'Urgente' : task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
                      </span>
                      <button className="p-0.5 rounded hover:bg-surface-hover opacity-0 group-hover:opacity-100 transition-opacity text-text-muted">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-text-primary mb-1 underline-offset-4 group-hover:text-accent transition-colors">{task.title}</h4>
                    {task.description && (
                      <p className="text-xs text-text-muted line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white shadow-sm">
                          {task.assigneeInitials}
                        </div>
                        <span className="text-[10px] font-medium text-text-secondary">{task.assigneeName.split(' ')[0]}</span>
                      </div>
                      {task.dueDate && (
                        <div className={cn(
                          "flex items-center gap-1 text-[10px] font-bold p-1 rounded-md",
                          task.isLate ? "text-danger bg-danger/5" : "text-text-muted bg-surface-muted"
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
