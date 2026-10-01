import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, Search, AlertCircle, Upload, CheckCircle2 } from 'lucide-react';
import { extractTicketCode } from '../../utils/formatters';
import { useParking } from '../../context/ParkingContext';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
  title?: string;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Escanear QR Code do Ticket',
}) => {
  const { activeEntries } = useParking();
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isScanning, setIsScanning] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerContainerId = 'qr-reader-container';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    // Delay slightly to ensure DOM element is mounted and styled
    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, cameraFacing]);

  const startScanner = async () => {
    try {
      setErrorMsg(null);
      setIsStarting(true);
      if (scannerRef.current) {
        await stopScanner();
      }

      // Check if container element exists in DOM
      const containerEl = document.getElementById(scannerContainerId);
      if (!containerEl) {
        setIsStarting(false);
        return;
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.72);
          return {
            width: Math.max(160, Math.min(size, 260)),
            height: Math.max(160, Math.min(size, 260)),
          };
        },
      };

      const handleScan = (decodedText: string) => {
        if (navigator.vibrate) {
          navigator.vibrate(150);
        }
        const cleanCode = extractTicketCode(decodedText);
        stopScanner();
        onScanSuccess(cleanCode);
        onClose();
      };

      let started = false;

      // Tier 1: Try device list via getCameras
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          let chosenId = cameras[0].id;
          if (cameraFacing === 'environment') {
            const backCam = cameras.find(c => {
              const label = (c.label || '').toLowerCase();
              return (
                label.includes('back') ||
                label.includes('traseira') ||
                label.includes('environment') ||
                label.includes('rear')
              );
            });
            if (backCam) chosenId = backCam.id;
          } else {
            const frontCam = cameras.find(c => {
              const label = (c.label || '').toLowerCase();
              return (
                label.includes('front') ||
                label.includes('frontal') ||
                label.includes('user')
              );
            });
            if (frontCam) chosenId = frontCam.id;
          }

          await html5QrCode.start(chosenId, config, handleScan, () => {});
          started = true;
        }
      } catch (camErr) {
        console.warn('Tentativa 1 (getCameras) falhou, tentando facingMode:', camErr);
      }

      // Tier 2: Try facingMode environment
      if (!started) {
        try {
          await html5QrCode.start({ facingMode: cameraFacing }, config, handleScan, () => {});
          started = true;
        } catch (faceErr) {
          console.warn('Tentativa 2 (facingMode) falhou, tentando facingMode user:', faceErr);
        }
      }

      // Tier 3: Fallback to facingMode user (desktop/laptop webcams)
      if (!started) {
        try {
          await html5QrCode.start({ facingMode: 'user' }, config, handleScan, () => {});
          started = true;
        } catch (userErr) {
          console.warn('Tentativa 3 (user webcam) falhou:', userErr);
          throw userErr;
        }
      }

      setIsScanning(true);
      setIsStarting(false);
    } catch (err: any) {
      console.warn('Erro ao inicializar câmera do scanner:', err);
      setErrorMsg(
        'Acesso à câmera indisponível neste navegador. Verifique permissões, envie uma foto do QR Code ou digite o código abaixo.'
      );
      setIsScanning(false);
      setIsStarting(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.warn('Erro ao parar scanner:', err);
      }
      try {
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Erro ao limpar container do scanner:', err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    setIsStarting(false);
  };

  const toggleCamera = () => {
    setCameraFacing(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    const cleanCode = extractTicketCode(manualCode.trim());
    stopScanner();
    onScanSuccess(cleanCode);
    onClose();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMsg(null);
      let html5QrCode = scannerRef.current;
      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
          ],
          verbose: false,
        });
        scannerRef.current = html5QrCode;
      } else if (html5QrCode.isScanning) {
        await html5QrCode.stop();
      }

      const decodedText = await html5QrCode.scanFile(file, true);
      if (decodedText) {
        const cleanCode = extractTicketCode(decodedText);
        stopScanner();
        onScanSuccess(cleanCode);
        onClose();
      }
    } catch (err: any) {
      console.warn('Erro ao escanear imagem:', err);
      setErrorMsg('Não foi possível identificar um QR Code nítido na imagem. Tente digitar o código.');
    }
  };

  const handleQuickSelectTicket = (ticketCode: string) => {
    stopScanner();
    onScanSuccess(ticketCode);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 sm:p-6 text-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">Aponte a câmera para o QR Code da etiqueta</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Scanner Viewport */}
        <div className="my-4 relative min-h-[260px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
          {/* Dedicated Html5Qrcode element with ZERO React children to avoid reconciliation wiping video */}
          <div id={scannerContainerId} className="w-full h-full min-h-[260px]" />

          {/* Loading overlay - Sibling to avoid DOM removal */}
          {isStarting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-xs text-slate-400 gap-2 pointer-events-none z-10">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
              <span>Iniciando câmera...</span>
            </div>
          )}

          {/* Error overlay - Sibling */}
          {errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/95 text-center z-10">
              <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
              <span className="text-xs text-amber-200">{errorMsg}</span>
            </div>
          )}

          {/* Scanner targeting overlay reticle */}
          {isScanning && !errorMsg && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
              <div className="w-52 h-52 border-2 border-emerald-500/80 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                <div className="absolute inset-x-2 top-1/2 h-0.5 bg-emerald-400/60 animate-pulse"></div>
              </div>
            </div>
          )}

          {/* Camera controls toolbar */}
          {isScanning && (
            <div className="absolute top-3 right-3 flex gap-2 z-20">
              <button
                onClick={toggleCamera}
                className="p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-lg backdrop-blur-sm border border-slate-700 shadow transition-all active:scale-90"
                title="Alternar Câmera Frontal / Traseira"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Upload QR image option */}
        <div className="mb-3 text-center">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors py-1 px-2.5 rounded-lg hover:bg-slate-800/60 border border-transparent hover:border-slate-700"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Carregar imagem/foto do QR Code</span>
          </button>
        </div>

        {/* Quick select active ticket shortcut for fast testing */}
        {activeEntries.length > 0 && (
          <div className="mb-3 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
              Ou selecione um veículo no pátio para validar:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {activeEntries.slice(0, 4).map(entry => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() =>
                    handleQuickSelectTicket(
                      entry.label?.codigo_unico || entry.vehicle?.placa || ''
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 hover:bg-blue-950/60 border border-slate-800 hover:border-blue-700 rounded-lg text-xs font-mono text-slate-200 transition-colors"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="font-bold">{entry.vehicle?.placa}</span>
                  <span className="text-[10px] text-slate-400">
                    ({entry.label?.codigo_unico})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual Input Fallback */}
        <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-800">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Ou digite o Código do Ticket ou Placa:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Ex: EST-8B7C52 ou HIL7X89"
                value={manualCode}
                onChange={e => setManualCode(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors uppercase font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none text-white font-semibold rounded-xl text-sm transition-all shadow active:scale-95 flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>Validar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
