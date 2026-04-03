'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, LogIn, Landmark, ArrowRight, Headset, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth, useDemoAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { demoLogin } = useDemoAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciais inválidas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = () => {
    demoLogin();
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row relative">
      {/* Left Side: Visual/Institutional */}
      <div className="hidden lg:flex lg:w-3/5 gradient-primary relative items-center justify-center p-12 overflow-hidden">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(124, 58, 237, 0.5) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}
        />

        {/* Gradient orbs */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-accent/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 max-w-lg"
        >
          <div className="mb-10 inline-flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl gradient-accent flex items-center justify-center text-white shadow-lg shadow-accent/30">
              <Landmark className="w-8 h-8" />
            </div>
            <span className="font-headline text-3xl font-extrabold text-white tracking-tighter">
              Pro Campanha
            </span>
          </div>

          <h1 className="font-headline text-5xl font-extrabold text-white leading-[1.1] mb-6">
            A Plataforma
            <br />
            <span className="text-accent-light">Inteligente</span> de Campanha Politica.
          </h1>

          <p className="text-white/50 text-lg leading-relaxed mb-12 max-w-md">
            Transforme dados em decisões estratégicas. Gerencie campanhas, gabinetes e equipes com eficiência e segurança institucional.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'Multi-Tenant', desc: 'Dados isolados por cliente' },
              { title: 'RBAC Completo', desc: 'Permissões granulares' },
              { title: 'Dashboards', desc: 'Insights em tempo real' },
              { title: 'LGPD Ready', desc: 'Conformidade total' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm"
              >
                <h3 className="text-white font-bold text-sm mb-1">{item.title}</h3>
                <p className="text-white/40 text-xs">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 w-full h-1 gradient-accent opacity-60" />
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-surface gradient-mesh">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-12">
            <div className="w-16 h-16 rounded-xl gradient-accent flex items-center justify-center text-white mb-4 shadow-lg shadow-accent/20">
              <Landmark className="w-10 h-10" />
            </div>
            <h2 className="font-headline text-2xl font-extrabold text-primary tracking-tight">Pro Camapanha</h2>
          </div>

          <div className="space-y-2 mb-10">
            <h2 className="font-headline text-3xl font-extrabold text-primary">Acessar Conta</h2>
            <p className="text-text-secondary">Insira suas credenciais para gerenciar sua operação política.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-danger-light border border-danger/20 text-danger text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary mb-2 ml-1" htmlFor="login-email">
                E-mail
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  className="w-full pl-12 pr-4 py-3.5 bg-surface-card rounded-xl border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-text-primary placeholder:text-text-muted outline-none"
                  id="login-email"
                  name="email"
                  placeholder="seu@email.com"
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary" htmlFor="login-password">
                  Senha
                </label>
                <a className="text-xs font-semibold text-accent hover:underline decoration-2 underline-offset-4" href="#">
                  Esqueceu?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  className="w-full pl-12 pr-12 py-3.5 bg-surface-card rounded-xl border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-text-primary placeholder:text-text-muted outline-none"
                  id="login-password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-accent focus:ring-accent focus:ring-offset-0 transition-all"
              />
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">Lembrar de mim</span>
            </label>

            <button
              className={cn(
                "w-full gradient-accent text-white font-headline font-bold py-3.5 rounded-xl shadow-lg shadow-accent/25",
                "hover:shadow-xl hover:shadow-accent/30 active:scale-[0.98] transition-all",
                "flex items-center justify-center gap-2",
                isSubmitting && "opacity-70 cursor-not-allowed"
              )}
              type="submit"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Entrando...' : 'Entrar'}</span>
              <LogIn className="w-5 h-5" />
            </button>
          </form>

          {/* Demo login */}
          <button
            onClick={handleDemoLogin}
            className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-accent/30 text-accent font-bold text-sm hover:bg-accent/5 hover:border-accent/50 transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Entrar com conta demo
          </button>

          <div className="mt-10 flex flex-col items-center gap-4">
            <p className="text-text-muted text-sm">Ainda não possui acesso?</p>
            <div className="flex flex-wrap justify-center gap-6">
              <a className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:text-accent transition-colors" href="#">
                <UserPlus className="w-4 h-4" />
                Solicitar Acesso
              </a>
              <div className="w-px h-4 bg-border hidden sm:block" />
              <a className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:text-accent transition-colors" href="#">
                <Headset className="w-4 h-4" />
                Suporte
              </a>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted">
              © 2026 Pro Campanha — Gestão de Campanha Inteligente
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
