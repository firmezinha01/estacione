import React from 'react';
import {
  Car,
  UserCheck,
  QrCode,
  LayoutDashboard,
  Settings,
  FileText,
  Users,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenEntryModal: () => void;
  onOpenScannerModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenEntryModal,
  onOpenScannerModal,
}) => {
  const { currentUser, activeEntries } = useParking();
  const isAdmin = currentUser.role === 'admin';

  return (
    <aside className="w-64 bg-slate-950/80 border-r border-slate-800 p-4 hidden md:flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        {/* Quick New Entry Button */}
        <div>
          <button
            onClick={onOpenEntryModal}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/25 transition-all active:scale-98 text-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Nova Entrada</span>
          </button>
        </div>

        {/* Section: Operacional / Atendente */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 mb-2">
            Operacional
          </span>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('patio')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'patio'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Car className="w-4 h-4" />
                <span>Pátio & Entradas</span>
              </div>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {activeEntries.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('mensalistas')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'mensalistas'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Mensalistas</span>
            </button>

            <button
              onClick={() => setActiveTab('validador')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'validador'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Validador QR Code</span>
            </button>
          </nav>
        </div>

        {/* Section: Gestão & Administração (Available to Admin) */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 mb-2 flex items-center justify-between">
            <span>Administração</span>
            {!isAdmin && (
              <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono">
                Admin
              </span>
            )}
          </span>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Visão Geral & KPIs</span>
            </button>

            <button
              onClick={() => setActiveTab('tarifas')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'tarifas'
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Tarifas & Configurações</span>
            </button>

            <button
              onClick={() => setActiveTab('relatorios')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'relatorios'
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Relatórios & CSV</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('usuarios')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'usuarios'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Operadores & Acesso</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('auditoria')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'auditoria'
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Logs de Auditoria</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom Quick Scanner Bar */}
      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={onOpenScannerModal}
          className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-colors"
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span>Leitor de QR Code</span>
        </button>
      </div>
    </aside>
  );
};
