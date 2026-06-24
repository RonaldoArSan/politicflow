'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, UserPlus, Landmark, ArrowRight, Building2, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    tenantName: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { signup } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Basic validation
      if (!formData.email || !formData.password || !formData.confirmPassword || !formData.name || !formData.tenantName) {
        setError('Preencha todos os campos obrigatórios');
        setIsSubmitting(false);
        return;
      }

      if (formData.password.length < 8) {
        setError('Senha deve ter pelo menos 8 caracteres');
        setIsSubmitting(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Senhas não conferem');
        setIsSubmitting(false);
        return;
      }

      await signup(
        formData.email,
        formData.password,
        formData.confirmPassword,
        formData.name,
        formData.tenantName,
        formData.phone || undefined
      );
      
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setIsSubmitting(false);
    }
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
            Comece sua
            <br />
            <span className="text-accent-light">Jornada Digital</span> Hoje.
          </h1>

          <p className="text-white/50 text-lg leading-relaxed mb-12 max-w-md">
            Junte-se a centenas de organizações políticas que já transformam dados em decisões estratégicas com Pro Campanha.
          </p>

          <div className="grid grid-cols-2 gap-4">
            {[
              { title: 'Comece Grátis', desc: 'Sem cartão de crédito' },
              { title: 'Setup Rápido', desc: '5 minutos para começar' },
              { title: 'Suporte 24/7', desc: 'Estamos aqui para ajudar' },
              { title: 'Seguro LGPD', desc: 'Todos os dados protegidos' },
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

      {/* Right Side: Signup Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-surface gradient-mesh overflow-y-auto">
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
            <h2 className="font-headline text-2xl font-extrabold text-primary tracking-tight">Pro Campanha</h2>
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="font-headline text-3xl font-extrabold text-primary">Criar Conta</h2>
            <p className="text-text-secondary">Comece a gerenciar sua campanha em minutos.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-danger-light border border-danger/20 text-danger text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary mb-2 ml-1" htmlFor="signup-email">
                E-mail
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  className="w-full pl-12 pr-4 py-3 bg-surface-card rounded-xl border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-text-primary placeholder:text-text-muted outline-none"
                  id="signup-email"
                  name="email"
                  placeholder="seu@email.com"
                  required
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary mb-2 ml-1" htmlFor="signup-name">
                Nome Completo
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserPlus className="w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  className="w-full pl-12 pr-4 py-3 bg-surface-card rounded-xl border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-text-primary placeholder:text-text-muted outline-none"
                  id="signup-name"
                  name="name"
                  placeholder="João Silva"
                  required
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Organization Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary mb-2 ml-1" htmlFor="signup-tenant">
                Nome da Organização
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building2 className="w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  className="w-full pl-12 pr-4 py-3 bg-surface-card rounded-xl border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-text-primary placeholder:text-text-muted outline-none"
                  id="signup-tenant"
                  name="tenantName"
                  placeholder="Prefeitura de São Paulo"
                  required
                  type="text"
                  value={formData.tenantName}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary mb-2 ml-1" htmlFor="signup-phone">
                Telefone (Opcional)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  className="w-full pl-12 pr-4 py-3 bg-surface-card rounded-xl border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-text-primary placeholder:text-text-muted outline-none"
                  id="signup-phone"
                  name="phone"
                  placeholder="(11) 99999-9999"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary mb-2 ml-1" htmlFor="signup-password">
                Senha
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  className="w-full pl-12 pr-12 py-3 bg-surface-card rounded-xl border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-text-primary placeholder:text-text-muted outline-none"
                  id="signup-password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-text-muted mt-1 ml-1">Mínimo 8 caracteres</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-secondary mb-2 ml-1" htmlFor="signup-confirm-password">
                Confirmar Senha
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                </div>
                <input
                  className="w-full pl-12 pr-12 py-3 bg-surface-card rounded-xl border border-border focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-text-primary placeholder:text-text-muted outline-none"
                  id="signup-confirm-password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-muted hover:text-text-primary transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              className={cn(
                "w-full gradient-accent text-white font-headline font-bold py-3 rounded-xl shadow-lg shadow-accent/25",
                "hover:shadow-xl hover:shadow-accent/30 active:scale-[0.98] transition-all",
                "flex items-center justify-center gap-2 mt-6",
                isSubmitting && "opacity-70 cursor-not-allowed"
              )}
              type="submit"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'Criando conta...' : 'Criar Conta'}</span>
              <UserPlus className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-text-muted text-sm">Já possui uma conta?</p>
            <a className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:text-accent transition-colors" href="/login">
              <ArrowRight className="w-4 h-4" />
              Faça Login
            </a>
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
