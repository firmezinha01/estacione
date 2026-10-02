import React, { useState } from 'react';
import {
  Car,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login, settings } = useParking();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMsg('Por favor, informe o usuário e a senha.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const result = await login(usernameOrEmail.trim(), password);
    setLoading(false);

    if (result.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(result.message || 'Usuário ou senha incorretos.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-emerald-500 shadow-xl shadow-blue-600/30 mb-3 border border-blue-400/20">
            <Car className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            EstacioneFácil
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {settings?.nome_estabelecimento || 'Sistema de Controle de Estacionamento'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/95 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <LogIn className="w-5 h-5 text-blue-400" />
                <span>Acesso ao Sistema</span>
              </h2>
              <p className="text-xs text-slate-400">Entre com seu usuário e senha</p>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded-md border border-blue-500/20">
              PWA 2.0
            </span>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-xs text-red-300 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User / Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Usuário ou E-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="admin ou seu usuário"
                  value={usernameOrEmail}
                  onChange={e => setUsernameOrEmail(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Senha
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-blue-500 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <span>Validando acesso...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6 text-xs text-slate-500">
          <p>EstacioneFácil • PWA Instalável com Suporte Térmico ESC/POS e QR Code</p>
        </div>
      </div>
    </div>
  );
};
