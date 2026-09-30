import React, { useState, useEffect } from 'react';
import {
  Car,
  Bike,
  Truck,
  Plus,
  QrCode,
  Search,
  Clock,
  Printer,
  CheckCircle,
  AlertCircle,
  XCircle,
  Filter,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { Entry, VehicleType } from '../../types/parking';
import { calculateTariff } from '../../services/tariffCalculator';
import { formatBRL, formatDateTime, formatPlate } from '../../utils/formatters';

interface AttendantDashboardProps {
  onOpenEntryModal: () => void;
  onOpenScannerModal: () => void;
  onSelectEntryForPrint: (entry: Entry) => void;
  onSelectEntryForCheckout: (entry: Entry) => void;
}

export const AttendantDashboard: React.FC<AttendantDashboardProps> = ({
  onOpenEntryModal,
  onOpenScannerModal,
  onSelectEntryForPrint,
  onSelectEntryForCheckout,
}) => {
  const { activeEntries, settings, cancelEntry, refreshData } = useParking();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update clock every 30 seconds for live minutes update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const handleCancel = (entry: Entry) => {
    const motivo = window.prompt(
      `Motivo do cancelamento da entrada do veículo ${entry.vehicle?.placa}:`,
      'Entrada digitada incorretamente'
    );
    if (motivo) {
      cancelEntry(entry.id, motivo);
    }
  };

  // Filter entries
  const filteredEntries = activeEntries.filter(entry => {
    const cleanSearch = searchTerm.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const plate = entry.vehicle?.placa?.toUpperCase().replace(/[^A-Z0-9]/g, '') || '';
    const ticket = entry.label?.codigo_unico?.toUpperCase().replace(/[^A-Z0-9]/g, '') || '';
    const customer = entry.vehicle?.cliente?.nome?.toUpperCase() || '';
    const model = entry.vehicle?.modelo?.toUpperCase() || '';

    const matchesSearch =
      !cleanSearch ||
      plate.includes(cleanSearch) ||
      ticket.includes(cleanSearch) ||
      customer.includes(cleanSearch) ||
      model.includes(cleanSearch);

    const matchesCategory =
      categoryFilter === 'all' ||
      (categoryFilter === 'mensalista' && entry.vehicle?.cliente?.tipo === 'mensalista') ||
      entry.vehicle?.tipo === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getVehicleIcon = (type?: VehicleType) => {
    switch (type) {
      case 'moto':
        return <Bike className="w-5 h-5 text-amber-400" />;
      case 'camionete':
        return <Truck className="w-5 h-5 text-purple-400" />;
      default:
        return <Car className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Quick Operations Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Controle de Pátio & Entradas</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-semibold border border-emerald-500/30">
              {activeEntries.length} veículos estacionados
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie entradas, reimpressão de etiquetas térmicas e baixas via QR Code
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenScannerModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
            title="Abrir leitor de QR Code pela câmera do celular ou notebook"
          >
            <QrCode className="w-4 h-4" />
            <span>Validar QR Code</span>
          </button>

          <button
            onClick={onOpenEntryModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Entrada</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por placa, ticket (ex: EST-...), cliente ou modelo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              categoryFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos ({activeEntries.length})
          </button>
          <button
            onClick={() => setCategoryFilter('carro')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              categoryFilter === 'carro'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Carros
          </button>
          <button
            onClick={() => setCategoryFilter('moto')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              categoryFilter === 'moto'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Motos
          </button>
          <button
            onClick={() => setCategoryFilter('camionete')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              categoryFilter === 'camionete'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Camionetes
          </button>
          <button
            onClick={() => setCategoryFilter('mensalista')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              categoryFilter === 'mensalista'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Mensalistas
          </button>
        </div>
      </div>

      {/* Active Vehicles List / Grid */}
      {filteredEntries.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
          <Car className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h3 className="text-base font-bold text-slate-200">Nenhum veículo encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? 'Nenhum resultado corresponde à sua pesquisa. Tente outro termo.'
              : 'O pátio está vazio no momento. Registre uma nova entrada acima.'}
          </p>
          {!searchTerm && (
            <button
              onClick={onOpenEntryModal}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow transition-all"
            >
              Registrar Entrada
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredEntries.map(entry => {
            const isMensalista = entry.vehicle?.cliente?.tipo === 'mensalista';
            const calc = calculateTariff(
              entry.horario_entrada,
              new Date(),
              entry.vehicle?.tipo || 'carro',
              isMensalista,
              settings,
              {
                tipo_cobranca: entry.tipo_cobranca,
                valor_diaria_fixa: entry.valor_diaria_fixa,
                pago_na_entrada: entry.pago_na_entrada,
              }
            );

            return (
              <div
                key={entry.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 shadow-md flex flex-col justify-between"
              >
                {/* Card Top: Plate, Icon & Category */}
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-slate-800 rounded-xl">
                        {getVehicleIcon(entry.vehicle?.tipo)}
                      </div>
                      <div>
                        <div className="font-mono font-black text-xl text-white tracking-wider">
                          {entry.vehicle?.placa}
                        </div>
                        <div className="text-xs text-slate-400 font-medium truncate max-w-[160px]">
                          {entry.vehicle?.modelo} {entry.vehicle?.cor ? `• ${entry.vehicle?.cor}` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Ticket Code Tag */}
                    <div className="text-right">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-slate-800 text-blue-300 rounded-md border border-slate-700 block">
                        {entry.label?.codigo_unico || entry.id.substring(0, 8)}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {entry.label?.impressora || '80mm'}
                      </span>
                    </div>
                  </div>

                  {/* Badges: Mensalista / Diária Fixa / Pré-paga */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
                    {entry.vehicle?.cliente && (
                      <span className="py-0.5 px-2 bg-slate-950/70 border border-slate-800 rounded text-xs text-slate-300 truncate max-w-[180px]">
                        {entry.vehicle.cliente.nome}
                      </span>
                    )}

                    {isMensalista && (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded">
                        MENSALISTA
                      </span>
                    )}

                    {entry.pago_na_entrada ? (
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950 border border-emerald-700 px-2 py-0.5 rounded flex items-center gap-1">
                        ★ DIÁRIA PAGA (R$ {entry.valor_diaria_fixa})
                      </span>
                    ) : entry.tipo_cobranca === 'diaria_fixa' ? (
                      <span className="text-[10px] font-bold text-purple-300 bg-purple-950 border border-purple-800 px-2 py-0.5 rounded">
                        DIÁRIA FIXA (R$ {entry.valor_diaria_fixa})
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80">
                        Por Tempo
                      </span>
                    )}
                  </div>

                  {/* Stay Metrics */}
                  <div className="mt-3 grid grid-cols-2 gap-2 py-2 border-y border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Entrada:</span>
                      <span className="font-medium text-slate-200">
                        {formatDateTime(entry.horario_entrada)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Permanência:</span>
                      <span className="font-bold text-amber-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {calc.tempoFormatado}
                      </span>
                    </div>
                  </div>

                  {/* Tariff Estimate */}
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {entry.pago_na_entrada ? 'Status no Caixa:' : 'Valor Atual:'}
                    </span>
                    <span
                      className={`text-base font-bold font-mono ${
                        entry.pago_na_entrada || isMensalista
                          ? 'text-emerald-400'
                          : calc.isTolerancia
                          ? 'text-blue-400'
                          : 'text-white'
                      }`}
                    >
                      {entry.pago_na_entrada
                        ? 'QUITADO (R$ 0,00)'
                        : isMensalista
                        ? 'ISENTO'
                        : calc.isTolerancia
                        ? 'Tolerância (R$ 0,00)'
                        : formatBRL(calc.valorFinal)}
                    </span>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => onSelectEntryForCheckout(entry)}
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow active:scale-95"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{entry.pago_na_entrada ? 'Liberar Saída' : 'Dar Baixa / Saída'}</span>
                  </button>

                  <button
                    onClick={() => onSelectEntryForPrint(entry)}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
                    title="Reimprimir Etiqueta Térmica"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleCancel(entry)}
                    className="p-2 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-300 rounded-xl transition-colors"
                    title="Cancelar Entrada"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
