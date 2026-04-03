'use client';

import React, { useState } from 'react';
import { Plus, Search, MapPin, Phone, MessageSquare, Star, MoreVertical, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

// Constantes
const IMPACT_CONFIG: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  LOW: { label: 'Baixa', class: 'text-info bg-info/10', icon: Star },
  MEDIUM: { label: 'Média', class: 'text-warning bg-warning/10', icon: Star },
  HIGH: { label: 'Alta', class: 'text-danger bg-danger/10', icon: Flame },
};

const STAGES = [
  { id: 'PROSPECTION', label: 'Prospecção', borderClass: 'border-info', bgClass: 'bg-info/5' },
  { id: 'CONTACTED', label: 'Contatados', borderClass: 'border-warning', bgClass: 'bg-warning/5' },
  { id: 'ENGAGED', label: 'Engajados', borderClass: 'border-primary', bgClass: 'bg-primary/5' },
  { id: 'SUPPORTER', label: 'Apoiadores', borderClass: 'border-success', bgClass: 'bg-success/5' },
  { id: 'MULTIPLIER', label: 'Multiplicadores', borderClass: 'border-accent', bgClass: 'bg-accent/5' },
];

const INITIAL_CONTACTS = [
  { id: '1', name: 'Carlos Oliveira', role: 'Presidente Associação', category: 'Liderança', phone: '(11) 98888-7777', city: 'São Paulo', neighborhood: 'Vila Maria', impact: 'HIGH', stage: 'PROSPECTION' },
  { id: '2', name: 'Ana Silva', role: 'Diretora Escola', category: 'Educação', phone: '(11) 97777-6666', city: 'Guarulhos', neighborhood: 'Centro', impact: 'MEDIUM', stage: 'CONTACTED' },
  { id: '3', name: 'João Batista', role: 'Comerciante', category: 'Setor Privado', phone: '(11) 96666-5555', city: 'São Paulo', neighborhood: 'Mooca', impact: 'LOW', stage: 'PROSPECTION' },
  { id: '4', name: 'Maria Fernandes', role: 'Ativista Social', category: 'Movimento', phone: '(11) 95555-4444', city: 'São Paulo', neighborhood: 'Guaianases', impact: 'HIGH', stage: 'ENGAGED' },
  { id: '5', name: 'Pedro Alves', role: 'Vereador', category: 'Político', phone: '(11) 94444-3333', city: 'Osasco', neighborhood: 'Centro', impact: 'HIGH', stage: 'SUPPORTER' },
  { id: '6', name: 'Roberto Lima', role: 'Pastor', category: 'Religioso', phone: '(11) 93333-2222', city: 'São Paulo', neighborhood: 'Itaquera', impact: 'HIGH', stage: 'MULTIPLIER' },
  { id: '7', name: 'Lucia Costa', role: 'Médica', category: 'Saúde', phone: '(11) 92222-1111', city: 'São Paulo', neighborhood: 'Santana', impact: 'MEDIUM', stage: 'ENGAGED' },
];

export default function CRMPage() {
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeStage, setActiveStage] = useState(STAGES[0].id);

  const moveContact = (contactId: string, direction: 'LEFT' | 'RIGHT') => {
    setContacts(current => current.map(contact => {
      if (contact.id !== contactId) return contact;
      
      const currentIndex = STAGES.findIndex(s => s.id === contact.stage);
      let newIndex = currentIndex;
      
      if (direction === 'LEFT' && currentIndex > 0) newIndex = currentIndex - 1;
      if (direction === 'RIGHT' && currentIndex < STAGES.length - 1) newIndex = currentIndex + 1;
      
      const nextStage = STAGES[newIndex].id;
      // Em mobile, mudar a visão para o estágio para onde o contato foi
      if (typeof window !== 'undefined' && window.innerWidth < 1024) setActiveStage(nextStage);
      
      return { ...contact, stage: nextStage };
    }));
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.neighborhood.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-extrabold font-headline text-primary">CRM Político</h2>
          <p className="text-text-secondary text-sm mt-1">Pipeline de engajamento e relacionamento</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar contato..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-hover rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30 transition-all font-medium"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto max-w-full gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Contato</span>
          </button>
        </div>
      </div>

      {/* Mobile Stage Switcher */}
      <div className="lg:hidden relative shrink-0 mb-4">
        <div className="flex overflow-x-auto pb-4 gap-2 custom-scrollbar scroll-smooth">
          {STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStage(s.id)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0",
                activeStage === s.id 
                  ? "bg-accent text-white border-accent shadow-md shadow-accent/20" 
                  : "bg-surface-card text-text-secondary border-border hover:border-accent/30"
              )}
            >
              {s.label} ({filteredContacts.filter(c => c.stage === s.id).length})
            </button>
          ))}
          {/* Espaçador final para garantir que o último botão não encoste na borda ao scrollar */}
          <div className="w-4 shrink-0 h-4" />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto lg:overflow-x-visible custom-scrollbar flex lg:grid lg:grid-cols-5 gap-4 lg:gap-5 pb-4 min-h-0">
        {STAGES.map((stage) => {
          const stageContacts = filteredContacts.filter(c => c.stage === stage.id);
          
          return (
            <div 
              key={stage.id} 
              className={cn(
                "w-[85vw] sm:w-80 lg:w-full shrink-0 flex flex-col min-h-0 transition-all",
                "lg:flex", // Always visible on desktop
                activeStage === stage.id ? "flex" : "hidden lg:flex" // Mobile visibility logic
              )}
            >
              {/* Column Header */}
              <div className={cn(
                "px-4 py-3 rounded-t-xl border-t-4 mb-3 flex items-center justify-between shrink-0",
                stage.borderClass, stage.bgClass
              )}>
                <h3 className="font-bold text-xs lg:text-[10px] xl:text-xs text-text-primary uppercase tracking-wider">{stage.label}</h3>
                <span className="bg-white/60 px-2 py-0.5 rounded-full text-[10px] font-bold text-text-secondary">
                  {stageContacts.length}
                </span>
              </div>
              
              {/* Column Body - Scrollable */}
              <div className="flex-1 bg-surface-muted/20 rounded-xl p-2 lg:p-3 flex flex-col gap-3 overflow-y-auto custom-scrollbar border border-border/40">
                {stageContacts.length === 0 ? (
                  <div className="text-center p-8 text-xs text-text-muted font-medium border-2 border-dashed border-border/40 rounded-xl">
                    Nenhum contato nesta etapa
                  </div>
                ) : (
                  stageContacts.map((contact) => {
                    const impact = IMPACT_CONFIG[contact.impact];
                    
                    return (
                      <div key={contact.id} className="bg-surface-card p-3 lg:p-4 rounded-xl shadow-sm border border-border/60 hover:border-accent/30 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-sm text-text-primary line-clamp-1">{contact.name}</h4>
                          <button className="text-text-muted hover:text-accent transition-colors shrink-0">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="text-[11px] text-text-secondary mb-3 font-medium">
                          {contact.role}
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          <span className="px-2 py-0.5 rounded bg-surface-hover text-[10px] font-bold text-text-muted border border-border/50 uppercase tracking-tight">
                            {contact.category}
                          </span>
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 uppercase tracking-tight", impact.class)}>
                            <impact.icon className="w-2.5 h-2.5" /> {impact.label}
                          </span>
                        </div>
                        
                        <div className="space-y-1.5 text-[11px] text-text-muted mb-4 border-t border-border/30 pt-3">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 opacity-60" />
                            <span className="truncate">{contact.neighborhood}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 opacity-60" />
                            {contact.phone}
                          </div>
                        </div>
                        
                        {/* Quick Actions & Move Pipeline */}
                        <div className="flex items-center justify-between pt-2">
                          <button className="p-1.5 bg-surface-hover rounded-md text-text-secondary hover:text-success hover:bg-success/10 transition-colors">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          
                          <div className="flex gap-1 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => moveContact(contact.id, 'LEFT')}
                              disabled={stage.id === STAGES[0].id}
                              className="px-2.5 py-1 bg-surface-muted rounded-md text-xs font-black text-text-secondary hover:bg-surface-hover disabled:opacity-30 transition-colors"
                            >
                              &larr;
                            </button>
                            <button 
                              onClick={() => moveContact(contact.id, 'RIGHT')}
                              disabled={stage.id === STAGES[STAGES.length - 1].id}
                              className="px-2.5 py-1 bg-surface-muted rounded-md text-xs font-black text-text-secondary hover:bg-accent hover:text-white disabled:opacity-30 transition-colors"
                            >
                              &rarr;
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal - Novo Contato */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline font-bold text-xl text-primary mb-6">Novo Contato CRM</h3>
            
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); setShowForm(false); }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Nome Completo</label>
                  <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" placeholder="Ex: Maria Santos" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Telefone / WhatsApp</label>
                  <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" placeholder="(11) 90000-0000" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Cargo / Papel</label>
                  <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" placeholder="Ex: Presidente de Bairro" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Categoria</label>
                  <select className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20">
                    <option>Liderança</option>
                    <option>Religioso</option>
                    <option>Empresário</option>
                    <option>Educação</option>
                    <option>Saúde</option>
                    <option>Político</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Bairro / Região</label>
                  <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" placeholder="Bairro" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Cidade</label>
                  <input className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" placeholder="Cidade" defaultValue="São Paulo" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Nível de Influência</label>
                  <select className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20">
                    <option value="LOW">Baixa</option>
                    <option value="MEDIUM">Média</option>
                    <option value="HIGH">Alta</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Etapa do Funil</label>
                  <select className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20">
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Observações Iniciais</label>
                <textarea className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20 resize-none h-20" placeholder="Anotações sobre a primeira abordagem..." />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 gradient-accent text-white font-bold text-sm py-3 rounded-xl shadow shadow-accent/20">Salvar Contato</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

