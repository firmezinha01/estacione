import {
  AuditLog,
  Customer,
  Entry,
  Label,
  Payment,
  Settings,
  User,
  Vehicle,
} from '../types/parking';
import { extractTicketCode, generateUUID } from '../utils/formatters';
import {
  fetchAllFromSupabase,
  pushCustomerToSupabase,
  deleteCustomerFromSupabase,
  pushVehicleToSupabase,
  pushEntryToSupabase,
  pushCheckoutToSupabase,
  pushCancelEntryToSupabase,
  pushSettingsToSupabase,
  pushAuditLogToSupabase,
} from './supabaseSync';

const STORAGE_KEYS = {
  USERS: 'estacionamento_users',
  CUSTOMERS: 'estacionamento_customers',
  VEHICLES: 'estacionamento_vehicles',
  ENTRIES: 'estacionamento_entries',
  PAYMENTS: 'estacionamento_payments',
  LABELS: 'estacionamento_labels',
  SETTINGS: 'estacionamento_settings',
  AUDIT_LOGS: 'estacionamento_audit_logs',
  CURRENT_USER: 'estacionamento_current_user',
  AUTH_SESSION: 'estacionamento_auth_session',
  SUPABASE_CONFIG: 'estacionamento_supabase_config',
};

// Initial Seed Settings (Standard UUID)
export const initialSettings: Settings = {
  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  nome_estabelecimento: 'EstacioneFácil Prime',
  cnpj: '24.891.732/0001-44',
  endereco: 'Av. Faria Lima, 2100 - Itaim Bibi, São Paulo - SP',
  telefone: '(11) 97123-4567',
  tarifa_hora: 12.00,
  tarifa_adicional_hora: 6.00,
  tarifa_diaria: 70.00,
  valor_minimo: 8.00,
  tolerancia_minutos: 15,
  tarifa_mensalista: 280.00,
  fator_moto: 0.70,
  fator_camionete: 1.25,
  vagas_totais: 60,
  impressora_padrao: '80mm',
  mensagem_rodape: 'Obrigado pela preferência! Mantenha seu comprovante. Não nos responsabilizamos por objetos de valor deixados no interior do veículo.',
  lgpd_termo: 'Seus dados são protegidos nos termos da LGPD e utilizados estritamente para segurança e faturamento do serviço.',
};

// Initial Seed Users (Standard UUIDs)
export const initialUsers: User[] = [
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    nome: 'Administrador Geral',
    email: 'admin@estacionamento.com',
    role: 'admin',
    ativo: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
    nome: 'Carlos Atendente',
    email: 'atendente@estacionamento.com',
    role: 'atendente',
    ativo: true,
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
];

// Initial Seed Customers (Standard UUIDs)
export const initialCustomers: Customer[] = [
  {
    id: 'd1111111-1111-4111-8111-111111111111',
    nome: 'Roberto Silveira',
    telefone: '(11) 99123-8877',
    cpf: '123.456.789-00',
    email: 'roberto@email.com',
    tipo: 'mensalista',
    mensalidade_valor: 280.0,
    dia_vencimento: 10,
    ativo: true,
    consentimento_lgpd: true,
    observacoes: 'Vaga fixa G-12',
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'd2222222-2222-4222-8222-222222222222',
    nome: 'Mariana Duarte',
    telefone: '(11) 98765-1122',
    cpf: '234.567.890-11',
    email: 'mariana@email.com',
    tipo: 'mensalista',
    mensalidade_valor: 280.0,
    dia_vencimento: 15,
    ativo: true,
    consentimento_lgpd: true,
    observacoes: 'Mensalista moto',
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: 'd3333333-3333-4333-8333-333333333333',
    nome: 'Lucas Mendes',
    telefone: '(11) 97654-3210',
    tipo: 'avulso',
    ativo: true,
    consentimento_lgpd: true,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

// Initial Seed Vehicles (Standard UUIDs)
export const initialVehicles: Vehicle[] = [
  {
    id: 'e1111111-1111-4111-8111-111111111111',
    placa: 'BRA2E19',
    modelo: 'Toyota Corolla Cross',
    cor: 'Prata',
    tipo: 'carro',
    cliente_id: 'd1111111-1111-4111-8111-111111111111',
    created_at: new Date(Date.now() - 50 * 86400000).toISOString(),
  },
  {
    id: 'e2222222-2222-4222-8222-222222222222',
    placa: 'MTO5K22',
    modelo: 'Honda CB 500X',
    cor: 'Vermelha',
    tipo: 'moto',
    cliente_id: 'd2222222-2222-4222-8222-222222222222',
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: 'e3333333-3333-4333-8333-333333333333',
    placa: 'ABC4D56',
    modelo: 'Jeep Compass Longitude',
    cor: 'Preto',
    tipo: 'carro',
    cliente_id: 'd3333333-3333-4333-8333-333333333333',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'e4444444-4444-4444-8444-444444444444',
    placa: 'HIL7X89',
    modelo: 'Toyota Hilux SRX',
    cor: 'Branca',
    tipo: 'camionete',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'e5555555-5555-4555-8555-555555555555',
    placa: 'ONX9Y12',
    modelo: 'Chevrolet Onix Turbo',
    cor: 'Azul',
    tipo: 'carro',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

// Initial Seed Entries (Standard UUIDs)
const now = Date.now();
export const initialEntries: Entry[] = [
  {
    id: 'f1111111-1111-4111-8111-111111111111',
    vehicle_id: 'e1111111-1111-4111-8111-111111111111',
    horario_entrada: new Date(now - 3 * 3600000 - 15 * 60000).toISOString(),
    tempo_minutos: 195,
    tarifa_calculada: 0,
    valor_desconto: 0,
    valor_acrescimo: 0,
    valor_total: 0,
    status: 'ativo',
    observacoes: 'Entrada mensalista',
    created_at: new Date(now - 3 * 3600000).toISOString(),
  },
  {
    id: 'f2222222-2222-4222-8222-222222222222',
    vehicle_id: 'e4444444-4444-4444-8444-444444444444',
    horario_entrada: new Date(now - 1 * 3600000 - 45 * 60000).toISOString(),
    tempo_minutos: 105,
    tarifa_calculada: 22.50,
    valor_desconto: 0,
    valor_acrescimo: 0,
    valor_total: 22.50,
    status: 'ativo',
    observacoes: 'Vaga grande',
    created_at: new Date(now - 105 * 60000).toISOString(),
  },
  {
    id: 'f3333333-3333-4333-8333-333333333333',
    vehicle_id: 'e5555555-5555-4555-8555-555555555555',
    horario_entrada: new Date(now - 35 * 60000).toISOString(),
    tempo_minutos: 35,
    tarifa_calculada: 12.00,
    valor_desconto: 0,
    valor_acrescimo: 0,
    valor_total: 12.00,
    status: 'ativo',
    created_at: new Date(now - 35 * 60000).toISOString(),
  },
  {
    id: 'f4444444-4444-4444-8444-444444444444',
    vehicle_id: 'e3333333-3333-4333-8333-333333333333',
    horario_entrada: new Date(now - 5 * 3600000).toISOString(),
    horario_saida: new Date(now - 2 * 3600000).toISOString(),
    tempo_minutos: 180,
    tarifa_calculada: 24.00,
    valor_desconto: 0,
    valor_acrescimo: 0,
    valor_total: 24.00,
    status: 'pago',
    created_at: new Date(now - 5 * 3600000).toISOString(),
  },
  {
    id: 'f5555555-5555-4555-8555-555555555555',
    vehicle_id: 'e2222222-2222-4222-8222-222222222222',
    horario_entrada: new Date(now - 6 * 3600000).toISOString(),
    horario_saida: new Date(now - 4 * 3600000).toISOString(),
    tempo_minutos: 120,
    tarifa_calculada: 0,
    valor_desconto: 0,
    valor_acrescimo: 0,
    valor_total: 0,
    status: 'pago',
    created_at: new Date(now - 6 * 3600000).toISOString(),
  },
];

// Initial Seed Labels (Standard UUIDs)
export const initialLabels: Label[] = [
  {
    id: 'a1111111-1111-4111-8111-111111111111',
    entry_id: 'f1111111-1111-4111-8111-111111111111',
    codigo_unico: 'EST-9A2K41',
    qrcode: 'EST-9A2K41',
    impressora: '80mm',
    status: 'ativo',
    impresso_em: new Date(now - 3 * 3600000).toISOString(),
  },
  {
    id: 'a2222222-2222-4222-8222-222222222222',
    entry_id: 'f2222222-2222-4222-8222-222222222222',
    codigo_unico: 'EST-8B7C52',
    qrcode: 'EST-8B7C52',
    impressora: '80mm',
    status: 'ativo',
    impresso_em: new Date(now - 105 * 60000).toISOString(),
  },
  {
    id: 'a3333333-3333-4333-8333-333333333333',
    entry_id: 'f3333333-3333-4333-8333-333333333333',
    codigo_unico: 'EST-4X1M99',
    qrcode: 'EST-4X1M99',
    impressora: '58mm',
    status: 'ativo',
    impresso_em: new Date(now - 35 * 60000).toISOString(),
  },
  {
    id: 'a4444444-4444-4444-8444-444444444444',
    entry_id: 'f4444444-4444-4444-8444-444444444444',
    codigo_unico: 'EST-7J3H12',
    qrcode: 'EST-7J3H12',
    impressora: '80mm',
    status: 'utilizado',
    impresso_em: new Date(now - 5 * 3600000).toISOString(),
    utilizado_em: new Date(now - 2 * 3600000).toISOString(),
  },
  {
    id: 'a5555555-5555-4555-8555-555555555555',
    entry_id: 'f5555555-5555-4555-8555-555555555555',
    codigo_unico: 'EST-6K9P84',
    qrcode: 'EST-6K9P84',
    impressora: '80mm',
    status: 'utilizado',
    impresso_em: new Date(now - 6 * 3600000).toISOString(),
    utilizado_em: new Date(now - 4 * 3600000).toISOString(),
  },
];

// Initial Seed Payments (Standard UUIDs)
export const initialPayments: Payment[] = [
  {
    id: 'b1111111-1111-4111-8111-111111111111',
    entry_id: 'f4444444-4444-4444-8444-444444444444',
    valor: 24.00,
    metodo: 'pix',
    status: 'pago',
    data_pagamento: new Date(now - 2 * 3600000).toISOString(),
    comprovante_codigo: 'PIX-9823412',
    created_at: new Date(now - 2 * 3600000).toISOString(),
  },
  {
    id: 'b2222222-2222-4222-8222-222222222222',
    entry_id: 'f5555555-5555-4555-8555-555555555555',
    valor: 0.00,
    metodo: 'faturado',
    status: 'pago',
    data_pagamento: new Date(now - 4 * 3600000).toISOString(),
    comprovante_codigo: 'MENSALISTA-LIBERADO',
    created_at: new Date(now - 4 * 3600000).toISOString(),
  },
];

// Initial Audit Logs (Standard UUIDs)
export const initialAuditLogs: AuditLog[] = [
  {
    id: 'c1111111-1111-4111-8111-111111111111',
    usuario_nome: 'Sistema',
    acao: 'INICIALIZACAO_SISTEMA',
    detalhes: { versao: '1.0.0', status: 'banco de dados conectado' },
    data_hora: new Date(now - 24 * 3600000).toISOString(),
  },
  {
    id: 'c2222222-2222-4222-8222-222222222222',
    usuario_nome: 'Carlos Atendente',
    acao: 'ENTRADA_VEICULO',
    detalhes: { placa: 'HIL7X89', ticket: 'EST-8B7C52' },
    data_hora: new Date(now - 105 * 60000).toISOString(),
  },
];

class StorageService {
  private memoryStore: Record<string, string> = {};

  private isLocalStorageAvailable(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private getItem<T>(key: string, fallback: T): T {
    try {
      if (this.isLocalStorageAvailable()) {
        const data = localStorage.getItem(key);
        if (!data) return fallback;
        return JSON.parse(data) as T;
      } else {
        const data = this.memoryStore[key];
        if (!data) return fallback;
        return JSON.parse(data) as T;
      }
    } catch {
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      if (this.isLocalStorageAvailable()) {
        localStorage.setItem(key, serialized);
      } else {
        this.memoryStore[key] = serialized;
      }
    } catch (e) {
      console.error('Erro salvando no storage:', e);
    }
  }

  // Init storage with sample data if empty
  init(): void {
    if (!this.getItem(STORAGE_KEYS.SETTINGS, null)) {
      this.setItem(STORAGE_KEYS.SETTINGS, initialSettings);
    }
    if (!this.getItem(STORAGE_KEYS.USERS, null)) {
      this.setItem(STORAGE_KEYS.USERS, initialUsers);
    }
    if (!this.getItem(STORAGE_KEYS.CUSTOMERS, null)) {
      this.setItem(STORAGE_KEYS.CUSTOMERS, initialCustomers);
    }
    if (!this.getItem(STORAGE_KEYS.VEHICLES, null)) {
      this.setItem(STORAGE_KEYS.VEHICLES, initialVehicles);
    }
    if (!this.getItem(STORAGE_KEYS.ENTRIES, null)) {
      this.setItem(STORAGE_KEYS.ENTRIES, initialEntries);
    }
    if (!this.getItem(STORAGE_KEYS.LABELS, null)) {
      this.setItem(STORAGE_KEYS.LABELS, initialLabels);
    }
    if (!this.getItem(STORAGE_KEYS.PAYMENTS, null)) {
      this.setItem(STORAGE_KEYS.PAYMENTS, initialPayments);
    }
    if (!this.getItem(STORAGE_KEYS.AUDIT_LOGS, null)) {
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    }
    if (!this.getItem(STORAGE_KEYS.CURRENT_USER, null)) {
      this.setItem(STORAGE_KEYS.CURRENT_USER, initialUsers[0]);
    }
  }

  /**
   * Synchronize all data from Supabase PostgreSQL cloud database into local storage
   */
  async syncFromSupabase(): Promise<boolean> {
    const data = await fetchAllFromSupabase();
    if (!data) return false;

    let updated = false;

    if (data.settings) {
      this.setItem(STORAGE_KEYS.SETTINGS, data.settings);
      updated = true;
    }
    if (data.customers && data.customers.length > 0) {
      this.setItem(STORAGE_KEYS.CUSTOMERS, data.customers);
      updated = true;
    }
    if (data.vehicles && data.vehicles.length > 0) {
      this.setItem(STORAGE_KEYS.VEHICLES, data.vehicles);
      updated = true;
    }
    if (data.entries && data.entries.length > 0) {
      this.setItem(STORAGE_KEYS.ENTRIES, data.entries);
      updated = true;
    }
    if (data.labels && data.labels.length > 0) {
      this.setItem(STORAGE_KEYS.LABELS, data.labels);
      updated = true;
    }
    if (data.payments && data.payments.length > 0) {
      this.setItem(STORAGE_KEYS.PAYMENTS, data.payments);
      updated = true;
    }
    if (data.auditLogs && data.auditLogs.length > 0) {
      this.setItem(STORAGE_KEYS.AUDIT_LOGS, data.auditLogs);
      updated = true;
    }
    if (data.users && data.users.length > 0) {
      this.setItem(STORAGE_KEYS.USERS, data.users);
      updated = true;
    }

    return updated;
  }

  // Settings
  getSettings(): Settings {
    return this.getItem<Settings>(STORAGE_KEYS.SETTINGS, initialSettings);
  }

  saveSettings(settings: Settings): void {
    this.setItem(STORAGE_KEYS.SETTINGS, settings);
    pushSettingsToSupabase(settings).catch(() => {});
    this.addAuditLog('ATUALIZACAO_CONFIGURACOES', {
      tarifa_hora: settings.tarifa_hora,
      tarifa_diaria: settings.tarifa_diaria,
      tolerancia_minutos: settings.tolerancia_minutos,
    });
  }

  // Users
  getUsers(): User[] {
    return this.getItem<User[]>(STORAGE_KEYS.USERS, initialUsers);
  }

  saveUsers(users: User[]): void {
    this.setItem(STORAGE_KEYS.USERS, users);
  }

  getCurrentUser(): User {
    return this.getItem<User>(STORAGE_KEYS.CURRENT_USER, initialUsers[0]);
  }

  setCurrentUser(user: User): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  getAuthSession(): boolean {
    if (!this.isLocalStorageAvailable()) return true;
    return localStorage.getItem(STORAGE_KEYS.AUTH_SESSION) === 'true';
  }

  setAuthSession(authenticated: boolean): void {
    if (this.isLocalStorageAvailable()) {
      if (authenticated) {
        localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      }
    }
  }

  // Customers
  getCustomers(): Customer[] {
    return this.getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, initialCustomers);
  }

  saveCustomer(customer: Customer): Customer {
    const list = this.getCustomers();
    if (!customer.id) {
      customer.id = generateUUID();
    }
    const idx = list.findIndex(c => c.id === customer.id);
    if (idx >= 0) {
      list[idx] = customer;
    } else {
      list.push(customer);
    }
    this.setItem(STORAGE_KEYS.CUSTOMERS, list);
    pushCustomerToSupabase(customer).catch(() => {});
    return customer;
  }

  deleteCustomer(id: string): void {
    const list = this.getCustomers().filter(c => c.id !== id);
    this.setItem(STORAGE_KEYS.CUSTOMERS, list);
    deleteCustomerFromSupabase(id).catch(() => {});
    this.addAuditLog('EXCLUSAO_CLIENTE_LGPD', { id });
  }

  // Vehicles
  getVehicles(): Vehicle[] {
    const vehicles = this.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, initialVehicles);
    const customers = this.getCustomers();
    return vehicles.map(v => ({
      ...v,
      cliente: customers.find(c => c.id === v.cliente_id),
    }));
  }

  findVehicleByPlate(plate: string): Vehicle | undefined {
    const cleanPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const vehicles = this.getVehicles();
    return vehicles.find(v => v.placa.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanPlate);
  }

  saveVehicle(vehicle: Vehicle): Vehicle {
    const list = this.getItem<Vehicle[]>(STORAGE_KEYS.VEHICLES, initialVehicles);
    if (!vehicle.id) {
      vehicle.id = generateUUID();
    }
    const cleanPlate = vehicle.placa.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const idx = list.findIndex(v => v.placa.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanPlate);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...vehicle };
    } else {
      list.push(vehicle);
    }
    this.setItem(STORAGE_KEYS.VEHICLES, list);
    pushVehicleToSupabase(vehicle).catch(() => {});
    return vehicle;
  }

  // Entries
  getEntries(): Entry[] {
    const entries = this.getItem<Entry[]>(STORAGE_KEYS.ENTRIES, initialEntries);
    const vehicles = this.getVehicles();
    const labels = this.getItem<Label[]>(STORAGE_KEYS.LABELS, initialLabels);
    const payments = this.getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, initialPayments);

    return entries.map(e => ({
      ...e,
      vehicle: vehicles.find(v => v.id === e.vehicle_id),
      label: labels.find(l => l.entry_id === e.id),
      payment: payments.find(p => p.entry_id === e.id),
    }));
  }

  getActiveEntries(): Entry[] {
    return this.getEntries().filter(e => e.status === 'ativo');
  }

  findEntryByTicketCode(code: string): Entry | undefined {
    if (!code) return undefined;
    const cleanCode = extractTicketCode(code);
    const searchCleanPlate = cleanCode.replace(/[^A-Z0-9]/g, '');
    const entries = this.getEntries();
    return entries.find(e => {
      const labelCode = e.label?.codigo_unico?.toUpperCase();
      const entryIdPrefix = e.id.substring(0, 8).toUpperCase();
      const plate = e.vehicle?.placa?.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return (
        labelCode === cleanCode ||
        entryIdPrefix === cleanCode ||
        e.id.toUpperCase() === cleanCode ||
        (plate && plate === searchCleanPlate)
      );
    });
  }

  createEntry(
    vehicleData: {
      placa: string;
      modelo: string;
      cor: string;
      tipo: Vehicle['tipo'];
      cliente_id?: string;
      cliente_nome?: string;
      cliente_telefone?: string;
    },
    printerSize: '58mm' | '80mm' = '80mm',
    observacoes?: string,
    diariaOptions?: {
      tipo_cobranca?: 'tempo' | 'diaria_fixa';
      valor_diaria_fixa?: number | null;
      pago_na_entrada?: boolean;
      metodo_pagamento_entrada?: Payment['metodo'];
    }
  ): { entry: Entry; label: Label; payment?: Payment } {
    // 0. Handle Customer creation/linking if nome or telefone is provided
    let clienteId = vehicleData.cliente_id;
    let customer: Customer | undefined;

    if (vehicleData.cliente_nome?.trim() || vehicleData.cliente_telefone?.trim()) {
      const cleanPhone = (vehicleData.cliente_telefone || '').replace(/\D/g, '');
      const existingCust = clienteId
        ? this.getCustomers().find(c => c.id === clienteId)
        : this.getCustomers().find(c => cleanPhone && c.telefone.replace(/\D/g, '') === cleanPhone);

      if (existingCust) {
        if (vehicleData.cliente_nome?.trim()) {
          existingCust.nome = vehicleData.cliente_nome.trim();
        }
        if (vehicleData.cliente_telefone?.trim()) {
          existingCust.telefone = vehicleData.cliente_telefone.trim();
        }
        customer = this.saveCustomer(existingCust);
        clienteId = customer.id;
      } else {
        customer = this.saveCustomer({
          id: generateUUID(),
          nome: vehicleData.cliente_nome?.trim() || 'Cliente Avulso',
          telefone: vehicleData.cliente_telefone?.trim() || '',
          tipo: 'avulso',
          ativo: true,
          consentimento_lgpd: true,
          created_at: new Date().toISOString(),
        });
        clienteId = customer.id;
      }
    } else if (clienteId) {
      customer = this.getCustomers().find(c => c.id === clienteId);
    }

    // 1. Save or retrieve vehicle
    let vehicle = this.findVehicleByPlate(vehicleData.placa);
    if (!vehicle) {
      vehicle = {
        id: generateUUID(),
        placa: vehicleData.placa.toUpperCase().trim(),
        modelo: vehicleData.modelo.trim(),
        cor: vehicleData.cor.trim(),
        tipo: vehicleData.tipo,
        cliente_id: clienteId,
        cliente: customer,
        created_at: new Date().toISOString(),
      };
      this.saveVehicle(vehicle);
    } else if (clienteId && vehicle.cliente_id !== clienteId) {
      vehicle.cliente_id = clienteId;
      vehicle.cliente = customer;
      this.saveVehicle(vehicle);
    } else if (customer) {
      vehicle.cliente = customer;
    }

    // 2. Determine billing type
    const isDiaria =
      diariaOptions?.tipo_cobranca === 'diaria_fixa' &&
      diariaOptions.valor_diaria_fixa != null &&
      diariaOptions.valor_diaria_fixa > 0;
    const isPrepaid = isDiaria && Boolean(diariaOptions.pago_na_entrada);
    const fixedRate = isDiaria ? Number(diariaOptions.valor_diaria_fixa) : 0;

    // 3. Create entry record with standard UUID
    const entryId = generateUUID();
    const newEntry: Entry = {
      id: entryId,
      vehicle_id: vehicle.id,
      horario_entrada: new Date().toISOString(),
      tempo_minutos: 0,
      tarifa_calculada: isDiaria ? fixedRate : 0,
      valor_desconto: 0,
      valor_acrescimo: 0,
      valor_total: isDiaria ? fixedRate : 0,
      status: 'ativo',
      tipo_cobranca: isDiaria ? 'diaria_fixa' : 'tempo',
      valor_diaria_fixa: isDiaria ? fixedRate : null,
      pago_na_entrada: isPrepaid,
      observacoes,
      created_at: new Date().toISOString(),
    };

    // 4. Generate secure ticket label with anti-replay QR Code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codePart = '';
    for (let i = 0; i < 6; i++) {
      codePart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const ticketCode = `EST-${codePart}`;

    const newLabel: Label = {
      id: generateUUID(),
      entry_id: entryId,
      codigo_unico: ticketCode,
      qrcode: ticketCode,
      impressora: printerSize,
      status: 'ativo',
      impresso_em: new Date().toISOString(),
    };

    // If prepaid on arrival, record the payment immediately
    let initialPayment: Payment | undefined;
    if (isPrepaid) {
      initialPayment = {
        id: generateUUID(),
        entry_id: entryId,
        valor: fixedRate,
        metodo: diariaOptions.metodo_pagamento_entrada || 'pix',
        status: 'pago',
        data_pagamento: newEntry.horario_entrada,
        comprovante_codigo: `PRE-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        created_at: newEntry.horario_entrada,
      };
      const payments = this.getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, initialPayments);
      payments.unshift(initialPayment);
      this.setItem(STORAGE_KEYS.PAYMENTS, payments);
      newEntry.payment = initialPayment;
    }

    // Save entry and label to local cache
    const entries = this.getItem<Entry[]>(STORAGE_KEYS.ENTRIES, initialEntries);
    entries.unshift(newEntry);
    this.setItem(STORAGE_KEYS.ENTRIES, entries);

    const labels = this.getItem<Label[]>(STORAGE_KEYS.LABELS, initialLabels);
    labels.unshift(newLabel);
    this.setItem(STORAGE_KEYS.LABELS, labels);

    // Live persistence to Supabase PostgreSQL database
    pushEntryToSupabase(newEntry, newLabel, initialPayment, customer, vehicle).catch(err => {
      console.warn('Erro salvando no Supabase em segundo plano:', err);
    });

    this.addAuditLog(
      isPrepaid
        ? 'ENTRADA_VEICULO_DIARIA_PREPAGA'
        : isDiaria
        ? 'ENTRADA_VEICULO_DIARIA_FIXA'
        : 'ENTRADA_VEICULO',
      {
        placa: vehicle.placa,
        ticket: ticketCode,
        tipo: vehicle.tipo,
        tipo_cobranca: newEntry.tipo_cobranca,
        valor_diaria_fixa: newEntry.valor_diaria_fixa,
        pago_na_entrada: isPrepaid,
        metodo_pagamento: diariaOptions?.metodo_pagamento_entrada,
        horario: newEntry.horario_entrada,
      }
    );

    return {
      entry: {
        ...newEntry,
        vehicle,
        label: newLabel,
        payment: initialPayment,
      },
      label: newLabel,
      payment: initialPayment,
    };
  }

  processCheckout(
    entryId: string,
    paymentMethod: Payment['metodo'],
    valorFinal: number,
    desconto: number = 0,
    acrescimo: number = 0
  ): { success: boolean; message: string; entry?: Entry } {
    const currentEntry = this.getEntries().find(e => e.id === entryId);
    if (!currentEntry) {
      return { success: false, message: 'Ticket/Entrada não localizada no sistema.' };
    }

    if (currentEntry.status === 'pago') {
      return {
        success: false,
        message: 'Este ticket já foi utilizado e baixado anteriormente.',
      };
    }

    if (currentEntry.status === 'cancelado') {
      return {
        success: false,
        message: 'Este ticket foi cancelado e não pode ser finalizado.',
      };
    }

    const exitTime = new Date().toISOString();
    const startMs = new Date(currentEntry.horario_entrada).getTime();
    const endMs = new Date(exitTime).getTime();
    const tempoMinutos = Math.max(1, Math.floor((endMs - startMs) / (1000 * 60)));

    let existingPayment = currentEntry.payment;
    let paymentToSave = existingPayment;

    // Create a new payment if not already prepaid or if there is a remaining amount
    if (!currentEntry.pago_na_entrada || valorFinal > 0) {
      const paymentId = generateUUID();
      paymentToSave = {
        id: paymentId,
        entry_id: entryId,
        valor: valorFinal,
        metodo: paymentMethod,
        status: 'pago',
        data_pagamento: exitTime,
        comprovante_codigo: `REC-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        created_at: exitTime,
      };

      const payments = this.getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, initialPayments);
      payments.unshift(paymentToSave);
      this.setItem(STORAGE_KEYS.PAYMENTS, payments);
    }

    // Update label to utilized (anti-replay)
    const labels = this.getItem<Label[]>(STORAGE_KEYS.LABELS, initialLabels);
    const labelIdx = labels.findIndex(l => l.entry_id === entryId);
    if (labelIdx >= 0) {
      labels[labelIdx].status = 'utilizado';
      labels[labelIdx].utilizado_em = exitTime;
      this.setItem(STORAGE_KEYS.LABELS, labels);
    }

    // Update entry status
    const rawEntries = this.getItem<Entry[]>(STORAGE_KEYS.ENTRIES, initialEntries);
    const rawIdx = rawEntries.findIndex(e => e.id === entryId);
    if (rawIdx >= 0) {
      rawEntries[rawIdx].status = 'pago';
      rawEntries[rawIdx].horario_saida = exitTime;
      rawEntries[rawIdx].tempo_minutos = tempoMinutos;
      rawEntries[rawIdx].tarifa_calculada = valorFinal + desconto - acrescimo;
      rawEntries[rawIdx].valor_desconto = desconto;
      rawEntries[rawIdx].valor_acrescimo = acrescimo;
      rawEntries[rawIdx].valor_total = valorFinal;
      this.setItem(STORAGE_KEYS.ENTRIES, rawEntries);
    }

    const updatedEntry: Entry = {
      ...currentEntry,
      status: 'pago',
      horario_saida: exitTime,
      tempo_minutos: tempoMinutos,
      valor_total: valorFinal,
      valor_desconto: desconto,
      valor_acrescimo: acrescimo,
      payment: paymentToSave,
      label: labelIdx >= 0 ? labels[labelIdx] : undefined,
    };

    // Live persistence to Supabase
    if (paymentToSave) {
      pushCheckoutToSupabase(
        updatedEntry,
        paymentToSave,
        labelIdx >= 0 ? labels[labelIdx] : undefined
      ).catch(() => {});
    }

    this.addAuditLog('BAIXA_SAIDA_SUCESSO', {
      entryId,
      placa: updatedEntry.vehicle?.placa,
      ticket: updatedEntry.label?.codigo_unico,
      valor: valorFinal,
      metodo: paymentMethod,
      tempoMinutos,
    });

    return {
      success: true,
      message: 'Saída e pagamento processados com sucesso!',
      entry: updatedEntry,
    };
  }

  cancelEntry(entryId: string, motivo: string): boolean {
    const raw = this.getItem<Entry[]>(STORAGE_KEYS.ENTRIES, initialEntries);
    const idx = raw.findIndex(e => e.id === entryId);
    if (idx < 0) return false;
    raw[idx].status = 'cancelado';
    raw[idx].observacoes = `${raw[idx].observacoes ? raw[idx].observacoes + ' | ' : ''}Cancelado: ${motivo}`;
    this.setItem(STORAGE_KEYS.ENTRIES, raw);

    pushCancelEntryToSupabase(entryId, motivo).catch(() => {});
    this.addAuditLog('CANCELAMENTO_TICKET', { entryId, motivo });
    return true;
  }

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
  }

  addAuditLog(acao: string, detalhes?: Record<string, any>): void {
    const user = this.getCurrentUser();
    const log: AuditLog = {
      id: generateUUID(),
      usuario_id: user?.id,
      usuario_nome: user?.nome || 'Sistema',
      acao,
      detalhes,
      ip_origem: '127.0.0.1 (Web PWA)',
      data_hora: new Date().toISOString(),
    };
    const logs = this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, initialAuditLogs);
    logs.unshift(log);
    if (logs.length > 500) logs.length = 500;
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs);

    pushAuditLogToSupabase(log).catch(() => {});
  }

  // Reset to default sample data
  resetDatabase(): void {
    if (this.isLocalStorageAvailable()) {
      localStorage.clear();
    }
    this.memoryStore = {};
    this.init();
    this.addAuditLog('RESET_BANCO_DADOS', { acao: 'Restauração de dados de demonstração' });
  }
}

export const storage = new StorageService();
storage.init();
