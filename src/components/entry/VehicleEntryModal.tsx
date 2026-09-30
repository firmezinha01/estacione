import React, { useState, useEffect } from 'react';
import {
  Car,
  Bike,
  Truck,
  Shield,
  Printer,
  X,
  CheckCircle2,
  UserCheck,
  Calendar,
  DollarSign,
  QrCode,
  Banknote,
  CreditCard,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { PaymentMethod, PrinterSize, VehicleType } from '../../types/parking';
import { formatBRL, formatPlate, isValidPlate } from '../../utils/formatters';

interface VehicleEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEntrySuccess: (entry: any) => void;
}

export const VehicleEntryModal: React.FC<VehicleEntryModalProps> = ({
  isOpen,
  onClose,
  onEntrySuccess,
}) => {
  const { createVehicleEntry, vehicles, customers, settings } = useParking();

  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [cor, setCor] = useState('');
  const [tipo, setTipo] = useState<VehicleType>('carro');
  const [clienteId, setClienteId] = useState<string>('');
  const [printerSize, setPrinterSize] = useState<PrinterSize>(settings.impressora_padrao || '80mm');
  const [observacoes, setObservacoes] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState<any>(null);

  // Fixed daily rate & prepayment fields
  const [valorDiaria, setValorDiaria] = useState<string>('');
  const [pagoNaEntrada, setPagoNaEntrada] = useState<boolean>(false);
  const [metodoPagamentoEntrada, setMetodoPagamentoEntrada] = useState<PaymentMethod>('pix');
  const [dinheiroEntradaRecebido, setDinheiroEntradaRecebido] = useState<string>('');

  // Reset form when modal opens & register ESC key
  useEffect(() => {
    if (isOpen) {
      setPlaca('');
      setModelo('');
      setCor('');
      setTipo('carro');
      setClienteId('');
      setObservacoes('');
      setMatchedCustomer(null);
      setPrinterSize(settings.impressora_padrao || '80mm');
      setValorDiaria('');
      setPagoNaEntrada(false);
      setMetodoPagamentoEntrada('pix');
      setDinheiroEntradaRecebido('');

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, settings.impressora_padrao, onClose]);

  // Auto-detect existing vehicle on plate typing
  const handlePlateChange = (val: string) => {
    const formatted = formatPlate(val);
    setPlaca(formatted);

    const clean = formatted.replace(/[^A-Z0-9]/g, '');
    const found = vehicles.find(v => v.placa.replace(/[^A-Z0-9]/g, '') === clean);
    if (found) {
      setModelo(found.modelo || '');
      setCor(found.cor || '');
      setTipo(found.tipo || 'carro');
      if (found.cliente_id) {
        setClienteId(found.cliente_id);
        const cust = customers.find(c => c.id === found.cliente_id);
        setMatchedCustomer(cust);
      }
    } else {
      setMatchedCustomer(null);
    }
  };

  const handleCustomerSelect = (id: string) => {
    setClienteId(id);
    const cust = customers.find(c => c.id === id);
    setMatchedCustomer(cust || null);
  };

  const valorDiariaNum = parseFloat(valorDiaria) || 0;
  const isDiariaFixa = valorDiariaNum > 0;

  // Change calculation for prepaid cash
  const dinheiroNum = parseFloat(dinheiroEntradaRecebido) || 0;
  const trocoEntrada = Math.max(0, dinheiroNum - valorDiariaNum);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placa.trim()) return;

    const diariaOptions = isDiariaFixa
      ? {
          tipo_cobranca: 'diaria_fixa' as const,
          valor_diaria_fixa: valorDiariaNum,
          pago_na_entrada: pagoNaEntrada,
          metodo_pagamento_entrada: pagoNaEntrada ? metodoPagamentoEntrada : undefined,
        }
      : {
          tipo_cobranca: 'tempo' as const,
          valor_diaria_fixa: null,
          pago_na_entrada: false,
        };

    const { entry } = createVehicleEntry(
      {
        placa: placa.toUpperCase().trim(),
        modelo: modelo.trim() || 'Modelo Não Informado',
        cor: cor.trim() || 'Cor Não Informada',
        tipo,
        cliente_id: clienteId || undefined,
      },
      printerSize,
      observacoes.trim() || undefined,
      diariaOptions
    );

    onEntrySuccess(entry);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Nova Entrada de Veículo</h3>
              <p className="text-xs text-slate-400">Cadastre a entrada, diária pré-paga e emita o ticket</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Plate Input with Mercosul Flag */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-300">
                Placa do Veículo (Mercosul ou Padrão) <span className="text-red-400">*</span>
              </label>
              {placa && isValidPlate(placa) && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Placa válida
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={8}
                placeholder="Ex: BRA2E19 ou ABC-1234"
                value={placa}
                onChange={e => handlePlateChange(e.target.value)}
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 text-lg font-mono font-bold tracking-widest text-white uppercase placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Mensalista auto-match banner */}
          {matchedCustomer && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/80 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
              <UserCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <div>
                <span className="font-bold">{matchedCustomer.nome}</span>
                {matchedCustomer.tipo === 'mensalista' ? (
                  <span className="ml-2 px-1.5 py-0.5 bg-emerald-600/30 text-emerald-300 rounded font-semibold text-[10px] uppercase">
                    Cliente Mensalista (Isento de Avulso)
                  </span>
                ) : (
                  <span className="ml-2 text-slate-400">Cliente Cadastrado</span>
                )}
              </div>
            </div>
          )}

          {/* Vehicle Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Categoria do Veículo
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setTipo('carro')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs font-medium ${
                  tipo === 'carro'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Car className="w-5 h-5 mb-1" />
                <span>Carro</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('moto')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs font-medium ${
                  tipo === 'moto'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Bike className="w-5 h-5 mb-1" />
                <span>Moto</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('camionete')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs font-medium ${
                  tipo === 'camionete'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Truck className="w-5 h-5 mb-1" />
                <span>Camionete</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('outros')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs font-medium ${
                  tipo === 'outros'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Shield className="w-5 h-5 mb-1" />
                <span>Outros</span>
              </button>
            </div>
          </div>

          {/* Model and Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Modelo do Veículo
              </label>
              <input
                type="text"
                placeholder="Ex: Corolla, Onix, HB20..."
                value={modelo}
                onChange={e => setModelo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cor</label>
              <input
                type="text"
                placeholder="Ex: Prata, Preto, Branco..."
                value={cor}
                onChange={e => setCor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Customer Association */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Vincular Cliente (Opcional)
            </label>
            <select
              value={clienteId}
              onChange={e => handleCustomerSelect(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="">Cliente Avulso (Sem cadastro)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome} {c.tipo === 'mensalista' ? '★ MENSALISTA' : ''} ({c.telefone})
                </option>
              ))}
            </select>
          </div>

          {/* ======================================================== */}
          {/* FIELD: VALOR DA DIÁRIA FIXA & PAGAMENTO ADIANTADO */}
          {/* ======================================================== */}
          <div
            className={`p-3.5 rounded-xl border transition-all ${
              isDiariaFixa
                ? 'bg-slate-950 border-emerald-500/70 shadow-md ring-1 ring-emerald-500/30'
                : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <span>Cobrar Valor Fixo de Diária (Opcional):</span>
              </label>

              {isDiariaFixa ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  DIÁRIA FIXA
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" />
                  Cobrança por Tempo
                </span>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400 font-mono">
                R$
              </span>
              <input
                type="number"
                min="0"
                step="1.00"
                placeholder={`Ex: ${settings.tarifa_diaria.toFixed(2)} (deixe em branco para cobrar por tempo)`}
                value={valorDiaria}
                onChange={e => setValorDiaria(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white font-mono font-bold focus:outline-none transition-colors"
              />
            </div>

            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              * Se preencher um valor, o veículo terá tarifa fixa de diária. Caso{' '}
              <strong className="text-slate-200">não preencha</strong>, será cobrado automaticamente
              pelo tempo de permanência (horas e frações).
            </p>

            {/* Sub-section: Pagamento Adiantado na Entrada */}
            {isDiariaFixa && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={pagoNaEntrada}
                    onChange={e => setPagoNaEntrada(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded bg-slate-900 border-slate-700 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      Pagamento Adiantado (Cliente paga agora na entrada)
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      A saída será liberada automaticamente com valor R$ 0,00 no caixa
                    </span>
                  </div>
                </label>

                {pagoNaEntrada && (
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-emerald-900/80 space-y-2.5 animate-fadeIn">
                    <span className="text-[11px] font-semibold text-slate-300 block">
                      Forma de Pagamento Adiantado:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => setMetodoPagamentoEntrada('pix')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border font-medium transition-all ${
                          metodoPagamentoEntrada === 'pix'
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span>PIX</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMetodoPagamentoEntrada('dinheiro')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border font-medium transition-all ${
                          metodoPagamentoEntrada === 'dinheiro'
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5 text-green-400" />
                        <span>Dinheiro</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMetodoPagamentoEntrada('cartao_credito')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border font-medium transition-all ${
                          metodoPagamentoEntrada === 'cartao_credito'
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                        <span>C. Crédito</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMetodoPagamentoEntrada('cartao_debito')}
                        className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border font-medium transition-all ${
                          metodoPagamentoEntrada === 'cartao_debito'
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                        <span>C. Débito</span>
                      </button>
                    </div>

                    {/* Change calculator for cash prepayment */}
                    {metodoPagamentoEntrada === 'dinheiro' && (
                      <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-0.5">
                            Valor Recebido (R$):
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.50"
                            placeholder={valorDiariaNum.toFixed(2)}
                            value={dinheiroEntradaRecebido}
                            onChange={e => setDinheiroEntradaRecebido(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white font-mono focus:outline-none"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-0.5">
                            Troco a devolver:
                          </span>
                          <span
                            className={`font-mono font-bold block pt-1 ${
                              trocoEntrada > 0 ? 'text-amber-400 text-sm' : 'text-slate-500 text-xs'
                            }`}
                          >
                            {formatBRL(trocoEntrada)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Printer Format Selection */}
          <div className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Printer className="w-4 h-4 text-blue-400" />
              <span>Impressão de Ticket:</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPrinterSize('58mm')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  printerSize === '58mm'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                58mm
              </button>
              <button
                type="button"
                onClick={() => setPrinterSize('80mm')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  printerSize === '80mm'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                80mm
              </button>
            </div>
          </div>

          {/* Optional Observations */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Observações</label>
            <input
              type="text"
              placeholder="Ex: Avaria no para-choque, vaga especial..."
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!placa.trim()}
              className={`px-5 py-2.5 disabled:opacity-50 disabled:pointer-events-none text-white font-bold rounded-xl text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2 ${
                pagoNaEntrada
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>
                {pagoNaEntrada
                  ? `Receber ${formatBRL(valorDiariaNum)} e Emitir Ticket`
                  : isDiariaFixa
                  ? `Registrar Diária (${formatBRL(valorDiariaNum)}) e Emitir`
                  : 'Registrar e Emitir Ticket'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
