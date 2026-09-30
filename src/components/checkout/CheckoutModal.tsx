import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  Banknote,
  QrCode,
  Clock,
  Car,
  Receipt,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowRight,
  Printer,
  Percent,
  PlusCircle,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { Entry, PaymentMethod } from '../../types/parking';
import { calculateTariff } from '../../services/tariffCalculator';
import { formatBRL, formatDateTime, formatDurationMinutes } from '../../utils/formatters';

interface CheckoutModalProps {
  entry: Entry | null;
  isOpen: boolean;
  onClose: () => void;
  onCheckoutComplete: (entry: Entry) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  entry,
  isOpen,
  onClose,
  onCheckoutComplete,
}) => {
  const { settings, checkoutEntry } = useParking();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [desconto, setDesconto] = useState<number>(0);
  const [acrescimo, setAcrescimo] = useState<number>(0);
  const [dinheiroRecebido, setDinheiroRecebido] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !entry) return null;

  // Single-use security check
  const isAlreadyPaid = entry.status === 'pago';
  const isCancelled = entry.status === 'cancelado';

  // Calculate live fee
  const isMensalista = entry.vehicle?.cliente?.tipo === 'mensalista';
  const calcResult = calculateTariff(
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

  const valorBase = calcResult.valorFinal;
  const valorFinal = Math.max(0, valorBase - desconto + acrescimo);

  // Cash change calculation
  const valorRecebidoNum = parseFloat(dinheiroRecebido) || 0;
  const troco = Math.max(0, valorRecebidoNum - valorFinal);

  const handleConfirmCheckout = () => {
    setErrorMsg(null);

    if (isAlreadyPaid) {
      setErrorMsg('ATENÇÃO: Este ticket já foi finalizado e baixado anteriormente! Não é permitida a reutilização.');
      return;
    }

    if (isCancelled) {
      setErrorMsg('Este ticket consta como cancelado no sistema.');
      return;
    }

    const result = checkoutEntry(entry.id, paymentMethod, valorFinal, desconto, acrescimo);

    if (!result.success) {
      setErrorMsg(result.message);
      return;
    }

    // Success fireworks
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // Ignore confetti error
    }

    if (result.entry) {
      onCheckoutComplete(result.entry);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Baixa e Pagamento de Saída</h3>
              <p className="text-xs text-slate-400">
                Ticket: {entry.label?.codigo_unico || entry.id.substring(0, 8)} • Placa: {entry.vehicle?.placa}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Warning if Already Paid / Reused */}
        {isAlreadyPaid && (
          <div className="my-3 p-3 bg-red-950/70 border border-red-800 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-red-300">TICKET JÁ UTILIZADO E DADO BAIXA!</div>
              <div>
                Este veículo já teve a saída confirmada em{' '}
                {formatDateTime(entry.horario_saida)}. A reutilização de QR Code foi bloqueada pelo sistema.
              </div>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="my-3 p-3 bg-red-950/70 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Vehicle & Stay Overview */}
        <div className="my-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Placa</span>
            <span className="font-mono font-bold text-sm text-white">
              {entry.vehicle?.placa || 'SEM PLACA'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Categoria</span>
            <span className="font-semibold text-slate-200 capitalize">
              {entry.vehicle?.tipo || 'Carro'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Entrada</span>
            <span className="font-semibold text-slate-200">
              {formatDateTime(entry.horario_entrada)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Tempo Decorrido</span>
            <span className="font-bold text-amber-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {calcResult.tempoFormatado}
            </span>
          </div>
        </div>

        {/* Mensalista Banner */}
        {isMensalista && (
          <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Cliente Mensalista:</strong> Vaga inclusa no plano mensal ({entry.vehicle?.cliente?.nome}). Cobrança zerada.
            </span>
          </div>
        )}

        {/* Prepaid Daily Rate Banner */}
        {entry.pago_na_entrada && (
          <div className="mb-4 p-3 bg-emerald-950/70 border border-emerald-700 rounded-xl text-xs text-emerald-200 flex items-center gap-2.5 shadow-md">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <strong className="text-white block text-sm">Diária Fixa Pré-paga na Entrada:</strong>
              <span>
                Valor de {formatBRL(entry.valor_diaria_fixa || entry.valor_total)} já foi quitado na entrada via{' '}
                {entry.payment?.metodo ? entry.payment.metodo.toUpperCase() : 'PAGAMENTO ANTECIPADO'}. Valor a cobrar na saída: <strong>R$ 0,00</strong>.
              </span>
            </div>
          </div>
        )}

        {/* Fixed Daily Rate (Unpaid) Banner */}
        {entry.tipo_cobranca === 'diaria_fixa' && !entry.pago_na_entrada && (
          <div className="mb-4 p-3 bg-purple-950/50 border border-purple-800 rounded-xl text-xs text-purple-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              <strong>Diária Fixa:</strong> Tarifa fixa acordada na entrada de {formatBRL(entry.valor_diaria_fixa || settings.tarifa_diaria)}.
            </span>
          </div>
        )}

        {/* Calculation Rule Badge */}
        <div className="mb-4 flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl text-xs text-slate-300">
          <span>Regra de Cobrança:</span>
          <span className="font-semibold text-blue-400">{calcResult.descricaoRegra}</span>
        </div>

        {/* Financial Breakdown */}
        <div className="mb-4 space-y-2 p-3 bg-slate-950/50 border border-slate-800 rounded-xl text-xs">
          <div className="flex justify-between text-slate-300">
            <span>Tarifa Calculada:</span>
            <span className="font-mono font-semibold">{formatBRL(valorBase)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
            <div>
              <label className="text-[11px] text-slate-400 block mb-0.5">Desconto (R$):</label>
              <input
                type="number"
                min="0"
                step="0.50"
                value={desconto || ''}
                onChange={e => setDesconto(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0,00"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-0.5">Acréscimo/Multa (R$):</label>
              <input
                type="number"
                min="0"
                step="0.50"
                value={acrescimo || ''}
                onChange={e => setAcrescimo(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0,00"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-sm font-bold text-white">
            <span>VALOR A PAGAR:</span>
            <span className="text-xl font-mono text-emerald-400">{formatBRL(valorFinal)}</span>
          </div>
        </div>

        {/* Payment Method Selector */}
        {!isAlreadyPaid && (
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('pix')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-all font-medium ${
                  paymentMethod === 'pix'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <QrCode className="w-4 h-4 mb-1 text-emerald-400" />
                <span>PIX</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('dinheiro')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-all font-medium ${
                  paymentMethod === 'dinheiro'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Banknote className="w-4 h-4 mb-1 text-green-400" />
                <span>Dinheiro</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cartao_credito')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-all font-medium ${
                  paymentMethod === 'cartao_credito'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4 mb-1 text-blue-400" />
                <span>C. Crédito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cartao_debito')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-all font-medium ${
                  paymentMethod === 'cartao_debito'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4 mb-1 text-cyan-400" />
                <span>C. Débito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('faturado')}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs transition-all font-medium ${
                  paymentMethod === 'faturado'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Receipt className="w-4 h-4 mb-1 text-purple-400" />
                <span>Mensalista</span>
              </button>
            </div>
          </div>
        )}

        {/* Change Calculator for Cash */}
        {!isAlreadyPaid && paymentMethod === 'dinheiro' && valorFinal > 0 && (
          <div className="mb-4 p-3 bg-slate-950/80 border border-slate-800 rounded-xl grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Valor Recebido em Dinheiro:</label>
              <input
                type="number"
                min="0"
                step="0.50"
                value={dinheiroRecebido}
                onChange={e => setDinheiroRecebido(e.target.value)}
                placeholder="Ex: 50.00"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono focus:outline-none"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Troco a Devolver:</span>
              <span
                className={`font-mono text-base font-bold block pt-1 ${
                  troco > 0 ? 'text-amber-400' : 'text-slate-500'
                }`}
              >
                {formatBRL(troco)}
              </span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition-colors"
          >
            Fechar
          </button>
          {!isAlreadyPaid && (
            <button
              type="button"
              onClick={handleConfirmCheckout}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {entry.pago_na_entrada && valorFinal === 0
                  ? 'Confirmar Liberação de Saída (R$ 0,00)'
                  : 'Confirmar Pagamento e Baixa'}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
