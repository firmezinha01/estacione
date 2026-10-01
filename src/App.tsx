import React, { useState } from 'react';
import { ParkingProvider, useParking } from './context/ParkingContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { VehicleEntryModal } from './components/entry/VehicleEntryModal';
import { TicketPrintModal } from './components/ticket/TicketPrintModal';
import { QrScannerModal } from './components/scanner/QrScannerModal';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { SupabaseModal } from './components/common/SupabaseModal';
import { LgpdModal } from './components/common/LgpdModal';
import { AttendantDashboard } from './pages/attendant/AttendantDashboard';
import { MensalistasPage } from './pages/attendant/MensalistasPage';
import { TicketValidatorPublic } from './pages/public/TicketValidatorPublic';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { TariffSettings } from './pages/admin/TariffSettings';
import { ReportsPage } from './pages/admin/ReportsPage';
import { UserManagement } from './pages/admin/UserManagement';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { LoginPage } from './pages/auth/LoginPage';
import { extractTicketCode } from './utils/formatters';
import { Entry, Vehicle } from './types/parking';

const MainContent: React.FC = () => {
  const { entries, settings, createVehicleEntry, isAuthenticated } = useParking();

  // Navigation
  const [activeTab, setActiveTab] = useState<string>('patio');

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isLgpdModalOpen, setIsLgpdModalOpen] = useState(false);

  // Printing Modal state
  const [printModalState, setPrintModalState] = useState<{
    entry: Entry | null;
    isOpen: boolean;
    isReceipt: boolean;
  }>({
    entry: null,
    isOpen: false,
    isReceipt: false,
  });

  // Checkout Modal state
  const [checkoutModalState, setCheckoutModalState] = useState<{
    entry: Entry | null;
    isOpen: boolean;
  }>({
    entry: null,
    isOpen: false,
  });

  const [validatorInitialCode, setValidatorInitialCode] = useState<string>('');

  // Handle entry creation: closes entry modal and opens ticket printer modal
  const handleEntrySuccess = (entry: Entry) => {
    setIsEntryModalOpen(false);
    setPrintModalState({
      entry,
      isOpen: true,
      isReceipt: false,
    });
  };

  // Handle checkout completion: offers to print receipt
  const handleCheckoutComplete = (entry: Entry) => {
    setCheckoutModalState({ entry: null, isOpen: false });
    setPrintModalState({
      entry,
      isOpen: true,
      isReceipt: true,
    });
  };

  // Handle QR scanner detection
  const handleQrScanSuccess = (decodedCode: string) => {
    const cleanCode = extractTicketCode(decodedCode);
    const cleanPlate = cleanCode.replace(/[^A-Z0-9]/g, '');

    // Search in entries
    const found = entries.find(e => {
      const ticket = e.label?.codigo_unico?.toUpperCase();
      const entryIdPrefix = e.id.substring(0, 8).toUpperCase();
      const plate = e.vehicle?.placa?.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return (
        ticket === cleanCode ||
        entryIdPrefix === cleanCode ||
        e.id.toUpperCase() === cleanCode ||
        (plate && plate === cleanPlate)
      );
    });

    if (found) {
      if (found.status === 'ativo') {
        // Open checkout directly for speed
        setCheckoutModalState({ entry: found, isOpen: true });
      } else {
        // Open validator to view paid receipt/status
        setValidatorInitialCode(cleanCode);
        setActiveTab('validador');
      }
    } else {
      // Open validator with searched code
      setValidatorInitialCode(cleanCode);
      setActiveTab('validador');
    }
  };

  // Quick check-in for mensalista vehicle
  const handleQuickMensalistaCheckIn = (vehicle: Vehicle) => {
    const { entry } = createVehicleEntry(
      {
        placa: vehicle.placa,
        modelo: vehicle.modelo,
        cor: vehicle.cor,
        tipo: vehicle.tipo,
        cliente_id: vehicle.cliente_id,
      },
      settings.impressora_padrao || '80mm',
      'Entrada expressa via cadastro de mensalista'
    );
    setPrintModalState({
      entry,
      isOpen: true,
      isReceipt: false,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenLgpdModal={() => setIsLgpdModalOpen(true)}
      />

      {/* Main Workspace with Sidebar & Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenEntryModal={() => setIsEntryModalOpen(true)}
          onOpenScannerModal={() => setIsScannerModalOpen(true)}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'patio' && (
            <AttendantDashboard
              onOpenEntryModal={() => setIsEntryModalOpen(true)}
              onOpenScannerModal={() => setIsScannerModalOpen(true)}
              onSelectEntryForPrint={entry =>
                setPrintModalState({ entry, isOpen: true, isReceipt: false })
              }
              onSelectEntryForCheckout={entry =>
                setCheckoutModalState({ entry, isOpen: true })
              }
            />
          )}

          {activeTab === 'mensalistas' && (
            <MensalistasPage onQuickCheckIn={handleQuickMensalistaCheckIn} />
          )}

          {activeTab === 'validador' && (
            <TicketValidatorPublic
              initialCode={validatorInitialCode}
              onBack={() => setActiveTab('patio')}
              onOpenScanner={() => setIsScannerModalOpen(true)}
              onProceedToCheckout={entry => setCheckoutModalState({ entry, isOpen: true })}
            />
          )}

          {activeTab === 'dashboard' && <AdminDashboard />}

          {activeTab === 'tarifas' && <TariffSettings />}

          {activeTab === 'relatorios' && (
            <ReportsPage
              onSelectEntryForPrint={(entry, isReceipt) =>
                setPrintModalState({ entry, isOpen: true, isReceipt })
              }
            />
          )}

          {activeTab === 'usuarios' && <UserManagement />}

          {activeTab === 'auditoria' && <AuditLogsPage />}
        </main>
      </div>

      {/* Modals */}
      <VehicleEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        onEntrySuccess={handleEntrySuccess}
      />

      <TicketPrintModal
        entry={printModalState.entry}
        settings={settings}
        isOpen={printModalState.isOpen}
        onClose={() => setPrintModalState({ entry: null, isOpen: false, isReceipt: false })}
        isReceipt={printModalState.isReceipt}
      />

      <CheckoutModal
        entry={checkoutModalState.entry}
        isOpen={checkoutModalState.isOpen}
        onClose={() => setCheckoutModalState({ entry: null, isOpen: false })}
        onCheckoutComplete={handleCheckoutComplete}
      />

      <QrScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onScanSuccess={handleQrScanSuccess}
      />

      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />

      <LgpdModal isOpen={isLgpdModalOpen} onClose={() => setIsLgpdModalOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ParkingProvider>
      <MainContent />
    </ParkingProvider>
  );
};

export default App;
