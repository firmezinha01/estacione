import React, { useState } from 'react';
import {
  QrCode,
  Search,
  CheckCircle2,
  Clock,
  Car,
  AlertTriangle,
  Receipt,
  ArrowLeft,
  Camera,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { Entry } from '../../types/parking';
import { calculateTariff } from '../../services/tariffCalculator';
import { formatBRL, formatDateTime, extractTicketCode } from '../../utils/formatters';

interface TicketValidatorPublicProps {
  onBack: () => void;
  onOpenScanner: () => void;
  initialCode?: string;
  onProceedToCheckout?: (entry: Entry) => void;
}

export const TicketValidatorPublic: React.FC<TicketValidatorPublicProps> = ({
  onBack,
  onOpenScanner,
  initialCode = '',
  onProceedToCheckout,
}) => {
  const { entries, settings, activeEntries } = useParking();
  const [code, setCode] = useState(initialCode);
  const [searchedEntry, setSearchedEntry] = useState<Entry | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const doSearch = (query: string) => {
    if (!query.trim()) {
      setSearchedEntry(null);
      setHasSearched(false);
      return;
    }

    const cleanInput = extractTicketCode(query);
    const cleanSearchPlate = cleanInput.replace(/[^A-Z0-9]/g, '');

    const found = entries.find(e => {
      const ticketCode = e.label?.codigo_unico?.toUpperCase();
      const entryIdPrefix = e.id.substring(0, 8).toUpperCase();
      const plateClean = e.vehicle?.placa?.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return (
        ticketCode === cleanInput ||
        entryIdPrefix === cleanInput ||
        (plateClean && plateClean === cleanSearchPlate)
      );
    });

    setSearchedEntry(found || null);
    setHasSearched(true);
  };

  React.useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      doSearch(initialCode);
    }
  }, [initialCode, entries]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    doSearch(code);
  };

  const isMensalista = searchedEntry?.vehicle?.cliente?.tipo === 'mensalista';
  const calc = searchedEntry
    ? calculateTariff(
        searchedEntry.horario_entrada,
        searchedEntry.horario_saida || new Date(),
        searchedEntry.vehicle?.tipo || 'carro',
        isMensalista,
        settings,
        {
          tipo_cobranca: searchedEntry.tipo_cobranca,
          valor_diaria_fixa: searchedEntry.valor_diaria_fixa,
          pago_na_entrada: searchedEntry.pago_na_entrada,
        }
      )
    : null;

  return (
    <div className="max-w-xl mx-auto py-4 px-3 sm:px-0 space-y-5">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar ao Painel</span>
      </button>

      {/* Header card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 text-center shadow-lg">
        <div className="w-12 h-12 bg-emerald-600/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <QrCode className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Consulta & Validador de Ticket</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Aponte a câmera para ler o QR Code ou digite o código/placa para consultar o status
        </p>

        {/* Big prominent Camera button */}
        <div className="mt-3.5 mb-2">
          <button
            type="button"
            onClick={onOpenScanner}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Abrir Câmera / Escanear QR Code</span>
          </button>
        </div>

        {/* Input & Search Form */}
        <form onSubmit={handleSearch} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Digite código (ex: EST-8B7C52) ou Placa..."
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow"
          >
            Consultar
          </button>
        </form>

        {/* Yard vehicle quick shortcuts */}
        {activeEntries.length > 0 && !searchedEntry && (
          <div className="mt-5 pt-4 border-t border-slate-800 text-left">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Ou selecione um veículo no pátio para validar:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeEntries.slice(0, 4).map(e => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => {
                    const c = e.label?.codigo_unico || e.vehicle?.placa || '';
                    setCode(c);
                    doSearch(c);
                  }}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-600/60 rounded-xl text-left flex items-center justify-between transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-white text-xs block">
                      {e.vehicle?.placa}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {e.vehicle?.modelo}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded">
                    {e.label?.codigo_unico}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result Card */}
      {hasSearched && (
        <div>
          {!searchedEntry ? (
            <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl text-center text-slate-400">
              <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <h3 className="font-bold text-white text-base">Ticket Não Localizado</h3>
              <p className="text-xs text-slate-500 mt-1">
                Nenhum veículo encontrado com o código ou placa "{code}".
              </p>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              {/* Status Header Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-400" />
                  <span className="font-mono font-bold text-xl text-white">
                    {searchedEntry.vehicle?.placa}
                  </span>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    searchedEntry.status === 'pago'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : searchedEntry.status === 'cancelado'
                      ? 'bg-red-950 text-red-300 border border-red-800'
                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}
                >
                  {searchedEntry.status === 'pago'
                    ? 'Saída Liberada'
                    : searchedEntry.status === 'cancelado'
                    ? 'Ticket Cancelado'
                    : 'Estadia Ativa'}
                </span>
              </div>

              {/* Vehicle & Customer details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Modelo / Cor:</span>
                  <span className="text-white font-medium">
                    {searchedEntry.vehicle?.modelo} {searchedEntry.vehicle?.cor ? `• ${searchedEntry.vehicle?.cor}` : ''}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Código do Ticket:</span>
                  <span className="text-blue-400 font-mono font-bold">
                    {searchedEntry.label?.codigo_unico}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Horário de Entrada:</span>
                  <span className="text-slate-200">
                    {formatDateTime(searchedEntry.horario_entrada)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tempo de Permanência:</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {calc?.tempoFormatado}
                  </span>
                </div>
              </div>

              {/* Financial Box */}
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    {searchedEntry.status === 'pago' ? 'Valor Total Pago:' : 'Valor Atual a Pagar:'}
                  </span>
                  <span className="text-2xl font-mono font-black text-emerald-400">
                    {searchedEntry.status === 'pago'
                      ? formatBRL(searchedEntry.valor_total)
                      : isMensalista
                      ? 'ISENTO (MENSALISTA)'
                      : formatBRL(calc?.valorFinal || 0)}
                  </span>
                </div>
                {searchedEntry.status === 'ativo' && onProceedToCheckout && (
                  <button
                    onClick={() => onProceedToCheckout(searchedEntry)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow"
                  >
                    Ir para Baixa / Caixa
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
