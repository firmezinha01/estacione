import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Search,
  Filter,
  Printer,
  Calendar,
  DollarSign,
  Car,
  Clock,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { Entry } from '../../types/parking';
import { formatBRL, formatDateTime, formatDurationMinutes } from '../../utils/formatters';
import { exportEntriesToCsv } from '../../services/exportCsv';

interface ReportsPageProps {
  onSelectEntryForPrint: (entry: Entry, isReceipt: boolean) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ onSelectEntryForPrint }) => {
  const { entries } = useParking();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month' | 'all'>('all');

  // Filter entries
  const filteredEntries = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 7 * 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return entries.filter(e => {
      const entryTime = new Date(e.horario_entrada).getTime();

      // Date filter
      if (dateFilter === 'today' && entryTime < startOfToday) return false;
      if (dateFilter === '7days' && entryTime < sevenDaysAgo) return false;
      if (dateFilter === 'month' && entryTime < startOfMonth) return false;

      // Status filter
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const plate = e.vehicle?.placa?.toLowerCase() || '';
        const ticket = e.label?.codigo_unico?.toLowerCase() || '';
        const customer = e.vehicle?.cliente?.nome?.toLowerCase() || '';
        const model = e.vehicle?.modelo?.toLowerCase() || '';
        if (
          !plate.includes(term) &&
          !ticket.includes(term) &&
          !customer.includes(term) &&
          !model.includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [entries, searchTerm, statusFilter, dateFilter]);

  // Aggregate stats for filtered list
  const totalReceita = useMemo(() => {
    return filteredEntries
      .filter(e => e.status === 'pago')
      .reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
  }, [filteredEntries]);

  const handleExportCsv = () => {
    exportEntriesToCsv(filteredEntries, `relatorio-estacionamento-${dateFilter}.csv`);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Relatórios & Histórico de Estadias</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-semibold border border-blue-500/30">
              {filteredEntries.length} registros
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Histórico completo de entradas, saídas, tempo de permanência e arrecadação
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Exportar CSV Excel</span>
        </button>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs block">Receita no Período</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {formatBRL(totalReceita)}
            </span>
          </div>
          <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs block">Total de Veículos</span>
            <span className="text-xl font-mono font-black text-white">
              {filteredEntries.length}
            </span>
          </div>
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
            <Car className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs block">Tickets Concluídos</span>
            <span className="text-xl font-mono font-black text-blue-400">
              {filteredEntries.filter(e => e.status === 'pago').length}
            </span>
          </div>
          <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
            <FileText className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por placa, ticket, cliente ou modelo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setDateFilter('today')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              dateFilter === 'today'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setDateFilter('7days')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              dateFilter === '7days'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Últimos 7 dias
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              dateFilter === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Mês Atual
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
              dateFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Ticket</th>
                <th className="py-3 px-4">Veículo</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Entrada</th>
                <th className="py-3 px-4">Saída</th>
                <th className="py-3 px-4">Permanência</th>
                <th className="py-3 px-4">Valor Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Nenhum registro encontrado no período selecionado.
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => {
                  const isPaid = entry.status === 'pago';
                  const isCancelled = entry.status === 'cancelado';

                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                        {entry.label?.codigo_unico || entry.id.substring(0, 8)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-white">
                          {entry.vehicle?.placa}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          {entry.vehicle?.modelo}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {entry.vehicle?.cliente?.nome || (
                          <span className="text-slate-500">Avulso</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                        {formatDateTime(entry.horario_entrada)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-300">
                        {formatDateTime(entry.horario_saida)}
                      </td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap">
                        {formatDurationMinutes(entry.tempo_minutos)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                        {formatBRL(entry.valor_total)}
                        {entry.payment?.metodo && (
                          <span className="block text-[10px] text-slate-400 uppercase font-sans">
                            {entry.payment.metodo}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isPaid
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : isCancelled
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onSelectEntryForPrint(entry, isPaid)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
                          title={isPaid ? 'Imprimir Recibo de Pagamento' : 'Imprimir Ticket'}
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
