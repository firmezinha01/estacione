import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Car,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Search,
  Edit,
  DollarSign,
  X,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { Customer, Vehicle } from '../../types/parking';
import { formatBRL, formatCPF, formatPhone, formatPlate } from '../../utils/formatters';

interface MensalistasPageProps {
  onQuickCheckIn: (vehicle: Vehicle) => void;
}

export const MensalistasPage: React.FC<MensalistasPageProps> = ({ onQuickCheckIn }) => {
  const { customers, vehicles, saveCustomer, settings } = useParking();
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [mensalidadeValor, setMensalidadeValor] = useState<number>(settings.tarifa_mensalista || 280);
  const [diaVencimento, setDiaVencimento] = useState<number>(10);
  const [observacoes, setObservacoes] = useState('');

  const mensalistas = customers.filter(c => c.tipo === 'mensalista');

  const filteredMensalistas = mensalistas.filter(m => {
    const term = searchTerm.toLowerCase();
    return (
      m.nome.toLowerCase().includes(term) ||
      m.telefone.includes(term) ||
      (m.cpf && m.cpf.includes(term))
    );
  });

  const handleOpenNew = () => {
    setEditingCustomer(null);
    setNome('');
    setTelefone('');
    setCpf('');
    setEmail('');
    setMensalidadeValor(settings.tarifa_mensalista || 280);
    setDiaVencimento(10);
    setObservacoes('');
    setModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setNome(customer.nome);
    setTelefone(customer.telefone);
    setCpf(customer.cpf || '');
    setEmail(customer.email || '');
    setMensalidadeValor(customer.mensalidade_valor || settings.tarifa_mensalista || 280);
    setDiaVencimento(customer.dia_vencimento || 10);
    setObservacoes(customer.observacoes || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !telefone.trim()) return;

    const savedCustomer: Customer = {
      id: editingCustomer ? editingCustomer.id : `cust-${Date.now()}`,
      nome: nome.trim(),
      telefone: telefone.trim(),
      cpf: cpf.trim() || undefined,
      email: email.trim() || undefined,
      tipo: 'mensalista',
      mensalidade_valor: mensalidadeValor,
      dia_vencimento: diaVencimento,
      ativo: editingCustomer ? editingCustomer.ativo : true,
      consentimento_lgpd: true,
      observacoes: observacoes.trim() || undefined,
      created_at: editingCustomer?.created_at || new Date().toISOString(),
    };

    saveCustomer(savedCustomer);
    setModalOpen(false);
  };

  const toggleStatus = (customer: Customer) => {
    saveCustomer({
      ...customer,
      ativo: !customer.ativo,
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Gestão de Mensalistas</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-semibold border border-blue-500/30">
              {mensalistas.length} contratos
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastro de mensalistas, controle de mensalidades e liberação expressa
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Mensalista</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Buscar mensalista por nome, telefone ou CPF..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* List / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredMensalistas.map(customer => {
          const linkedVehicles = vehicles.filter(v => v.cliente_id === customer.id);

          return (
            <div
              key={customer.id}
              className={`bg-slate-900/90 border rounded-2xl p-4 transition-all duration-200 shadow-md flex flex-col justify-between ${
                customer.ativo ? 'border-slate-800' : 'border-slate-800/40 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight">
                        {customer.nome}
                      </h4>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {formatPhone(customer.telefone)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleStatus(customer)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase transition-colors ${
                      customer.ativo
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}
                  >
                    {customer.ativo ? 'Ativo' : 'Suspenso'}
                  </button>
                </div>

                {/* Plan Info */}
                <div className="mt-3 grid grid-cols-2 gap-2 p-2.5 bg-slate-950/70 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Mensalidade:</span>
                    <span className="font-bold text-emerald-400 font-mono text-sm">
                      {formatBRL(customer.mensalidade_valor || settings.tarifa_mensalista)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Vencimento:</span>
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Dia {customer.dia_vencimento || 10}
                    </span>
                  </div>
                </div>

                {/* Linked Vehicles */}
                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                    Veículos Vinculados:
                  </span>
                  {linkedVehicles.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">
                      Nenhum veículo vinculado ainda
                    </span>
                  ) : (
                    <div className="space-y-1.5">
                      {linkedVehicles.map(v => (
                        <div
                          key={v.id}
                          className="flex items-center justify-between p-2 bg-slate-950/50 rounded-lg border border-slate-800 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Car className="w-3.5 h-3.5 text-blue-400" />
                            <span className="font-mono font-bold text-white tracking-wide">
                              {formatPlate(v.placa)}
                            </span>
                            <span className="text-slate-400 truncate max-w-[120px]">
                              {v.modelo}
                            </span>
                          </div>
                          <button
                            onClick={() => onQuickCheckIn(v)}
                            className="px-2 py-0.5 bg-blue-600/30 hover:bg-blue-600/60 text-blue-300 font-semibold rounded text-[11px] transition-colors"
                            title="Dar entrada rápida com este veículo"
                          >
                            Entrar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {customer.observacoes && (
                  <p className="mt-2 text-[11px] text-slate-400 bg-slate-950/40 p-1.5 rounded border border-slate-800/60">
                    {customer.observacoes}
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex justify-end gap-2">
                <button
                  onClick={() => handleEdit(customer)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal New / Edit Mensalista */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 my-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">
                  {editingCustomer ? 'Editar Mensalista' : 'Novo Mensalista'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Nome Completo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Telefone/WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={telefone}
                    onChange={e => setTelefone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">CPF</label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={e => setCpf(e.target.value)}
                    placeholder="123.456.789-00"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Valor Mensalidade (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={mensalidadeValor}
                    onChange={e => setMensalidadeValor(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Dia do Vencimento
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={diaVencimento}
                    onChange={e => setDiaVencimento(parseInt(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Observações (Vaga fixa, restrições)
                </label>
                <input
                  type="text"
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  placeholder="Ex: Vaga A-10 no subsolo"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
                />
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
                  Salvar Mensalista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
