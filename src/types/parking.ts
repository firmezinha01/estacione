export type UserRole = 'atendente' | 'admin';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  created_at?: string;
}

export type CustomerType = 'avulso' | 'mensalista';

export interface Customer {
  id: string;
  nome: string;
  telefone: string;
  cpf?: string;
  email?: string;
  tipo: CustomerType;
  mensalidade_valor?: number;
  dia_vencimento?: number;
  ativo: boolean;
  consentimento_lgpd: boolean;
  observacoes?: string;
  created_at?: string;
}

export type VehicleType = 'carro' | 'moto' | 'camionete' | 'outros';

export interface Vehicle {
  id: string;
  placa: string;
  modelo: string;
  cor: string;
  tipo: VehicleType;
  cliente_id?: string;
  cliente?: Customer;
  created_at?: string;
}

export type EntryStatus = 'ativo' | 'pago' | 'cancelado';

export interface Entry {
  id: string;
  vehicle_id: string;
  horario_entrada: string;
  horario_saida?: string | null;
  tempo_minutos: number;
  tarifa_calculada: number;
  valor_desconto: number;
  valor_acrescimo: number;
  valor_total: number;
  status: EntryStatus;
  tipo_cobranca?: 'tempo' | 'diaria_fixa';
  valor_diaria_fixa?: number | null;
  pago_na_entrada?: boolean;
  data_limite_diaria?: string;
  atendente_entrada_id?: string;
  atendente_saida_id?: string;
  observacoes?: string;
  vehicle?: Vehicle;
  label?: Label;
  payment?: Payment;
  created_at?: string;
}

export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'faturado';
export type PaymentStatus = 'pago' | 'pendente' | 'estornado';

export interface Payment {
  id: string;
  entry_id: string;
  valor: number;
  metodo: PaymentMethod;
  status: PaymentStatus;
  data_pagamento: string;
  comprovante_codigo: string;
  created_at?: string;
}

export type PrinterSize = '58mm' | '80mm';
export type LabelStatus = 'ativo' | 'utilizado' | 'cancelado';

export interface Label {
  id: string;
  entry_id: string;
  codigo_unico: string;
  qrcode: string;
  impressora: PrinterSize;
  status: LabelStatus;
  impresso_em: string;
  utilizado_em?: string;
}

export interface Settings {
  id: string;
  nome_estabelecimento: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  tarifa_hora: number;
  tarifa_adicional_hora: number;
  tarifa_diaria: number;
  valor_minimo: number;
  tolerancia_minutos: number;
  tarifa_mensalista: number;
  fator_moto: number; // e.g. 0.70 (30% desconto)
  fator_camionete: number; // e.g. 1.25 (25% acréscimo)
  vagas_totais: number;
  impressora_padrao: PrinterSize;
  mensagem_rodape: string;
  lgpd_termo: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  usuario_id?: string;
  usuario_nome?: string;
  acao: string;
  detalhes?: Record<string, any>;
  ip_origem?: string;
  data_hora: string;
}

export interface TariffCalculationResult {
  tempoMinutos: number;
  tempoFormatado: string;
  horasCobradas: number;
  tarifaBase: number;
  fatorTipo: number;
  valorBruto: number;
  valorFinal: number;
  isTolerancia: boolean;
  isDiaria: boolean;
  isMensalista: boolean;
  isDiariaFixa?: boolean;
  isPagoNaEntrada?: boolean;
  descricaoRegra: string;
}
