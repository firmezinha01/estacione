import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  UserCheck,
  CheckCircle2,
  XCircle,
  X,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  KeyRound,
  Trash2,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { User, UserRole } from '../../types/parking';
import { storage } from '../../services/storage';

export const UserManagement: React.FC = () => {
  const { currentUser, refreshData } = useParking();
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [modalOpen, setModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [role, setRole] = useState<UserRole>('atendente');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password visibility map for cards
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Password edit modal state
  const [editPasswordUser, setEditPasswordUser] = useState<User | null>(null);
  const [editedPassword, setEditedPassword] = useState('');
  const [showEditedPassword, setShowEditedPassword] = useState(false);

  const isAdmin = currentUser.role === 'admin';

  // Security guard: only admin can access this screen
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-slate-900/90 border border-red-500/30 rounded-3xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito ao Administrador</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Esta área é de acesso restrito. Apenas administradores do sistema têm permissão para visualizar, criar operadores e gerenciar credenciais de acesso.
        </p>
      </div>
    );
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanNome = nome.trim();
    const cleanEmail = email.trim();
    const cleanSenha = senha.trim();

    if (!cleanNome || !cleanEmail || !cleanSenha) {
      setErrorMsg('Preencha todos os campos obrigatórios, incluindo a senha.');
      return;
    }

    if (cleanSenha.length < 4) {
      setErrorMsg('A senha deve conter no mínimo 4 caracteres.');
      return;
    }

    // Check duplicate
    const exists = users.some(
      u => u.email.toLowerCase() === cleanEmail.toLowerCase() || u.nome.toLowerCase() === cleanNome.toLowerCase()
    );
    if (exists) {
      setErrorMsg('Já existe um operador cadastrado com este login/e-mail.');
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      nome: cleanNome,
      email: cleanEmail,
      senha: cleanSenha,
      role,
      ativo: true,
      created_at: new Date().toISOString(),
    };

    const updated = [...users, newUser];
    storage.saveUsers(updated);
    storage.addAuditLog('CADASTRO_OPERADOR', {
      nome: newUser.nome,
      email: newUser.email,
      role: newUser.role,
    });
    setUsers(updated);
    setModalOpen(false);
    setNome('');
    setEmail('');
    setSenha('');
    setShowSenha(false);
    refreshData();
  };

  const toggleUserStatus = (user: User) => {
    if (user.id === currentUser.id) {
      alert('Você não pode desativar seu próprio usuário em uso.');
      return;
    }
    const updated = users.map(u => (u.id === user.id ? { ...u, ativo: !u.ativo } : u));
    storage.saveUsers(updated);
    storage.addAuditLog('STATUS_OPERADOR_ALTERADO', {
      usuario: user.email,
      novo_status: !user.ativo ? 'ativo' : 'bloqueado',
    });
    setUsers(updated);
    refreshData();
  };

  const toggleRevealPassword = (userId: string) => {
    setRevealedPasswords(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleOpenEditPassword = (user: User) => {
    setEditPasswordUser(user);
    setEditedPassword('');
    setShowEditedPassword(false);
  };

  const handleSaveEditedPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPasswordUser || !editedPassword.trim()) return;

    if (editedPassword.trim().length < 4) {
      alert('A nova senha deve ter no mínimo 4 caracteres.');
      return;
    }

    const updated = users.map(u =>
      u.id === editPasswordUser.id ? { ...u, senha: editedPassword.trim() } : u
    );
    storage.saveUsers(updated);
    storage.addAuditLog('ALTERACAO_SENHA_OPERADOR', {
      usuario: editPasswordUser.email,
    });
    setUsers(updated);
    setEditPasswordUser(null);
    setEditedPassword('');
    refreshData();
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser.id) {
      alert('Você não pode excluir sua própria conta de administrador.');
      return;
    }
    if (user.email === 'admin') {
      alert('A conta principal do sistema não pode ser excluída.');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o operador ${user.nome}?`)) {
      return;
    }

    const updated = users.filter(u => u.id !== user.id);
    storage.saveUsers(updated);
    storage.addAuditLog('EXCLUSAO_OPERADOR', { usuario: user.email, nome: user.nome });
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
            Acesso exclusivo do Administrador para criar operadores e definir senhas de login
          </p>
        </div>

        <button
          onClick={() => {
            setNome('');
            setEmail('');
            setSenha('');
            setShowSenha(false);
            setErrorMsg(null);
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
          const isCurrentUser = currentUser.id === user.id || currentUser.email === user.email;
          const isPasswordRevealed = !!revealedPasswords[user.id];
          const displayPassword = user.senha || (user.role === 'admin' ? '123456' : '123456');

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
                      <span className="text-xs text-slate-400 block mt-0.5 font-mono">
                        Login: <strong className="text-slate-200">{user.email}</strong>
                      </span>
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

                {/* Password and Credentials Box */}
                <div className="mt-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-400">Senha:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {isPasswordRevealed ? displayPassword : '••••••••'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleRevealPassword(user.id)}
                      className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                      title={isPasswordRevealed ? 'Ocultar Senha' : 'Ver Senha'}
                    >
                      {isPasswordRevealed ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditPassword(user)}
                      className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                      title="Alterar Senha deste operador"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Account Status */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2.5 border-t border-slate-800">
                  <span>Status do Acesso:</span>
                  <button
                    onClick={() => toggleUserStatus(user)}
                    disabled={isCurrentUser}
                    className={`font-semibold flex items-center gap-1 ${
                      user.ativo ? 'text-emerald-400' : 'text-red-400'
                    } ${isCurrentUser ? 'opacity-50 cursor-not-allowed' : 'hover:underline'}`}
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

              {/* Bottom Actions */}
              <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-[11px] text-slate-500">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'Padrão'}
                </span>
                {!isCurrentUser && user.email !== 'admin' && (
                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition-colors flex items-center gap-1"
                    title="Excluir Operador"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Excluir</span>
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

            {errorMsg && (
              <div className="mt-3 p-2.5 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddUser} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Maria Atendente"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Usuário de Login ou E-mail
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Ex: maria ou maria@estacionamento.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Senha de Acesso (para login no sistema)
                </label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="Mínimo 4 caracteres (ex: 123456)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Perfil de Acesso</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="atendente">Atendente (Entrada, Saída, Leitor QR, Baixas)</option>
                  <option value="admin">Administrador (Acesso total, Tarifas, Relatórios, Usuários)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
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

      {/* Edit Password Modal */}
      {editPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Alterar Senha</h3>
              </div>
              <button
                onClick={() => setEditPasswordUser(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Definir nova senha para o operador <strong className="text-white">{editPasswordUser.nome}</strong>:
            </p>

            <form onSubmit={handleSaveEditedPassword} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showEditedPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={editedPassword}
                    onChange={e => setEditedPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditedPassword(!showEditedPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showEditedPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditPasswordUser(null)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
