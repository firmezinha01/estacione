import React, { useState, useEffect } from 'react';
import {
  Car,
  Clock,
  Shield,
  UserCheck,
  Smartphone,
  ShieldAlert,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

interface NavbarProps {
  onOpenSupabaseModal?: () => void;
  onOpenLgpdModal: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenLgpdModal,
  activeTab,
  setActiveTab,
}) => {
  const { currentUser, switchUserRole, activeEntries, settings, logout } = useParking();
  const [time, setTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // PWA Install prompt listener
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const occupancyCount = activeEntries.length;
  const occupancyPercent = Math.min(100, Math.round((occupancyCount / settings.vagas_totais) * 100));

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="font-black text-xl text-white tracking-wider">P</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  EstacioneFácil
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase bg-blue-600/30 text-blue-300 rounded border border-blue-500/30">
                  PWA 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none hidden sm:block">
                {settings.nome_estabelecimento}
              </p>
            </div>
          </div>

          {/* Center Occupancy & Clock Pill */}
          <div className="hidden md:flex items-center gap-4">
            {/* Occupancy Indicator */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-xs">
              <Car className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-medium text-slate-300">
                Ocupação:{' '}
                <strong className="text-white font-mono">
                  {occupancyCount} / {settings.vagas_totais}
                </strong>
              </span>
              <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    occupancyPercent > 85
                      ? 'bg-red-500'
                      : occupancyPercent > 60
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${occupancyPercent}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-mono text-slate-400 font-bold">
                {occupancyPercent}%
              </span>
            </div>

            {/* Live Clock */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-full">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {time.toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Right Action Controls: Role Switcher & Badges */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* PWA Install Button */}
            {installPrompt && (
              <button
                onClick={handleInstallPwa}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-all active:scale-95"
                title="Instalar como aplicativo no celular ou computador"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Instalar App</span>
              </button>
            )}

            {/* LGPD Button */}
            <button
              onClick={onOpenLgpdModal}
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
              title="Termos e Privacidade LGPD"
            >
              <ShieldAlert className="w-4 h-4 text-blue-400" />
            </button>

            {/* Role Switcher Pill */}
            <div className="flex items-center p-0.5 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                onClick={() => switchUserRole('atendente')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentUser.role === 'atendente'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Modo Operador / Atendente"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Atendente</span>
              </button>
              <button
                onClick={() => switchUserRole('admin')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Modo Gestor / Administrador"
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-800/80 rounded-xl text-slate-300 hover:text-red-300 text-xs font-semibold transition-colors"
              title="Sair do Sistema"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Sair</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-800 space-y-2">
            <div className="px-2 py-1 text-xs text-slate-400">
              Ocupação: {occupancyCount} / {settings.vagas_totais} vagas ({occupancyPercent}%)
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => {
                  setActiveTab('patio');
                  setMobileMenuOpen(false);
                }}
                className={`p-2 rounded-lg text-xs font-semibold text-left ${
                  activeTab === 'patio' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300'
                }`}
              >
                🚗 Pátio & Entrada
              </button>
              <button
                onClick={() => {
                  setActiveTab('mensalistas');
                  setMobileMenuOpen(false);
                }}
                className={`p-2 rounded-lg text-xs font-semibold text-left ${
                  activeTab === 'mensalistas' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-300'
                }`}
              >
                ⭐ Mensalistas
              </button>
              {currentUser.role === 'admin' && (
                <>
                  <button
                    onClick={() => {
                      setActiveTab('dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2 rounded-lg text-xs font-semibold text-left ${
                      activeTab === 'dashboard' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    📊 Métricas Admin
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('tarifas');
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2 rounded-lg text-xs font-semibold text-left ${
                      activeTab === 'tarifas' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    ⚙️ Tarifas & Regras
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('relatorios');
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2 rounded-lg text-xs font-semibold text-left ${
                      activeTab === 'relatorios' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    📑 Relatórios & CSV
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('usuarios');
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2 rounded-lg text-xs font-semibold text-left ${
                      activeTab === 'usuarios' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    👥 Operadores & Acesso
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('auditoria');
                      setMobileMenuOpen(false);
                    }}
                    className={`p-2 rounded-lg text-xs font-semibold text-left ${
                      activeTab === 'auditoria' ? 'bg-purple-600 text-white' : 'bg-slate-900 text-slate-300'
                    }`}
                  >
                    🛡️ Auditoria
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="col-span-2 p-2 bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 rounded-lg text-xs font-bold text-red-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span>Sair do Sistema</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
