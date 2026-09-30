import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AuditLog,
  Customer,
  Entry,
  Label,
  Payment,
  PrinterSize,
  Settings,
  User,
  Vehicle,
} from '../types/parking';
import { storage } from '../services/storage';

interface ParkingContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchUserRole: (role: 'admin' | 'atendente') => void;
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
  entries: Entry[];
  activeEntries: Entry[];
  vehicles: Vehicle[];
  customers: Customer[];
  auditLogs: AuditLog[];
  refreshData: () => void;
  createVehicleEntry: (
    vehicleData: { placa: string; modelo: string; cor: string; tipo: Vehicle['tipo']; cliente_id?: string },
    printerSize?: PrinterSize,
    observacoes?: string,
    diariaOptions?: {
      tipo_cobranca?: 'tempo' | 'diaria_fixa';
      valor_diaria_fixa?: number | null;
      pago_na_entrada?: boolean;
      metodo_pagamento_entrada?: Payment['metodo'];
    }
  ) => { entry: Entry; label: Label; payment?: Payment };
  checkoutEntry: (
    entryId: string,
    paymentMethod: Payment['metodo'],
    valorFinal: number,
    desconto?: number,
    acrescimo?: number
  ) => { success: boolean; message: string; entry?: Entry };
  cancelEntry: (entryId: string, motivo: string) => boolean;
  saveCustomer: (customer: Customer) => Customer;
  deleteCustomer: (id: string) => void;
  resetDatabase: () => void;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

export const ParkingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => storage.getCurrentUser());
  const [settings, setSettings] = useState<Settings>(() => storage.getSettings());
  const [entries, setEntries] = useState<Entry[]>(() => storage.getEntries());
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => storage.getVehicles());
  const [customers, setCustomers] = useState<Customer[]>(() => storage.getCustomers());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storage.getAuditLogs());

  const refreshData = () => {
    setEntries(storage.getEntries());
    setVehicles(storage.getVehicles());
    setCustomers(storage.getCustomers());
    setSettings(storage.getSettings());
    setAuditLogs(storage.getAuditLogs());
    setCurrentUser(storage.getCurrentUser());
  };

  useEffect(() => {
    storage.init();
    refreshData();
  }, []);

  const switchUserRole = (role: 'admin' | 'atendente') => {
    const users = storage.getUsers();
    const targetUser = users.find(u => u.role === role) || {
      id: `usr-${role}`,
      nome: role === 'admin' ? 'Administrador Geral' : 'Operador Atendente',
      email: `${role}@estacionamento.com`,
      role,
      ativo: true,
    };
    storage.setCurrentUser(targetUser);
    setCurrentUser(targetUser);
    storage.addAuditLog('TROCA_OPERADOR', { role, nome: targetUser.nome });
  };

  const updateSettings = (newSettings: Settings) => {
    storage.saveSettings(newSettings);
    setSettings(newSettings);
    refreshData();
  };

  const createVehicleEntry = (
    vehicleData: { placa: string; modelo: string; cor: string; tipo: Vehicle['tipo']; cliente_id?: string },
    printerSize: PrinterSize = settings.impressora_padrao || '80mm',
    observacoes?: string,
    diariaOptions?: {
      tipo_cobranca?: 'tempo' | 'diaria_fixa';
      valor_diaria_fixa?: number | null;
      pago_na_entrada?: boolean;
      metodo_pagamento_entrada?: Payment['metodo'];
    }
  ) => {
    const result = storage.createEntry(vehicleData, printerSize, observacoes, diariaOptions);
    refreshData();
    return result;
  };

  const checkoutEntry = (
    entryId: string,
    paymentMethod: Payment['metodo'],
    valorFinal: number,
    desconto = 0,
    acrescimo = 0
  ) => {
    const result = storage.processCheckout(entryId, paymentMethod, valorFinal, desconto, acrescimo);
    refreshData();
    return result;
  };

  const cancelEntry = (entryId: string, motivo: string) => {
    const all = storage.getEntries();
    const target = all.find(e => e.id === entryId);
    if (!target) return false;

    target.status = 'cancelado';
    target.observacoes = `${target.observacoes ? target.observacoes + ' | ' : ''}Cancelado: ${motivo}`;
    storage.addAuditLog('CANCELAMENTO_TICKET', { entryId, placa: target.vehicle?.placa, motivo });
    
    // Save to storage
    const raw = storage.getEntries();
    const idx = raw.findIndex(e => e.id === entryId);
    if (idx >= 0) {
      raw[idx].status = 'cancelado';
      localStorage.setItem('estacionamento_entries', JSON.stringify(raw));
    }

    refreshData();
    return true;
  };

  const saveCustomerHandler = (customer: Customer) => {
    const saved = storage.saveCustomer(customer);
    refreshData();
    return saved;
  };

  const deleteCustomerHandler = (id: string) => {
    storage.deleteCustomer(id);
    refreshData();
  };

  const resetDatabaseHandler = () => {
    storage.resetDatabase();
    refreshData();
  };

  const activeEntries = entries.filter(e => e.status === 'ativo');

  return (
    <ParkingContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchUserRole,
        settings,
        updateSettings,
        entries,
        activeEntries,
        vehicles,
        customers,
        auditLogs,
        refreshData,
        createVehicleEntry,
        checkoutEntry,
        cancelEntry,
        saveCustomer: saveCustomerHandler,
        deleteCustomer: deleteCustomerHandler,
        resetDatabase: resetDatabaseHandler,
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
};

export const useParking = (): ParkingContextType => {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error('useParking deve ser usado dentro de um ParkingProvider');
  }
  return context;
};
