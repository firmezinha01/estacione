import React, { useState } from 'react';
import { ShieldCheck, Download, Search, RefreshCw, Terminal, User } from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { formatDateTime } from '../../utils/formatters';
import { exportAuditLogsToCsv } from '../../services/exportCsv';

export const AuditLogsPage: React.FC = () => {
  const { auditLogs, refreshData } = useParking();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(log => {
    const term = searchTerm.toLowerCase();
    const acao = log.acao.toLowerCase();
    const user = (log.usuario_nome || '').toLowerCase();
    const details = JSON.stringify(log.detalhes || {}).toLowerCase();
    return acao.includes(term) || user.includes(term) || details.includes(term);
  });

  const handleExport = () => {
    exportAuditLogsToCsv(filteredLogs, 'logs-auditoria-estacionamento.csv');
  };

  const getActionBadgeColor = (acao: string) => {
    if (acao.includes('EXCLUSAO') || acao.includes('CANCEL')) {
      return 'bg-red-950 text-red-300 border-red-800';
    }
    if (acao.includes('BAIXA') || acao.includes('PAGAMENTO')) {
      return 'bg-emerald-950 text-emerald-300 border-emerald-800';
    }
    if (acao.includes('ENTRADA')) {
      return 'bg-blue-950 text-blue-300 border-blue-800';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Logs de Auditoria & Segurança</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-semibold border border-emerald-500/30">
              {filteredLogs.length} eventos
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Rastreabilidade completa de todas as ações administrativas, financeiras e LGPD
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={refreshData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            title="Recarregar logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filtrar por ação (ex: BAIXA, ENTRADA, EXCLUSAO), operador ou detalhes..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Data e Hora</th>
                <th className="py-3 px-4">Operador</th>
                <th className="py-3 px-4">Ação Registrada</th>
                <th className="py-3 px-4">Detalhes da Transação</th>
                <th className="py-3 px-4">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Nenhum registro de log encontrado.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-400">
                      {formatDateTime(log.data_hora)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-white">
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>{log.usuario_nome || 'Sistema'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold uppercase ${getActionBadgeColor(
                          log.acao
                        )}`}
                      >
                        {log.acao}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 max-w-xs truncate">
                      {JSON.stringify(log.detalhes || {})}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                      {log.ip_origem || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
