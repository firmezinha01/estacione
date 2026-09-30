import React, { useState } from 'react';
import {
  Printer,
  Smartphone,
  Bluetooth,
  Check,
  X,
  Copy,
  ExternalLink,
  Download,
  AlertCircle,
} from 'lucide-react';
import { Entry, PrinterSize, Settings } from '../../types/parking';
import { ThermalTicket } from './ThermalTicket';
import {
  buildReceiptEscPos,
  buildTicketEscPos,
  printViaRawBT,
  printViaWebBluetooth,
} from '../../services/escpos';
import { printThermalElement, openPrintWindow } from '../../services/printService';

interface TicketPrintModalProps {
  entry: Entry | null;
  settings: Settings;
  isOpen: boolean;
  onClose: () => void;
  isReceipt?: boolean;
}

export const TicketPrintModal: React.FC<TicketPrintModalProps> = ({
  entry,
  settings,
  isOpen,
  onClose,
  isReceipt = false,
}) => {
  const [size, setSize] = useState<PrinterSize>(settings.impressora_padrao || '80mm');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !entry) return null;

  // Direct thermal print via isolated iframe engine
  const handleDirectPrint = () => {
    setStatusMsg({ type: 'info', text: 'Enviando documento para a impressora...' });
    const success = printThermalElement('printable-ticket', size, isReceipt ? 'Recibo Estacionamento' : 'Ticket Estacionamento');
    if (success) {
      setStatusMsg({ type: 'success', text: '✅ Diálogo de impressão aberto com sucesso!' });
      setTimeout(() => setStatusMsg(null), 3000);
    } else {
      setStatusMsg({ type: 'error', text: 'Não foi possível disparar a impressão diretamente.' });
    }
  };

  // Popup window print fallback
  const handleOpenNewWindowPrint = () => {
    const el = document.getElementById('printable-ticket');
    if (el) {
      openPrintWindow(el, size, isReceipt ? 'Recibo Estacionamento' : 'Ticket Estacionamento');
    } else {
      window.print();
    }
  };

  // Web Bluetooth ESC/POS print
  const handleBluetoothPrint = async () => {
    try {
      setStatusMsg({ type: 'info', text: 'Buscando impressora Bluetooth...' });
      const payload = isReceipt
        ? buildReceiptEscPos(entry, settings, size)
        : buildTicketEscPos(entry, settings, size);

      await printViaWebBluetooth(payload);
      setStatusMsg({ type: 'success', text: '✅ Ticket enviado com sucesso via Bluetooth ESC/POS!' });
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: `Falha no Bluetooth: ${err.message || 'Impressora não conectada'}. Utilize o botão azul de Impressão Direta!`,
      });
      setTimeout(() => setStatusMsg(null), 5000);
    }
  };

  // Android RawBT intent print
  const handleRawBtPrint = () => {
    const payload = isReceipt
      ? buildReceiptEscPos(entry, settings, size)
      : buildTicketEscPos(entry, settings, size);
    printViaRawBT(payload);
  };

  const copyTicketCode = () => {
    const code = entry.label?.codigo_unico || entry.id;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-100 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 rounded-xl">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {isReceipt ? 'Imprimir Recibo de Saída' : 'Imprimir Ticket de Entrada'}
              </h3>
              <p className="text-xs text-slate-400">
                Ticket: <strong className="text-blue-300 font-mono">{entry.label?.codigo_unico}</strong> • Placa:{' '}
                <strong className="text-white font-mono">{entry.vehicle?.placa}</strong>
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

        {/* Printer Width Selector */}
        <div className="flex items-center justify-between my-3 p-2 bg-slate-800/60 rounded-xl">
          <span className="text-xs font-semibold text-slate-300">Formato da Bobina:</span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setSize('58mm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                size === '58mm'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
            >
              58mm (Portátil)
            </button>
            <button
              onClick={() => setSize('80mm')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                size === '80mm'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-700/50 text-slate-400 hover:text-white'
              }`}
            >
              80mm (Padrão)
            </button>
          </div>
        </div>

        {/* Ticket Thermal Preview Area */}
        <div className="my-3 max-h-[46vh] overflow-y-auto p-3 bg-slate-950/70 rounded-xl border border-slate-800 flex justify-center">
          <ThermalTicket entry={entry} settings={settings} size={size} isReceipt={isReceipt} />
        </div>

        {/* Status message */}
        {statusMsg && (
          <div
            className={`mb-3 p-2.5 text-xs rounded-xl font-medium text-center flex items-center justify-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                : statusMsg.type === 'error'
                ? 'bg-red-950/80 border border-red-800 text-red-300'
                : 'bg-blue-950/80 border border-blue-800 text-blue-300 animate-pulse'
            }`}
          >
            {statusMsg.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Primary Print Action */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <button
            onClick={handleDirectPrint}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-blue-600/30 active:scale-98 text-sm"
          >
            <Printer className="w-5 h-5" />
            <span>Imprimir Térmica Agora</span>
          </button>

          {/* Secondary Print Connectors */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={handleOpenNewWindowPrint}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl transition-colors text-xs"
              title="Abre o ticket em uma nova janela limpa para impressão"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Nova Janela</span>
            </button>

            <button
              onClick={handleBluetoothPrint}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl transition-colors text-xs"
              title="Conecta via Web Bluetooth diretamente em mini-impressoras (POS-58, MPT, etc.)"
            >
              <Bluetooth className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bluetooth ESC/POS</span>
            </button>

            <button
              onClick={handleRawBtPrint}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl transition-colors text-xs col-span-2 sm:col-span-1"
              title="Dispara para o aplicativo RawBT Print Service no celular Android"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              <span>App RawBT</span>
            </button>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={copyTicketCode}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Código copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código do Ticket</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Concluir / Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
