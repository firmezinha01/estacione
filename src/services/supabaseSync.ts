import { supabase } from './supabase';
import {
  Customer,
  Vehicle,
  Entry,
  Label,
  Payment,
  Settings,
  AuditLog,
  User,
} from '../types/parking';

/**
 * Service to sync all parking operations directly with the remote Supabase database.
 * Every change in the application is persisted in real time to PostgreSQL via Supabase.
 */

export async function fetchAllFromSupabase(): Promise<{
  settings?: Settings;
  customers?: Customer[];
  vehicles?: Vehicle[];
  entries?: Entry[];
  labels?: Label[];
  payments?: Payment[];
  auditLogs?: AuditLog[];
  users?: User[];
} | null> {
  if (!supabase) return null;

  try {
    const [
      settingsRes,
      customersRes,
      vehiclesRes,
      entriesRes,
      labelsRes,
      paymentsRes,
      auditLogsRes,
      usersRes,
    ] = await Promise.all([
      supabase.from('settings').select('*').limit(1),
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
      supabase.from('entries').select('*').order('horario_entrada', { ascending: false }),
      supabase.from('labels').select('*'),
      supabase.from('payments').select('*').order('data_pagamento', { ascending: false }),
      supabase.from('audit_logs').select('*').order('data_hora', { ascending: false }).limit(200),
      supabase.from('users').select('*'),
    ]);

    const result: any = {};

    if (settingsRes.data && settingsRes.data.length > 0) {
      result.settings = settingsRes.data[0];
    }
    if (customersRes.data) {
      result.customers = customersRes.data;
    }
    if (vehiclesRes.data) {
      result.vehicles = vehiclesRes.data;
    }
    if (entriesRes.data) {
      result.entries = entriesRes.data;
    }
    if (labelsRes.data) {
      result.labels = labelsRes.data;
    }
    if (paymentsRes.data) {
      result.payments = paymentsRes.data;
    }
    if (auditLogsRes.data) {
      result.auditLogs = auditLogsRes.data;
    }
    if (usersRes.data && usersRes.data.length > 0) {
      result.users = usersRes.data;
    }

    return result;
  } catch (err) {
    console.warn('Falha ao sincronizar dados do Supabase:', err);
    return null;
  }
}

export async function pushCustomerToSupabase(customer: Customer): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('customers').upsert({
      id: customer.id,
      nome: customer.nome,
      telefone: customer.telefone || null,
      cpf: customer.cpf || null,
      email: customer.email || null,
      tipo: customer.tipo,
      mensalidade_valor: customer.mensalidade_valor || 0,
      dia_vencimento: customer.dia_vencimento || 10,
      ativo: customer.ativo !== false,
      consentimento_lgpd: customer.consentimento_lgpd !== false,
      observacoes: customer.observacoes || null,
    });
  } catch (err) {
    console.warn('Erro ao salvar cliente no Supabase:', err);
  }
}

export async function deleteCustomerFromSupabase(id: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('customers').delete().eq('id', id);
  } catch (err) {
    console.warn('Erro ao deletar cliente no Supabase:', err);
  }
}

export async function pushVehicleToSupabase(vehicle: Vehicle): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('vehicles').upsert({
      id: vehicle.id,
      placa: vehicle.placa,
      modelo: vehicle.modelo,
      cor: vehicle.cor,
      tipo: vehicle.tipo,
      cliente_id: vehicle.cliente_id || null,
    });
  } catch (err) {
    console.warn('Erro ao salvar veículo no Supabase:', err);
  }
}

export async function pushEntryToSupabase(
  entry: Entry,
  label: Label,
  payment?: Payment,
  customer?: Customer,
  vehicle?: Vehicle
): Promise<void> {
  if (!supabase) return;
  try {
    // 1. Ensure Customer exists if provided
    if (customer) {
      await pushCustomerToSupabase(customer);
    }

    // 2. Ensure Vehicle exists
    if (vehicle) {
      await pushVehicleToSupabase(vehicle);
    }

    // 3. Insert Entry
    await supabase.from('entries').upsert({
      id: entry.id,
      vehicle_id: entry.vehicle_id,
      horario_entrada: entry.horario_entrada,
      horario_saida: entry.horario_saida || null,
      tempo_minutos: entry.tempo_minutos || 0,
      tarifa_calculada: entry.tarifa_calculada || 0,
      valor_desconto: entry.valor_desconto || 0,
      valor_acrescimo: entry.valor_acrescimo || 0,
      valor_total: entry.valor_total || 0,
      status: entry.status,
      tipo_cobranca: entry.tipo_cobranca || 'tempo',
      valor_diaria_fixa: entry.valor_diaria_fixa || null,
      pago_na_entrada: Boolean(entry.pago_na_entrada),
      observacoes: entry.observacoes || null,
    });

    // 4. Insert Label
    await supabase.from('labels').upsert({
      id: label.id,
      entry_id: label.entry_id,
      codigo_unico: label.codigo_unico,
      qrcode: label.qrcode,
      impressora: label.impressora,
      status: label.status,
      impresso_em: label.impresso_em,
    });

    // 5. Insert Payment if prepaid
    if (payment) {
      await supabase.from('payments').upsert({
        id: payment.id,
        entry_id: payment.entry_id,
        valor: payment.valor,
        metodo: payment.metodo,
        status: payment.status,
        data_pagamento: payment.data_pagamento,
        comprovante_codigo: payment.comprovante_codigo,
      });
    }
  } catch (err) {
    console.warn('Erro ao salvar entrada no Supabase:', err);
  }
}

export async function pushCheckoutToSupabase(
  entry: Entry,
  payment: Payment,
  label?: Label
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from('entries')
      .update({
        horario_saida: entry.horario_saida || new Date().toISOString(),
        tempo_minutos: entry.tempo_minutos,
        tarifa_calculada: entry.tarifa_calculada,
        valor_desconto: entry.valor_desconto || 0,
        valor_acrescimo: entry.valor_acrescimo || 0,
        valor_total: entry.valor_total,
        status: 'pago',
      })
      .eq('id', entry.id);

    await supabase.from('payments').upsert({
      id: payment.id,
      entry_id: payment.entry_id,
      valor: payment.valor,
      metodo: payment.metodo,
      status: payment.status,
      data_pagamento: payment.data_pagamento,
      comprovante_codigo: payment.comprovante_codigo,
    });

    if (label) {
      await supabase
        .from('labels')
        .update({
          status: 'utilizado',
          utilizado_em: label.utilizado_em || new Date().toISOString(),
        })
        .eq('entry_id', entry.id);
    }
  } catch (err) {
    console.warn('Erro ao processar baixa no Supabase:', err);
  }
}

export async function pushCancelEntryToSupabase(
  entryId: string,
  motivo: string
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from('entries')
      .update({
        status: 'cancelado',
        observacoes: `Cancelado: ${motivo}`,
      })
      .eq('id', entryId);

    await supabase
      .from('labels')
      .update({
        status: 'cancelado',
      })
      .eq('entry_id', entryId);
  } catch (err) {
    console.warn('Erro ao cancelar ticket no Supabase:', err);
  }
}

export async function pushSettingsToSupabase(settings: Settings): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from('settings')
      .update({
        nome_estabelecimento: settings.nome_estabelecimento,
        cnpj: settings.cnpj,
        endereco: settings.endereco,
        telefone: settings.telefone,
        tarifa_hora: settings.tarifa_hora,
        tarifa_adicional_hora: settings.tarifa_adicional_hora,
        tarifa_diaria: settings.tarifa_diaria,
        valor_minimo: settings.valor_minimo,
        tolerancia_minutos: settings.tolerancia_minutos,
        tarifa_mensalista: settings.tarifa_mensalista,
        fator_moto: settings.fator_moto,
        fator_camionete: settings.fator_camionete,
        vagas_totais: settings.vagas_totais,
        impressora_padrao: settings.impressora_padrao,
        mensagem_rodape: settings.mensagem_rodape,
        lgpd_termo: settings.lgpd_termo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', settings.id);
  } catch (err) {
    console.warn('Erro ao salvar configurações no Supabase:', err);
  }
}

export async function pushAuditLogToSupabase(log: AuditLog): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('audit_logs').insert({
      id: log.id,
      usuario_id: log.usuario_id || null,
      usuario_nome: log.usuario_nome || null,
      acao: log.acao,
      detalhes: log.detalhes || {},
      ip_origem: log.ip_origem || '127.0.0.1 (Web PWA)',
      data_hora: log.data_hora,
    });
  } catch (err) {
    console.warn('Erro ao registrar log no Supabase:', err);
  }
}
