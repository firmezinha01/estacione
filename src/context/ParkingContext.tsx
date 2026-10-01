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
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  settings: Settings;
  updateSettings: (newSettings: Settings) => void;
  entries: Entry[];
  activeEntries: Entry[];
  vehicles: Vehicle[];
  customers: Customer[];
  auditLogs: AuditLog[];
  refreshData: () => void;
  createVehicleEntry: (
    vehicleData: {
      placa: string;
      modelo: string;
      cor: string;
      tipo: Vehicle['tipo'];
      cliente_id?: string;
      cliente_nome?: string;
      cliente_telefone?: string;
    },
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => storage.getAuthSession());
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
    // Synchronize live cloud data from Supabase PostgreSQL
    storage.syncFromSupabase().then(hasUpdates => {
      if (hasUpdates) {
        refreshData();
      }
    });
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Default Administrator credentials
    if (cleanEmail === 'admin@estacionamento.com' && cleanPass === 'admin123') {
      const adminUser: User = {
        id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
        nome: 'Administrador Principal',
        email: 'admin@estacionamento.com',
        role: 'admin',
        ativo: true,
      };
      storage.setCurrentUser(adminUser);
      storage.setAuthSession(true);
      setCurrentUser(adminUser);
      setIsAuthenticated(true);
      storage.addAuditLog('LOGIN_SUCESSO', { email: cleanEmail, role: 'admin' });
      return { success: true };
    }

    // 2. Default Attendant credentials
    if (cleanEmail === 'atendente@estacionamento.com' && cleanPass === 'atendente123') {
      const attendantUser: User = {
        id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
        nome: 'Carlos Atendente',
        email: 'atendente@estacionamento.com',
        role: 'atendente',
        ativo: true,
      };
      storage.setCurrentUser(attendantUser);
      storage.setAuthSession(true);
      setCurrentUser(attendantUser);
      setIsAuthenticated(true);
      storage.addAuditLog('LOGIN_SUCESSO', { email: cleanEmail, role: 'atendente' });
      return { success: true };
    }

    // 3. Registered users in database/localStorage
    const users = storage.getUsers();
    const found = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (found && (cleanPass === 'admin123' || cleanPass === 'atendente123' || cleanPass.length >= 6)) {
      storage.setCurrentUser(found);
      storage.setAuthSession(true);
      setCurrentUser(found);
      setIsAuthenticated(true);
      storage.addAuditLog('LOGIN_SUCESSO', { email: cleanEmail, role: found.role });
      return { success: true };
    }

    storage.addAuditLog('LOGIN_FALHA', { email: cleanEmail });
    return {
      success: false,
      message: 'Credenciais inválidas. Utilize os botões de Acesso Rápido para testar.',
    };
  };

  const logout = () => {
    storage.setAuthSession(false);
    setIsAuthenticated(false);
    storage.addAuditLog('LOGOUT_SUCESSO', { email: currentUser?.email });
  };

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
    vehicleData: {
      placa: string;
      modelo: string;
      cor: string;
      tipo: Vehicle['tipo'];
      cliente_id?: string;
      cliente_nome?: string;
      cliente_telefone?: string;
    },
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
        isAuthenticated,
        login,
        logout,
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
