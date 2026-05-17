'use client';

import React, { useState, useRef } from 'react';
import { Plus, Search, MapPin, Phone, MessageSquare, Star, MoreVertical, Flame, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCrmContacts, type CRMContact } from '@/hooks/use-crm-contacts';
import { useCrmInteractions } from '@/hooks/use-crm-interactions';

interface ContactMenuState {
  contactId: string | null;
  position: { x: number; y: number };
}

interface ContactFormData {
  name: string;
  phone: string;
  role: string;
  neighborhood: string;
  city: string;
  observations: string;
}

interface EditModalState {
  isOpen: boolean;
  contact: CRMContact | null;
  formData: ContactFormData;
}

interface InteractionModalState {
  isOpen: boolean;
  contactId: string | null;
}

// Constantes
const IMPACT_CONFIG: Record<string, { label: string; class: string; icon: React.ElementType }> = {
  LOW: { label: 'Baixa', class: 'text-info bg-info/10', icon: Star },
  MEDIUM: { label: 'Média', class: 'text-warning bg-warning/10', icon: Star },
  HIGH: { label: 'Alta', class: 'text-danger bg-danger/10', icon: Flame },
};

// Mapeamento de stages: DB para UI
const STAGE_MAP: Record<string, {id: string; label: string; borderClass: string; bgClass: string}> = {
  NEW_CONTACT: { id: 'NEW_CONTACT', label: 'Prospecção', borderClass: 'border-info', bgClass: 'bg-info/5' },
  POTENTIAL_SUPPORTER: { id: 'POTENTIAL_SUPPORTER', label: 'Contatados', borderClass: 'border-warning', bgClass: 'bg-warning/5' },
  ACTIVE_LEADER: { id: 'ACTIVE_LEADER', label: 'Engajados', borderClass: 'border-primary', bgClass: 'bg-primary/5' },
  STRATEGIC_PARTNER: { id: 'STRATEGIC_PARTNER', label: 'Apoiadores', borderClass: 'border-success', bgClass: 'bg-success/5' },
  CONFIRMED_MOBILIZER: { id: 'CONFIRMED_MOBILIZER', label: 'Multiplicadores', borderClass: 'border-accent', bgClass: 'bg-accent/5' },
};

const STAGES = Object.values(STAGE_MAP);

export default function CRMPage() {
  const { contacts, loading, error, isMoving, isCreating, createContact, moveContact, updateContact, deleteContact } = useCrmContacts();
  const { interactions, fetchInteractions, recordInteraction, isRecording } = useCrmInteractions(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeStage, setActiveStage] = useState(STAGES[0].id);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Estados para menu de opções
  const [contactMenu, setContactMenu] = useState<ContactMenuState>({ contactId: null, position: { x: 0, y: 0 } });

  // Estados para modal de edição
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    contact: null,
    formData: { name: '', phone: '', role: '', neighborhood: '', city: '', observations: '' },
  });

  // Estados para modal de interações
  const [interactionModal, setInteractionModal] = useState<InteractionModalState>({
    isOpen: false,
    contactId: null,
  });

  const [interactionForm, setInteractionForm] = useState({
    type: 'CALL' as 'CALL' | 'EMAIL' | 'MEETING' | 'MESSAGE' | 'VISIT' | 'OTHER',
    description: '',
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Estados do formulário
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    phone: '',
    role: '',
    neighborhood: '',
    city: '',
    observations: '',
  });
  const [formImpact, setFormImpact] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [formLoading, setFormLoading] = useState(false);

  // Notificação auto-desaparece
  React.useEffect(() => {
    if (notification) {
      const timeout = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timeout);
    }
  }, [notification]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setNotification({ type: 'error', message: 'Nome é obrigatório' });
      return;
    }

    setFormLoading(true);
    try {
      await createContact({
        name: formData.name,
        phone: formData.phone || undefined,
        role: formData.role || undefined,
        neighborhood: formData.neighborhood || undefined,
        city: formData.city || undefined,
        observations: formData.observations || undefined,
        impact: formImpact,
      });
      
      setNotification({ type: 'success', message: 'Contato criado com sucesso!' });
      setFormData({ name: '', phone: '', role: '', neighborhood: '', city: '', observations: '' });
      setFormImpact('MEDIUM');
      setShowForm(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao criar contato';
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setFormLoading(false);
    }
  };

  const handleMoveContact = async (contactId: string, direction: 'LEFT' | 'RIGHT') => {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    const currentIndex = STAGES.findIndex(s => s.id === contact.stage);
    const newIndex = direction === 'LEFT' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= STAGES.length) return;

    const nextStage = STAGES[newIndex].id;

    try {
      await moveContact(contactId, nextStage);
      setNotification({ type: 'success', message: `Contato movido para "${STAGES[newIndex].label}"` });
      
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setActiveStage(nextStage);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao mover contato';
      setNotification({ type: 'error', message: errorMsg });
    }
  };

  const handleOpenMenu = (contactId: string, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setContactMenu({
      contactId,
      position: { x: rect.right, y: rect.bottom },
    });
  };

  const handleEditContact = (contact: CRMContact) => {
    setEditModal({
      isOpen: true,
      contact,
      formData: {
        name: contact.name,
        phone: contact.phone || '',
        role: contact.role || '',
        neighborhood: contact.neighborhood || '',
        city: contact.city || '',
        observations: contact.observations || '',
      },
    });
    setContactMenu({ contactId: null, position: { x: 0, y: 0 } });
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm('Tem certeza que deseja deletar este contato?')) return;

    setIsDeleting(true);
    try {
      await deleteContact(contactId);
      setNotification({ type: 'success', message: 'Contato deletado com sucesso!' });
      setContactMenu({ contactId: null, position: { x: 0, y: 0 } });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao deletar contato';
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.contact) return;

    setIsUpdating(true);
    try {
      await updateContact(editModal.contact.id, editModal.formData);
      setNotification({ type: 'success', message: 'Contato atualizado com sucesso!' });
      setEditModal({ isOpen: false, contact: null, formData: { name: '', phone: '', role: '', neighborhood: '', city: '', observations: '' } });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao atualizar contato';
      setNotification({ type: 'error', message: errorMsg });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenInteractionModal = (contactId: string) => {
    setInteractionModal({ isOpen: true, contactId });
    setContactMenu({ contactId: null, position: { x: 0, y: 0 } });
    fetchInteractions(contactId);
  };

  const handleRecordInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionModal.contactId || !interactionForm.description.trim()) {
      setNotification({ type: 'error', message: 'Descrição da interação é obrigatória' });
      return;
    }

    try {
      await recordInteraction(interactionModal.contactId, {
        type: interactionForm.type,
        description: interactionForm.description,
      });
      
      setNotification({ type: 'success', message: 'Interação registrada com sucesso!' });
      setInteractionForm({ type: 'CALL', description: '' });
      setInteractionModal({ isOpen: false, contactId: null });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao registrar interação';
      setNotification({ type: 'error', message: errorMsg });
    }
  };

  const filteredContacts = contacts.filter(c => 
    !search || 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.neighborhood?.toLowerCase().includes(search.toLowerCase()) ||
    c.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col overflow-hidden px-4 sm:px-0">
      {/* Notificações */}
      {notification && (
        <div className={cn(
          'fixed top-4 right-4 z-40 p-4 rounded-xl shadow-lg flex items-center gap-3 animate-in',
          notification.type === 'success' 
            ? 'bg-success/10 text-success border border-success/30' 
            : 'bg-danger/10 text-danger border border-danger/30'
        )}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium text-sm">{notification.message}</span>
        </div>
      )}

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
            disabled={isCreating}
            className="w-full sm:w-auto max-w-full gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>{isCreating ? 'Salvando...' : 'Novo Contato'}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && !loading && (
        <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-3" />
            <p className="text-text-secondary font-medium">Carregando contatos...</p>
          </div>
        </div>
      ) : (
        <>
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
                    "lg:flex",
                    activeStage === stage.id ? "flex" : "hidden lg:flex"
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
                        const impact = IMPACT_CONFIG[contact.impact || 'MEDIUM'];
                        
                        return (
                          <div key={contact.id} className="bg-surface-card p-3 lg:p-4 rounded-xl shadow-sm border border-border/60 hover:border-accent/30 hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-sm text-text-primary line-clamp-1">{contact.name}</h4>
                              <button 
                                onClick={(e) => handleOpenMenu(contact.id, e)}
                                className="text-text-muted hover:text-accent transition-colors shrink-0 relative"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="text-[11px] text-text-secondary mb-3 font-medium">
                              {contact.role || 'Sem cargo definido'}
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 uppercase tracking-tight", impact.class)}>
                                <impact.icon className="w-2.5 h-2.5" /> {impact.label}
                              </span>
                            </div>
                            
                            <div className="space-y-1.5 text-[11px] text-text-muted mb-4 border-t border-border/30 pt-3">
                              {contact.neighborhood && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-3.5 h-3.5 opacity-60" />
                                  <span className="truncate">{contact.neighborhood}</span>
                                </div>
                              )}
                              {contact.phone && (
                                <div className="flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 opacity-60" />
                                  {contact.phone}
                                </div>
                              )}
                              {contact.lastInteraction && (
                                <div className="flex items-center gap-1.5">
                                  <MessageSquare className="w-3.5 h-3.5 opacity-60" />
                                  <span>Último contato: {new Date(contact.lastInteraction).toLocaleDateString('pt-BR')}</span>
                                </div>
                              )}
                              {contact.nextFollowUp && (
                                <div className={cn("flex items-center gap-1.5", new Date(contact.nextFollowUp) < new Date() ? 'text-danger' : '')}>
                                  <span>📅 Follow-up: {new Date(contact.nextFollowUp).toLocaleDateString('pt-BR')}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Quick Actions & Move Pipeline */}
                            <div className="flex items-center justify-between pt-2">
                              <button 
                                onClick={() => handleOpenInteractionModal(contact.id)}
                                className="p-1.5 bg-surface-hover rounded-md text-text-secondary hover:text-success hover:bg-success/10 transition-colors cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                              
                              <div className="flex gap-1">
                                <button 
                                  onClick={() => handleMoveContact(contact.id, 'LEFT')}
                                  disabled={stage.id === STAGES[0].id || isMoving}
                                  className="px-2.5 py-1 bg-surface-muted rounded-md text-xs font-black text-text-secondary hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                >
                                  &larr;
                                </button>
                                <button 
                                  onClick={() => handleMoveContact(contact.id, 'RIGHT')}
                                  disabled={stage.id === STAGES[STAGES.length - 1].id || isMoving}
                                  className="px-2.5 py-1 bg-surface-muted rounded-md text-xs font-black text-text-secondary hover:bg-accent hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
        </>
      )}

      {/* Modal - Novo Contato */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !formLoading && setShowForm(false)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline font-bold text-xl text-primary mb-6">Novo Contato CRM</h3>
            
            <form ref={formRef} className="space-y-4" onSubmit={handleAddContact}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Nome Completo *</label>
                  <input 
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" 
                    placeholder="Ex: Maria Santos"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Telefone / WhatsApp</label>
                  <input 
                    type="tel"
                    className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" 
                    placeholder="(11) 90000-0000"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    disabled={formLoading}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Cargo / Papel</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" 
                    placeholder="Ex: Presidente de Bairro"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Bairro / Região</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" 
                    placeholder="Bairro"
                    value={formData.neighborhood}
                    onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Cidade</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" 
                    placeholder="Cidade" 
                    value={formData.city}
                    onChange={e => setFormData({...formData, city: e.target.value})}
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Nível de Influência</label>
                  <select
                    className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20"
                    value={formImpact}
                    onChange={e => setFormImpact(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                    disabled={formLoading}
                  >
                    <option value="LOW">⭐ Baixa</option>
                    <option value="MEDIUM">⭐⭐ Média</option>
                    <option value="HIGH">🔥 Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Observações Iniciais</label>
                <textarea 
                  className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20 resize-none h-20" 
                  placeholder="Anotações sobre a primeira abordagem..."
                  value={formData.observations}
                  onChange={e => setFormData({...formData, observations: e.target.value})}
                  disabled={formLoading}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  disabled={formLoading}
                  className="flex-1 py-3 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 gradient-accent text-white font-bold text-sm py-3 rounded-xl shadow shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? 'Salvando...' : 'Salvar Contato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu de Contexto - Contato */}
      {contactMenu.contactId && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setContactMenu({ contactId: null, position: { x: 0, y: 0 } })}
          />
          <div
            className="fixed z-50 bg-surface-card rounded-xl shadow-lg border border-border/60 overflow-hidden"
            style={{ top: `${contactMenu.position.y + 5}px`, left: `${contactMenu.position.x - 150}px` }}
          >
            <button
              onClick={() => {
                const contact = contacts.find(c => c.id === contactMenu.contactId);
                if (contact) handleEditContact(contact);
              }}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2"
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => handleOpenInteractionModal(contactMenu.contactId!)}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2"
            >
              💬 Registrar Interação
            </button>
            <div className="border-t border-border/30" />
            <button
              onClick={() => handleDeleteContact(contactMenu.contactId!)}
              disabled={isDeleting}
              className="w-full px-4 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger/10 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              🗑️ Deletar
            </button>
          </div>
        </>
      )}

      {/* Modal - Editar Contato */}
      {editModal.isOpen && editModal.contact && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !isUpdating && setEditModal({ isOpen: false, contact: null, formData: { name: '', phone: '', role: '', neighborhood: '', city: '', observations: '' } })}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline font-bold text-xl text-primary mb-6">Editar Contato</h3>
            
            <form className="space-y-4" onSubmit={handleSaveEdit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Nome Completo</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" 
                    value={editModal.formData.name}
                    onChange={e => setEditModal({ ...editModal, formData: { ...editModal.formData, name: e.target.value } })}
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Telefone</label>
                  <input 
                    type="tel"
                    className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" 
                    value={editModal.formData.phone}
                    onChange={e => setEditModal({ ...editModal, formData: { ...editModal.formData, phone: e.target.value } })}
                    disabled={isUpdating}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Cargo</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" 
                    value={editModal.formData.role}
                    onChange={e => setEditModal({ ...editModal, formData: { ...editModal.formData, role: e.target.value } })}
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Bairro</label>
                  <input 
                    type="text"
                    className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" 
                    value={editModal.formData.neighborhood}
                    onChange={e => setEditModal({ ...editModal, formData: { ...editModal.formData, neighborhood: e.target.value } })}
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Cidade</label>
                <input 
                  type="text"
                  className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20" 
                  value={editModal.formData.city}
                  onChange={e => setEditModal({ ...editModal, formData: { ...editModal.formData, city: e.target.value } })}
                  disabled={isUpdating}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Observações</label>
                <textarea 
                  className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20 resize-none h-20" 
                  value={editModal.formData.observations}
                  onChange={e => setEditModal({ ...editModal, formData: { ...editModal.formData, observations: e.target.value } })}
                  disabled={isUpdating}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditModal({ isOpen: false, contact: null, formData: { name: '', phone: '', role: '', neighborhood: '', city: '', observations: '' } })}
                  disabled={isUpdating}
                  className="flex-1 py-3 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 gradient-accent text-white font-bold text-sm py-3 rounded-xl shadow shadow-accent/20 disabled:opacity-50"
                >
                  {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Registrar Interação */}
      {interactionModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !isRecording && setInteractionModal({ isOpen: false, contactId: null })}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-headline font-bold text-xl text-primary mb-6">Registrar Interação</h3>
            
            <form className="space-y-4" onSubmit={handleRecordInteraction}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Tipo de Interação</label>
                <select
                  className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20"
                  value={interactionForm.type}
                  onChange={e => setInteractionForm({ ...interactionForm, type: e.target.value as 'CALL' | 'EMAIL' | 'MEETING' | 'MESSAGE' | 'VISIT' | 'OTHER' })}
                  disabled={isRecording}
                >
                  <option value="CALL">☎️ Chamada</option>
                  <option value="EMAIL">📧 Email</option>
                  <option value="MESSAGE">💬 Mensagem</option>
                  <option value="MEETING">🤝 Encontro</option>
                  <option value="VISIT">📍 Visita</option>
                  <option value="OTHER">📝 Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">Descrição *</label>
                <textarea 
                  required
                  className="w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20 resize-none h-28" 
                  placeholder="Ex: Discutimos sobre apoio na campanha..."
                  value={interactionForm.description}
                  onChange={e => setInteractionForm({ ...interactionForm, description: e.target.value })}
                  disabled={isRecording}
                />
              </div>

              {interactions.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2">Histórico</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {interactions.map(i => (
                      <div key={i.id} className="flex gap-2 text-[11px] text-text-muted bg-surface-hover rounded-lg p-2">
                        <span className="font-bold text-text-secondary shrink-0">{new Date(i.date).toLocaleDateString('pt-BR')}</span>
                        <span className="truncate">{i.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setInteractionModal({ isOpen: false, contactId: null })}
                  disabled={isRecording}
                  className="flex-1 py-3 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isRecording}
                  className="flex-1 gradient-accent text-white font-bold text-sm py-3 rounded-xl shadow shadow-accent/20 disabled:opacity-50"
                >
                  {isRecording ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

