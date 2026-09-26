import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onOpenSetupInstructions: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenSetupInstructions }) => {
  const { login, enterDemoMode, sendResetPassword, authError, clearAuthError, isLoading, isDemoMode, toggleDemoMode } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await login(email, password);
    } catch {
      // Handled in AuthContext
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetError('Informe o e-mail cadastrado');
      return;
    }
    setResetLoading(true);
    setResetError('');
    try {
      await sendResetPassword(resetEmail);
      setResetSuccess(true);
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetSuccess(false);
        setResetEmail('');
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao enviar e-mail de recuperação';
      setResetError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative select-none">
      {/* Background subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md bg-[#0B0B0B] border border-[#262626] rounded-2xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <Logo size="lg" showText={false} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading uppercase">
              CASA DE DEUS
            </h1>
          </div>
          <div className="pt-1">
            <h2 className="text-sm font-semibold text-white">
              Painel de Gestão & Acompanhamento
            </h2>
            <p className="text-xs text-[#888888] mt-0.5">
              Entre com suas credenciais autorizadas
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {authError && (
          <div className="p-3 bg-red-950/80 border border-red-700 rounded-lg text-xs text-red-200 flex items-start justify-between gap-2 shadow-lg animate-fadeIn">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-red-100">Acesso Bloqueado</span>
                <span className="text-[11px] text-red-200 leading-tight block mt-0.5">{authError}</span>
              </div>
            </div>
            <button
              onClick={clearAuthError}
              className="text-red-400 hover:text-white font-bold text-sm ml-2"
              title="Fechar aviso"
            >
              ×
            </button>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {/* Email / Username */}
          <div>
            <label className="block text-xs font-medium text-[#CCCCCC] mb-1.5" htmlFor="login-email">
              Login ou E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-email"
                type="text"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (authError) clearAuthError();
                }}
                placeholder="Digite seu login ou e-mail"
                required
                className="w-full pl-9 pr-3 py-2.5 bg-[#141414] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-white transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-[#CCCCCC]" htmlFor="login-password">
                Senha
              </label>
              <button
                type="button"
                onClick={() => {
                  setResetEmail(email);
                  setIsResetModalOpen(true);
                }}
                className="text-[11px] text-[#888888] hover:text-white transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  if (authError) clearAuthError();
                }}
                placeholder="••••••••"
                required
                className={`w-full pl-9 pr-10 py-2.5 bg-[#141414] border ${
                  authError ? 'border-red-600 focus:border-red-500' : 'border-[#262626] focus:border-white'
                } rounded-lg text-white text-sm focus:outline-none transition-colors`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white transition-colors focus:outline-none"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-white text-black font-semibold text-sm rounded-lg hover:bg-neutral-200 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <span>{isLoading ? 'Entrando...' : 'Entrar no Painel'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#222222] w-full" />
          <span className="bg-[#0B0B0B] px-3 text-[11px] uppercase tracking-wider text-[#666666] relative font-medium">
            ou
          </span>
        </div>

        {/* Demo Mode ON / OFF Switch Box */}
        <div className="p-3.5 bg-[#141414] border border-[#262626] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Modo Demonstração</span>
              </span>
              <span className="text-[11px] text-[#888888] block">
                {isDemoMode ? 'LIGADO (30 contatos de teste)' : 'DESLIGADO (Ambiente Firebase real)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isDemoMode ? 'text-white' : 'text-[#666666]'}`}>
                {isDemoMode ? 'ON' : 'OFF'}
              </span>
              <button
                type="button"
                onClick={toggleDemoMode}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isDemoMode ? 'bg-white' : 'bg-[#262626]'
                }`}
                role="switch"
                aria-checked={isDemoMode}
                title={isDemoMode ? 'Desligar modo demo' : 'Ligar modo demo'}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-lg transition duration-200 ease-in-out ${
                    isDemoMode ? 'translate-x-5 bg-black' : 'translate-x-0 bg-[#666666]'
                  }`}
                />
              </button>
            </div>
          </div>

          {isDemoMode ? (
            <button
              type="button"
              onClick={() => enterDemoMode('admin')}
              className="w-full py-2 px-3 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Acessar Painel no Modo Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <p className="text-[11px] text-[#777777] bg-[#0E0E0E] p-2 rounded border border-[#1F1F1F]">
              Com o modo demo desligado, utilize as credenciais de e-mail e senha da sua congregação para entrar.
            </p>
          )}
        </div>

        {/* Footer info & help */}
        <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[11px] text-[#777777]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Acesso Restrito à Equipe</span>
          </div>
          <button
            type="button"
            onClick={onOpenSetupInstructions}
            className="hover:text-white underline transition-colors"
          >
            Instruções Firebase
          </button>
        </div>
      </div>

      {/* Reset Password Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0C0C0C] border border-[#262626] rounded-xl p-5 shadow-2xl text-white space-y-4">
            <h3 className="text-sm font-semibold font-heading">
              Recuperação de Senha
            </h3>
            {resetSuccess ? (
              <div className="p-3 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>E-mail com instruções de redefinição enviado!</span>
              </div>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-3">
                <p className="text-xs text-[#888888]">
                  Digite o e-mail cadastrado para receber as instruções de redefinição de senha.
                </p>
                {resetError && (
                  <p className="text-xs text-red-400 bg-red-950/40 p-2 rounded border border-red-900">
                    {resetError}
                  </p>
                )}
                <div>
                  <label className="block text-[11px] text-[#AAAAAA] mb-1">E-mail</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    required
                    placeholder="seu.email@casadedeus.org"
                    className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-xs focus:outline-none focus:border-white"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-[#AAAAAA] hover:text-white bg-[#141414] rounded-lg border border-[#262626]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-4 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-lg"
                  >
                    {resetLoading ? 'Enviando...' : 'Enviar Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
