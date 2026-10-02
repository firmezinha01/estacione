import { AuditLog, Entry, Payment } from '../types/parking';
import { formatBRL, formatDateTime } from '../utils/formatters';

export function exportEntriesToCsv(entries: Entry[], filename = 'relatorio-estadias.csv'): void {
  const headers = [
    'Ticket',
    'Placa',
    'Modelo',
    'Cor',
    'Tipo',
    'Cliente',
    'Tipo Cliente',
    'Horario Entrada',
    'Horario Saida',
    'Permanencia (min)',
    'Tarifa Calculada',
    'Desconto',
    'Acrescimo',
    'Valor Total Pago',
    'Forma de Pagamento',
    'Status',
  ];

  const rows = entries.map(e => [
    `"${e.label?.codigo_unico || e.id}"`,
    `"${e.vehicle?.placa || ''}"`,
    `"${e.vehicle?.modelo || ''}"`,
    `"${e.vehicle?.cor || ''}"`,
    `"${e.vehicle?.tipo || 'carro'}"`,
    `"${e.vehicle?.cliente?.nome || 'Avulso'}"`,
    `"${e.vehicle?.cliente?.tipo || 'avulso'}"`,
    `"${formatDateTime(e.horario_entrada)}"`,
    `"${formatDateTime(e.horario_saida)}"`,
    `"${e.tempo_minutos || 0}"`,
    `"${formatBRL(e.tarifa_calculada)}"`,
    `"${formatBRL(e.valor_desconto)}"`,
    `"${formatBRL(e.valor_acrescimo)}"`,
    `"${formatBRL(e.valor_total)}"`,
    `"${e.payment?.metodo ? e.payment.metodo.toUpperCase() : '-'}"`,
    `"${e.status.toUpperCase()}"`,
  ]);

  const totalTarifa = entries.reduce((acc, curr) => acc + (curr.tarifa_calculada || 0), 0);
  const totalDesconto = entries.reduce((acc, curr) => acc + (curr.valor_desconto || 0), 0);
  const totalAcrescimo = entries.reduce((acc, curr) => acc + (curr.valor_acrescimo || 0), 0);
  const totalGeral = entries.reduce(
    (acc, curr) => acc + (curr.valor_total || curr.tarifa_calculada || curr.payment?.valor || 0),
    0
  );

  const totalRow = [
    '"TOTAL GERAL"',
    `"${entries.length} tickets"`,
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    '""',
    `"${formatBRL(totalTarifa)}"`,
    `"${formatBRL(totalDesconto)}"`,
    `"${formatBRL(totalAcrescimo)}"`,
    `"${formatBRL(totalGeral)}"`,
    '""',
    '"TOTALIZADO"',
  ];

  const csvContent =
    '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';')), totalRow.join(';')].join('\r\n');
  downloadCsvFile(csvContent, filename);
}

export function exportAuditLogsToCsv(logs: AuditLog[], filename = 'relatorio-auditoria.csv'): void {
  const headers = ['Data e Hora', 'Usuario', 'Acao', 'IP', 'Detalhes'];

  const rows = logs.map(l => [
    `"${formatDateTime(l.data_hora)}"`,
    `"${l.usuario_nome || 'Sistema'}"`,
    `"${l.acao}"`,
    `"${l.ip_origem || '-'}"`,
    `"${JSON.stringify(l.detalhes || {}).replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  downloadCsvFile(csvContent, filename);
}

function downloadCsvFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
