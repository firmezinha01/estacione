import React, { useState } from 'react';
import { ShieldCheck, UserX, Trash2, X, AlertCircle, CheckCircle } from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

interface LgpdModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LgpdModal: React.FC<LgpdModalProps> = ({ isOpen, onClose }) => {
  const { settings, customers, deleteCustomer } = useParking();
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDeleteClientData = () => {
    if (!selectedCustomerId) return;
    const target = customers.find(c => c.id === selectedCustomerId);
    if (!target) return;

    if (
      window.confirm(
        `Confirma a exclusão de todos os dados pessoais do cliente ${target.nome} nos termos da LGPD (Direito ao Esquecimento)?`
      )
    ) {
      deleteCustomer(selectedCustomerId);
      setSuccessNotice(`Dados de ${target.nome} excluídos com sucesso e ação registrada no log de auditoria.`);
      setSelectedCustomerId('');
      setTimeout(() => setSuccessNotice(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 my-auto">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Privacidade & Conformidade LGPD</h3>
              <p className="text-xs text-slate-400">Lei Geral de Proteção de Dados (Lei nº 13.709/2018)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 space-y-4 text-xs">
          {/* Term description */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5 leading-relaxed text-slate-300">
            <span className="font-bold text-white block text-sm">Política de Minimização e Uso de Dados:</span>
            <p>{settings.lgpd_termo}</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pt-1">
              <li>Dados coletados: Placa do veículo, modelo e dados de contato de mensalistas.</li>
              <li>Finalidade: Segurança patrimonial do pátio e controle fiscal das estadias.</li>
              <li>Não compartilhamento: Seus dados não são vendidos nem compartilhados com terceiros.</li>
            </ul>
          </div>

          {/* Right to be forgotten / Deletion */}
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300 text-sm">
              <UserX className="w-4 h-4" />
              <span>Direito ao Esquecimento (Exclusão do Titular):</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Se um cliente solicitar formalmente a remoção do seu cadastro nos termos da LGPD, selecione abaixo para excluir seus dados pessoais. O registro é auditado.
            </p>

            <div className="flex gap-2 pt-1">
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="">Selecione o cliente para excluir...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.telefone})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleDeleteClientData}
                disabled={!selectedCustomerId}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
            </div>
          </div>

          {successNotice && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
