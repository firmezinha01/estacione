import React, { useState } from 'react';
import { Users, UserPlus, Shield, UserCheck, CheckCircle2, XCircle, X } from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { User, UserRole } from '../../types/parking';
import { storage } from '../../services/storage';

export const UserManagement: React.FC = () => {
  const { currentUser, switchUserRole, refreshData } = useParking();
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [modalOpen, setModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('atendente');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;

    const newUser: User = {
      id: `usr-${Date.now()}`,
      nome: nome.trim(),
      email: email.trim(),
      role,
      ativo: true,
      created_at: new Date().toISOString(),
    };

    const updated = [...users, newUser];
    storage.saveUsers(updated);
    storage.addAuditLog('CADASTRO_OPERADOR', { nome: newUser.nome, role: newUser.role });
    setUsers(updated);
    setModalOpen(false);
    refreshData();
  };

  const toggleUserStatus = (user: User) => {
    const updated = users.map(u => (u.id === user.id ? { ...u, ativo: !u.ativo } : u));
    storage.saveUsers(updated);
    setUsers(updated);
    refreshData();
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Gestão de Usuários & Operadores</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-mono font-semibold border border-purple-500/30">
              {users.length} cadastrados
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Controle de perfis de atendentes e administradores do sistema
          </p>
        </div>

        <button
          onClick={() => {
            setNome('');
            setEmail('');
            setRole('atendente');
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Operador</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => {
          const isCurrentUser = currentUser.id === user.id;

          return (
            <div
              key={user.id}
              className={`bg-slate-900/90 border rounded-2xl p-4 transition-all duration-200 shadow-md flex flex-col justify-between ${
                isCurrentUser
                  ? 'border-purple-500/60 ring-1 ring-purple-500/30'
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        user.role === 'admin'
                          ? 'bg-purple-600/20 text-purple-400'
                          : 'bg-blue-600/20 text-blue-400'
                      }`}
                    >
                      {user.role === 'admin' ? (
                        <Shield className="w-5 h-5" />
                      ) : (
                        <UserCheck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight flex items-center gap-1.5">
                        <span>{user.nome}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.2 rounded">
                            VOCÊ
                          </span>
                        )}
                      </h4>
                      <span className="text-xs text-slate-400 block mt-0.5">{user.email}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      user.role === 'admin'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
                  <span>Status da Conta:</span>
                  <button
                    onClick={() => toggleUserStatus(user)}
                    className={`font-semibold flex items-center gap-1 ${
                      user.ativo ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {user.ativo ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ativo</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Bloqueado</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-2 flex justify-end gap-2">
                {!isCurrentUser && (
                  <button
                    onClick={() => switchUserRole(user.role)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Alternar para esta conta
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 my-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">Cadastrar Novo Operador</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Ana Paula Atendente"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="anapaula@estacionamento.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Perfil de Acesso</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="atendente">Atendente (Entrada, Saída, Leitor QR, Baixas)</option>
                  <option value="admin">Administrador (Acesso total, Tarifas, Métricas, Logs)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow"
                >
                  Cadastrar Operador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
