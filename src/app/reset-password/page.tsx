'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Landmark, Lock, Eye, EyeOff, ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPass, setShowPass]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);

  const isForgot = !token;

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!json.success && !json.data) throw new Error(json.error || 'Erro ao enviar');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar solicitação');
    } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('As senhas não coincidem'); return; }
    if (password.length < 8)  { setError('A senha deve ter pelo menos 8 caracteres'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Token inválido ou expirado');
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-surface gradient-mesh flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-xl gradient-accent flex items-center justify-center text-white mb-4 shadow-lg shadow-accent/20">
            <Landmark className="w-8 h-8" />
          </div>
          <h1 className="font-headline text-2xl font-extrabold text-primary">PoliticFlow</h1>
        </div>

        <div className="bg-surface-card rounded-2xl shadow-lg border border-border/50 p-8">
          {success ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="font-headline font-bold text-xl text-primary mb-2">
                {isForgot ? 'E-mail enviado!' : 'Senha redefinida!'}
              </h2>
              <p className="text-text-secondary text-sm">
                {isForgot
                  ? 'Se o e-mail estiver cadastrado, você receberá as instruções em breve.'
                  : 'Sua senha foi redefinida com sucesso. Redirecionando para o login...'}
              </p>
              <button onClick={() => router.push('/login')} className="mt-6 text-accent font-bold text-sm hover:underline">
                Voltar ao login
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="font-headline text-2xl font-extrabold text-primary">
                  {isForgot ? 'Esqueceu a senha?' : 'Redefinir senha'}
                </h2>
                <p className="text-text-secondary text-sm mt-1">
                  {isForgot
                    ? 'Informe seu e-mail e enviaremos as instruções de recuperação.'
                    : 'Defina uma nova senha para sua conta.'}
                </p>
              </div>

              {error && (
                <div className="mb-5 p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={isForgot ? handleForgot : handleReset} className="space-y-5">
                {isForgot ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary mb-2">E-mail</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                      <input
                        type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-surface-card rounded-xl border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary mb-2">Nova Senha</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                        <input
                          type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                          className="w-full pl-12 pr-12 py-3.5 bg-surface-card rounded-xl border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                          placeholder="Mínimo 8 caracteres"
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                          {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary mb-2">Confirmar Senha</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                        <input
                          type={showPass ? 'text' : 'password'} required value={confirm} onChange={e => setConfirm(e.target.value)}
                          className="w-full pl-12 pr-4 py-3.5 bg-surface-card rounded-xl border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                          placeholder="Repita a nova senha"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit" disabled={loading}
                  className={cn('w-full gradient-accent text-white font-headline font-bold py-3.5 rounded-xl shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/30 transition-all flex items-center justify-center gap-2', loading && 'opacity-70 cursor-not-allowed')}
                >
                  {loading ? 'Processando...' : isForgot ? 'Enviar instruções' : 'Redefinir senha'}
                </button>
              </form>

              <button onClick={() => router.push('/login')} className="mt-6 w-full flex items-center justify-center gap-2 text-sm text-text-secondary hover:text-text-primary font-medium transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar ao login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
