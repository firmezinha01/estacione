import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, Search, AlertCircle, Upload } from 'lucide-react';
import { extractTicketCode } from '../../utils/formatters';

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
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerContainerId = 'qr-reader-container';

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    const timer = setTimeout(() => {
      startScanner();
    }, 250);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, cameraFacing]);

  const startScanner = async () => {
    try {
      setErrorMsg(null);
      if (scannerRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      // Dynamic qrbox to adapt seamlessly to mobile screens and orientation
      const config = {
        fps: 12,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.72);
          return {
            width: Math.max(160, Math.min(size, 280)),
            height: Math.max(160, Math.min(size, 280)),
          };
        },
      };

      // Attempt to pick matching camera device ID if available
      let cameraConfig: any = { facingMode: cameraFacing };
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          if (cameraFacing === 'environment') {
            const backCam = cameras.find(c => {
              const label = c.label.toLowerCase();
              return (
                label.includes('back') ||
                label.includes('traseira') ||
                label.includes('environment') ||
                label.includes('rear')
              );
            });
            if (backCam) cameraConfig = backCam.id;
          } else {
            const frontCam = cameras.find(c => {
              const label = c.label.toLowerCase();
              return (
                label.includes('front') ||
                label.includes('frontal') ||
                label.includes('user')
              );
            });
            if (frontCam) cameraConfig = frontCam.id;
          }
        }
      } catch (e) {
        // Fallback to facingMode constraint
      }

      await html5QrCode.start(
        cameraConfig,
        config,
        (decodedText: string) => {
          if (navigator.vibrate) {
            navigator.vibrate(150);
          }
          const cleanCode = extractTicketCode(decodedText);
          stopScanner();
          onScanSuccess(cleanCode);
          onClose();
        },
        (_errorMessage: string) => {
          // Regular frame without QR code
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.warn('Erro ao inicializar câmera do scanner:', err);
      setErrorMsg(
        'Não foi possível acessar a câmera. Verifique as permissões, envie uma foto do QR Code ou digite o código abaixo.'
      );
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        console.warn('Erro ao finalizar scanner:', err);
      } finally {
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
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
      setErrorMsg('Não foi possível identificar um QR Code legível na imagem. Digite o código manualmente.');
    }
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
        <div className="my-4 relative">
          <div
            id={scannerContainerId}
            className="w-full min-h-[260px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative flex items-center justify-center"
          >
            {!isScanning && !errorMsg && (
              <div className="text-xs text-slate-400 animate-pulse flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                <span>Iniciando câmera...</span>
              </div>
            )}
          </div>

          {/* Scanner targeting overlay reticle */}
          {isScanning && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
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
            <div className="absolute top-3 right-3 flex gap-2">
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

        {errorMsg && (
          <div className="mb-4 p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

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
