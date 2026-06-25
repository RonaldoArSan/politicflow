'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Loader2, AlertCircle, X, Globe, Users, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApi } from '@/hooks/use-api';

interface SocialMedia { twitter?: string; instagram?: string; facebook?: string; youtube?: string; website?: string }

interface Candidate {
  id: string; name: string; position: string; party: string;
  coalition?: string; federation?: string; municipality?: string; state?: string;
  bio?: string; photo?: string; socialMedia?: SocialMedia;
  _count?: { actions: number; schedules: number };
}

const EMPTY_FORM = { name: '', position: '', party: '', coalition: '', federation: '', municipality: '', state: '', bio: '', twitter: '', instagram: '', facebook: '', youtube: '', website: '' };
const inputCls  = 'w-full px-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none border border-transparent focus:border-accent/30 focus:ring-2 focus:ring-accent/20';
const labelCls  = 'block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5';

export default function CandidatoPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: response, isLoading, error, mutate, request } = useApi<{ items: Candidate[] }>(
    `/api/candidates?search=${search}&limit=50`
  );
  const candidates = response?.items ?? [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (c: Candidate) => {
    setEditing(c);
    setForm({
      name: c.name, position: c.position, party: c.party,
      coalition: c.coalition ?? '', federation: c.federation ?? '',
      municipality: c.municipality ?? '', state: c.state ?? '',
      bio: c.bio ?? '',
      twitter: c.socialMedia?.twitter ?? '', instagram: c.socialMedia?.instagram ?? '',
      facebook: c.socialMedia?.facebook ?? '', youtube: c.socialMedia?.youtube ?? '',
      website: c.socialMedia?.website ?? '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.position || !form.party) { setFormError('Nome, cargo e partido são obrigatórios.'); return; }
    setSubmitting(true); setFormError('');

    const socialMedia: SocialMedia = {};
    if (form.twitter)   socialMedia.twitter   = form.twitter;
    if (form.instagram) socialMedia.instagram = form.instagram;
    if (form.facebook)  socialMedia.facebook  = form.facebook;
    if (form.youtube)   socialMedia.youtube   = form.youtube;
    if (form.website)   socialMedia.website   = form.website;

    const body = {
      name: form.name, position: form.position, party: form.party,
      coalition: form.coalition || undefined, federation: form.federation || undefined,
      municipality: form.municipality || undefined, state: form.state || undefined,
      bio: form.bio || undefined,
      socialMedia: Object.keys(socialMedia).length ? socialMedia : undefined,
    };

    try {
      const res = editing
        ? await request(`/api/candidates/${editing.id}`, { method: 'PATCH', body })
        : await request('/api/candidates', { method: 'POST', body });
      if (!res?.success) throw new Error(res?.error || 'Erro ao salvar');
      setShowForm(false); mutate();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Excluir candidato "${name}"?`)) return;
    await request(`/api/candidates/${id}`, { method: 'DELETE' });
    mutate();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold font-headline text-primary">Candidatos</h2>
          <p className="text-text-secondary text-sm mt-1">Perfis de candidatos vinculados ao tenant</p>
        </div>
        <button onClick={openCreate} className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 hover:shadow-lg transition-all flex itens-center gap-2">
          <Plus className="w-4 h-4" /> Novo Candidato
        </button>
      </div>

      <div className="card p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input type="text" placeholder="Buscar candidato, cargo ou partido..." className="w-full pl-10 pr-4 py-2.5 bg-surface-hover rounded-lg text-sm outline-none focus:ring-2 focus:ring-accent/20 border border-transparent focus:border-accent/30 transition-all" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {error && <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5" /><span className="text-sm">{error}</span></div>}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>
      ) : candidates.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">C</div>
          <h3 className="font-bold text-text-primary mb-1">Nenhum candidato cadastrado</h3>
          <p className="text-text-muted text-sm mb-4">Cadastre o perfil do candidato para vincular ações e agendas.</p>
          <button onClick={openCreate} className="gradient-accent text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow shadow-accent/20 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Cadastrar Candidato
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {candidates.map(c => (
            <div key={c.id} className="card-hover p-6 group">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  {c.photo ? (
                    <Image src={c.photo} alt={c.name} width={56} height={56} unoptimized className="w-14 h-14 rounded-2xl object-cover border-2 border-border/50" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white text-xl font-bold shrink-0">
                      {c.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-base text-text-primary leading-tight">{c.name}</h3>
                    <p className="text-xs text-text-muted mt-0.5">{c.position}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted hover:text-accent transition-colors"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id, c.name)} className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Party / Coalition */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="badge badge-accent">{c.party}</span>
                {c.coalition && <span className="badge badge-neutral">{c.coalition}</span>}
                {c.municipality && <span className="badge badge-info">{c.municipality}{c.state ? `/${c.state}` : ''}</span>}
              </div>

              {/* Bio */}
              {c.bio && <p className="text-xs text-text-secondary leading-relaxed mb-4 line-clamp-2">{c.bio}</p>}

              {/* Social */}
              {c.socialMedia && Object.keys(c.socialMedia).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {c.socialMedia.twitter   && <a href={`https://twitter.com/${c.socialMedia.twitter}`}   target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg bg-surface-hover hover:bg-sky-500/10 hover:text-sky-500 text-text-muted text-[10px] font-bold transition-colors">𝕏 Twitter</a>}
                  {c.socialMedia.instagram && <a href={`https://instagram.com/${c.socialMedia.instagram}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg bg-surface-hover hover:bg-pink-500/10 hover:text-pink-500 text-text-muted text-[10px] font-bold transition-colors">📸 Instagram</a>}
                  {c.socialMedia.facebook  && <a href={`https://facebook.com/${c.socialMedia.facebook}`}  target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg bg-surface-hover hover:bg-blue-600/10 hover:text-blue-600 text-text-muted text-[10px] font-bold transition-colors">📘 Facebook</a>}
                  {c.socialMedia.youtube   && <a href={`https://youtube.com/@${c.socialMedia.youtube}`}   target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg bg-surface-hover hover:bg-danger/10 hover:text-danger text-text-muted text-[10px] font-bold transition-colors">▶ YouTube</a>}
                  {c.socialMedia.website   && <a href={c.socialMedia.website}                             target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg bg-surface-hover hover:bg-success/10 hover:text-success text-text-muted text-[10px] font-bold transition-colors flex items-center gap-1"><Globe className="w-3 h-3" /> Site</a>}
                </div>
              )}

              {/* Counts */}
              {c._count && (
                <div className="border-t border-border/50 pt-3 flex gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-text-muted"><Zap className="w-3.5 h-3.5" /><span className="font-bold text-text-secondary">{c._count.actions}</span> ações</div>
                  <div className="flex items-center gap-1.5 text-xs text-text-muted"><Users className="w-3.5 h-3.5" /><span className="font-bold text-text-secondary">{c._count.schedules}</span> agendas</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !submitting && setShowForm(false)}>
          <div className="bg-surface-card rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline font-bold text-xl text-primary">{editing ? 'Editar Candidato' : 'Novo Candidato'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-surface-hover text-text-muted"><X className="w-5 h-5" /></button>
            </div>
            {formError && <div className="mb-4 p-3 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm">{formError}</div>}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Nome completo *</label>
                  <input name="name" value={form.name} onChange={handleChange} className={inputCls} placeholder="Nome do candidato" required />
                </div>
                <div>
                  <label className={labelCls}>Cargo disputado *</label>
                  <input name="position" value={form.position} onChange={handleChange} className={inputCls} placeholder="Ex: Prefeito, Vereador..." required />
                </div>
                <div>
                  <label className={labelCls}>Partido *</label>
                  <input name="party" value={form.party} onChange={handleChange} className={inputCls} placeholder="Ex: PT, PL, MDB..." required />
                </div>
                <div>
                  <label className={labelCls}>Coligação</label>
                  <input name="coalition" value={form.coalition} onChange={handleChange} className={inputCls} placeholder="Nome da coligação" />
                </div>
                <div>
                  <label className={labelCls}>Federação</label>
                  <input name="federation" value={form.federation} onChange={handleChange} className={inputCls} placeholder="Nome da federação" />
                </div>
                <div>
                  <label className={labelCls}>Município</label>
                  <input name="municipality" value={form.municipality} onChange={handleChange} className={inputCls} placeholder="Cidade" />
                </div>
                <div>
                  <label className={labelCls}>Estado (UF)</label>
                  <input name="state" value={form.state} onChange={handleChange} className={inputCls} placeholder="Ex: SP" maxLength={2} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Biografia / Descrição</label>
                  <textarea name="bio" value={form.bio} onChange={handleChange} className={cn(inputCls, 'resize-none h-24')} placeholder="Breve descrição do candidato..." />
                </div>
              </div>

              <div className="border-t border-border/50 pt-4">
                <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Redes Sociais</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: 'twitter',   label: '𝕏 Twitter',    placeholder: 'usuario (sem @)'   },
                    { name: 'instagram', label: '📸 Instagram',  placeholder: 'usuario (sem @)'   },
                    { name: 'facebook',  label: '📘 Facebook',   placeholder: 'usuario ou página' },
                    { name: 'youtube',   label: '▶ YouTube',     placeholder: 'canal (sem @)'     },
                    { name: 'website',   label: '🌐 Website',    placeholder: 'https://...'       },
                  ].map(s => (
                    <div key={s.name} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-muted shrink-0 w-24">{s.label}</span>
                      <input name={s.name} value={(form as Record<string, string>)[s.name]} onChange={handleChange} className={inputCls} placeholder={s.placeholder} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} disabled={submitting} className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary font-bold text-sm hover:bg-surface-hover transition-colors disabled:opacity-50">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 gradient-accent text-white font-bold text-sm py-2.5 rounded-xl shadow shadow-accent/20 flex items-center justify-center gap-2 disabled:opacity-50">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Criar Candidato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
