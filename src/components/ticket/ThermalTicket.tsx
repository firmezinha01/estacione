import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Entry, PrinterSize, Settings } from '../../types/parking';
import { formatBRL, formatDateTime } from '../../utils/formatters';

interface ThermalTicketProps {
  entry: Entry;
  settings: Settings;
  size?: PrinterSize;
  isReceipt?: boolean;
}

export const ThermalTicket: React.FC<ThermalTicketProps> = ({
  entry,
  settings,
  size = '80mm',
  isReceipt = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const ticketCode = entry.label?.codigo_unico || entry.id;
    // Higher pixel dimensions to ensure crisp lines on 203 DPI thermal heads
    const qrPixelWidth = size === '58mm' ? 160 : 200;

    QRCode.toDataURL(ticketCode, {
      width: qrPixelWidth,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Erro gerando QR Code DataURL:', err));
  }, [entry, size]);

  const is58mm = size === '58mm';
  const widthClass = is58mm ? 'ticket-58mm' : 'ticket-80mm';
  const qrDisplayPx = is58mm ? '140px' : '175px';

  return (
    <div
      id="printable-ticket"
      className={`${widthClass} mx-auto bg-white text-black font-mono text-center shadow-lg border-2 border-black rounded p-3 selection:bg-none`}
      style={{
        letterSpacing: '0px',
        color: '#000000',
      }}
    >
      {/* Establishment Header */}
      <div className="font-black text-base uppercase tracking-tight text-black">
        {settings.nome_estabelecimento}
      </div>
      <div className="text-xs font-bold text-black mt-0.5">CNPJ: {settings.cnpj}</div>
      <div className="text-xs font-bold text-black leading-tight">{settings.endereco}</div>
      <div className="text-xs font-bold text-black">Tel: {settings.telefone}</div>

      <div className="border-t-2 border-dashed border-black my-2"></div>

      {/* Ticket / Receipt Header */}
      <div className="font-black text-sm uppercase tracking-wider text-black">
        {isReceipt ? '*** RECIBO DE PAGAMENTO ***' : '*** TICKET DE ENTRADA ***'}
      </div>
      <div className="text-xs font-black text-black font-mono">
        Nº {entry.label?.codigo_unico || entry.id.substring(0, 8).toUpperCase()}
      </div>

      <div className="border-t-2 border-dashed border-black my-2"></div>

      {/* Vehicle Info */}
      <div className="text-xs font-bold text-black uppercase tracking-wider">PLACA DO VEÍCULO</div>
      <div className="font-black text-3xl tracking-widest text-black my-1 font-mono border-2 border-black py-1 px-3 inline-block rounded bg-white">
        {entry.vehicle?.placa || 'SEM PLACA'}
      </div>
      <div className="text-xs font-bold text-black mt-1">
        {entry.vehicle?.modelo} {entry.vehicle?.cor ? `• ${entry.vehicle?.cor}` : ''}
      </div>
      <div className="text-xs font-bold text-black uppercase">
        Categoria: {entry.vehicle?.tipo || 'Carro'}
      </div>

      {entry.vehicle?.cliente && (
        <div className="mt-1 pt-1 border-t border-dashed border-black text-xs font-bold text-black">
          <div>Cliente: {entry.vehicle.cliente.nome}</div>
          {entry.vehicle.cliente.telefone && (
            <div>WhatsApp: {entry.vehicle.cliente.telefone}</div>
          )}
          {entry.vehicle.cliente.tipo === 'mensalista' && (
            <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase rounded mt-0.5">
              MENSALISTA LIBERADO
            </div>
          )}
        </div>
      )}

      <div className="border-t-2 border-dashed border-black my-2"></div>

      {/* Entry Time / Times */}
      <div className="text-xs text-left space-y-1 text-black font-bold">
        <div className="flex justify-between items-center">
          <span>Entrada:</span>
          <span className="font-black font-mono text-black">{formatDateTime(entry.horario_entrada)}</span>
        </div>

        {isReceipt && entry.horario_saida && (
          <>
            <div className="flex justify-between items-center">
              <span>Saída:</span>
              <span className="font-black font-mono text-black">{formatDateTime(entry.horario_saida)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Permanência:</span>
              <span className="font-black font-mono text-black">
                {Math.floor(entry.tempo_minutos / 60)}h {entry.tempo_minutos % 60}m
              </span>
            </div>
          </>
        )}
      </div>

      {/* Rates Table / Summary */}
      {!isReceipt ? (
        entry.tipo_cobranca === 'diaria_fixa' ? (
          <div className="my-2 p-2 border-2 border-black rounded text-xs text-left leading-snug text-black bg-white">
            <div className="font-black text-center text-black mb-1 text-xs">
              {entry.pago_na_entrada ? '★ DIÁRIA PRÉ-PAGA (PAGO NA ENTRADA) ★' : '★ TARIFA DIÁRIA FIXA ★'}
            </div>
            <div className="flex justify-between items-center text-sm font-black pt-0.5">
              <span>Valor da Diária:</span>
              <span className="font-mono text-base">{formatBRL(entry.valor_diaria_fixa || settings.tarifa_diaria)}</span>
            </div>
            {entry.pago_na_entrada ? (
              <div className="mt-1 pt-1 border-t border-dashed border-black text-xs font-black text-black text-center uppercase">
                PAGAMENTO CONFIRMADO ({entry.payment?.metodo?.toUpperCase() || 'QUITADO'})
                <div className="text-[10px] font-bold">Saída liberada sem cobrança adicional</div>
              </div>
            ) : (
              <div className="mt-1 pt-1 border-t border-dashed border-black text-xs font-bold text-center">
                Valor fixo a pagar na saída
              </div>
            )}
          </div>
        ) : (
          <div className="my-2 p-2 border-2 border-black rounded text-xs text-left leading-snug text-black bg-white">
            <div className="font-black text-center text-black mb-1">TABELA DE TARIFAS</div>
            <div className="flex justify-between font-bold">
              <span>Tolerância gratuita:</span>
              <span className="font-black font-mono">{settings.tolerancia_minutos} min</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>1ª Hora:</span>
              <span className="font-black font-mono">{formatBRL(settings.tarifa_hora)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Hora Adicional:</span>
              <span className="font-black font-mono">{formatBRL(settings.tarifa_adicional_hora)}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Diária (24h):</span>
              <span className="font-black font-mono">{formatBRL(settings.tarifa_diaria)}</span>
            </div>
          </div>
        )
      ) : (
        /* Receipt Payment Breakdown */
        <div className="my-2 p-2 border-2 border-black rounded text-xs text-left leading-snug text-black bg-white">
          <div className="flex justify-between font-bold">
            <span>Tarifa:</span>
            <span className="font-mono font-black">{formatBRL(entry.tarifa_calculada)}</span>
          </div>
          {entry.valor_desconto > 0 && (
            <div className="flex justify-between font-bold">
              <span>Desconto:</span>
              <span className="font-mono font-black">-{formatBRL(entry.valor_desconto)}</span>
            </div>
          )}
          {entry.valor_acrescimo > 0 && (
            <div className="flex justify-between font-bold">
              <span>Acréscimo:</span>
              <span className="font-mono font-black">+{formatBRL(entry.valor_acrescimo)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-base border-t-2 border-black pt-1 mt-1 font-mono">
            <span>TOTAL:</span>
            <span>{formatBRL(entry.valor_total)}</span>
          </div>
          {entry.payment && (
            <div className="mt-1 pt-1 border-t border-dashed border-black text-xs font-bold">
              <div>Forma de Pagto: {entry.payment.metodo.toUpperCase()}</div>
              <div>Comprovante: {entry.payment.comprovante_codigo}</div>
            </div>
          )}
        </div>
      )}

      {/* QR Code Section - EXACTLY ONE QR Code (No duplicates) */}
      <div className="my-2 flex flex-col items-center">
        {qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="QR Code"
            className="block mx-auto border-2 border-black p-0.5 bg-white"
            style={{
              width: qrDisplayPx,
              height: qrDisplayPx,
              imageRendering: 'pixelated',
            }}
          />
        ) : (
          <div
            className="flex items-center justify-center border-2 border-black bg-white text-xs font-bold"
            style={{ width: qrDisplayPx, height: qrDisplayPx }}
          >
            Gerando QR Code...
          </div>
        )}
        <div className="text-[11px] font-black text-black mt-1 uppercase tracking-wide">
          {isReceipt
            ? 'Comprovante emitido'
            : 'Apresente este QR Code no caixa ao sair'}
        </div>
      </div>

      <div className="border-t-2 border-dashed border-black my-2"></div>

      {/* Legal & Disclaimer Footer */}
      <div className="text-[10px] font-bold text-black leading-tight text-center">
        {settings.mensagem_rodape}
      </div>
      <div className="text-[9px] font-black text-black mt-1 uppercase text-center">
        Em conformidade com a LGPD • Proteção de dados
      </div>

      {/* Cut Guide Line */}
      <div className="mt-3 pt-1 border-b-2 border-dashed border-black text-[10px] font-black text-black text-center">
        ✂ - - - - - - - - - CORTE AQUI - - - - - - - - - ✂
      </div>
    </div>
  );
};
