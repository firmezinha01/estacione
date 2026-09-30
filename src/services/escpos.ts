import { Entry, Settings } from '../types/parking';
import { formatBRL, formatDateTime } from '../utils/formatters';

export interface EscPosOptions {
  width: '58mm' | '80mm';
  cutPaper?: boolean;
}

export class EscPosBuilder {
  private buffer: number[] = [];
  private cols: number;

  constructor(width: '58mm' | '80mm' = '80mm') {
    this.cols = width === '58mm' ? 32 : 48;
    this.init();
  }

  // ESC @ - Initialize printer
  init(): this {
    this.buffer.push(0x1b, 0x40);
    return this;
  }

  // ESC a n - Alignment (0: left, 1: center, 2: right)
  align(alignment: 'left' | 'center' | 'right'): this {
    const val = alignment === 'left' ? 0 : alignment === 'center' ? 1 : 2;
    this.buffer.push(0x1b, 0x61, val);
    return this;
  }

  // ESC E n - Bold text
  bold(enable: boolean): this {
    this.buffer.push(0x1b, 0x45, enable ? 1 : 0);
    return this;
  }

  // GS ! n - Character size (0: normal, 0x11: double width and height)
  size(size: 'normal' | 'double' | 'large'): this {
    let val = 0x00;
    if (size === 'double') val = 0x11;
    if (size === 'large') val = 0x22;
    this.buffer.push(0x1d, 0x21, val);
    return this;
  }

  // Text string encoder (Latin1 / ASCII)
  text(str: string): this {
    // Basic conversion removing accents and normalizing non-breaking spaces for ESC/POS
    const cleanStr = str
      .replace(/[\u00a0\u202f]/g, ' ') // convert non-breaking spaces to standard space
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // strip diacritics for printer compatibility

    for (let i = 0; i < cleanStr.length; i++) {
      const code = cleanStr.charCodeAt(i);
      this.buffer.push(code < 128 ? code : 32); // fallback to space
    }
    return this;
  }

  textLine(str: string = ''): this {
    this.text(str);
    this.lineFeed();
    return this;
  }

  lineFeed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  divider(char: string = '-'): this {
    this.align('center');
    this.textLine(char.repeat(this.cols));
    return this;
  }

  // Feed and cut paper
  cut(): this {
    this.lineFeed(3);
    // GS V 66 0 (Feed and partial cut)
    this.buffer.push(0x1d, 0x56, 0x42, 0x00);
    return this;
  }

  // QR Code generation via standard ESC/POS GS ( k commands
  qrCode(data: string): this {
    const dataLen = data.length + 3;
    const pL = dataLen % 256;
    const pH = Math.floor(dataLen / 256);

    // Set model 2
    this.buffer.push(0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);

    // Set module size (3 = medium, 4 = large)
    const moduleSize = this.cols === 32 ? 3 : 5;
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, moduleSize);

    // Set error correction level L (48) or M (49)
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);

    // Store data in symbol storage area
    this.buffer.push(0x1d, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
    for (let i = 0; i < data.length; i++) {
      this.buffer.push(data.charCodeAt(i));
    }

    // Print symbol
    this.buffer.push(0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);
    this.lineFeed(1);
    return this;
  }

  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  toBase64(): string {
    const bytes = this.build();
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * Builds an ESC/POS entry ticket payload
 */
export function buildTicketEscPos(entry: Entry, settings: Settings, width: '58mm' | '80mm' = '80mm'): Uint8Array {
  const b = new EscPosBuilder(width);

  // Header
  b.align('center').bold(true).size('double').textLine(settings.nome_estabelecimento);
  b.size('normal').bold(false);
  b.textLine(`CNPJ: ${settings.cnpj}`);
  b.textLine(settings.endereco);
  b.textLine(`Tel: ${settings.telefone}`);
  b.divider('=');

  // Ticket Title
  b.bold(true).textLine('COMPROVANTE DE ENTRADA').bold(false);
  b.textLine(`TICKET: ${entry.label?.codigo_unico || entry.id.substring(0, 8).toUpperCase()}`);
  b.divider('-');

  // Vehicle Info
  b.textLine('PLACA DO VEICULO:');
  b.bold(true).size('double').textLine(entry.vehicle?.placa || 'SEM PLACA');
  b.size('normal').bold(false);
  b.textLine(`Modelo: ${entry.vehicle?.modelo || 'N/I'} | Cor: ${entry.vehicle?.cor || 'N/I'}`);
  b.textLine(`Tipo: ${(entry.vehicle?.tipo || 'carro').toUpperCase()}`);

  if (entry.vehicle?.cliente) {
    b.textLine(`Cliente: ${entry.vehicle.cliente.nome}`);
    if (entry.vehicle.cliente.tipo === 'mensalista') {
      b.bold(true).textLine('>>> CLIENTE MENSALISTA <<<').bold(false);
    }
  }

  b.divider('-');

  // Timestamps and Rates
  b.align('left');
  b.textLine(`Entrada: ${formatDateTime(entry.horario_entrada)}`);

  if (entry.tipo_cobranca === 'diaria_fixa') {
    b.divider('-');
    b.align('center').bold(true);
    b.textLine(entry.pago_na_entrada ? '*** DIARIA FIXA (PRE-PAGA) ***' : '*** TARIFA DIARIA FIXA ***');
    b.textLine(`VALOR DIARIA: ${formatBRL(entry.valor_diaria_fixa || settings.tarifa_diaria)}`);
    if (entry.pago_na_entrada) {
      b.textLine(`PAGO NA ENTRADA (${entry.payment?.metodo ? entry.payment.metodo.toUpperCase() : 'QUITADO'})`);
      b.textLine('SAIDA LIBERADA NO CAIXA');
    } else {
      b.textLine('A pagar no momento da saida');
    }
    b.bold(false);
  } else {
    b.textLine(`Tolerancia: ${settings.tolerancia_minutos} minutos`);
    b.textLine(`1a Hora: ${formatBRL(settings.tarifa_hora)} | Adicional: ${formatBRL(settings.tarifa_adicional_hora)}/h`);
    b.textLine(`Diaria: ${formatBRL(settings.tarifa_diaria)}`);
  }
  b.divider('-');

  // QR Code
  b.align('center');
  const qrData = entry.label?.qrcode || `${window.location.origin}/validar/${entry.label?.codigo_unico || entry.id}`;
  b.qrCode(qrData);
  b.bold(true).textLine(`COD: ${entry.label?.codigo_unico || entry.id.substring(0, 8).toUpperCase()}`).bold(false);
  b.textLine('Apresente este QR Code na saida');

  b.divider('-');

  // Footer & Disclaimer
  b.align('center');
  b.textLine(settings.mensagem_rodape);
  b.lineFeed(1);
  b.textLine('--- DADOS PROTEGIDOS PELA LGPD ---');

  b.cut();
  return b.build();
}

/**
 * Builds an ESC/POS checkout payment receipt payload
 */
export function buildReceiptEscPos(entry: Entry, settings: Settings, width: '58mm' | '80mm' = '80mm'): Uint8Array {
  const b = new EscPosBuilder(width);

  b.align('center').bold(true).size('double').textLine(settings.nome_estabelecimento);
  b.size('normal').bold(false);
  b.textLine(`CNPJ: ${settings.cnpj}`);
  b.textLine(`Tel: ${settings.telefone}`);
  b.divider('=');

  b.bold(true).textLine('RECIBO DE PAGAMENTO').bold(false);
  b.textLine(`TICKET: ${entry.label?.codigo_unico || entry.id.substring(0, 8).toUpperCase()}`);
  b.divider('-');

  b.align('left');
  b.textLine(`Placa: ${entry.vehicle?.placa}`);
  b.textLine(`Entrada: ${formatDateTime(entry.horario_entrada)}`);
  b.textLine(`Saida:   ${formatDateTime(entry.horario_saida || new Date().toISOString())}`);
  b.textLine(`Permanencia: ${Math.floor(entry.tempo_minutos / 60)}h ${entry.tempo_minutos % 60}m`);
  b.divider('-');

  b.textLine(`Tarifa Base:  ${formatBRL(entry.tarifa_calculada)}`);
  if (entry.valor_desconto > 0) {
    b.textLine(`Desconto:    -${formatBRL(entry.valor_desconto)}`);
  }
  if (entry.valor_acrescimo > 0) {
    b.textLine(`Acrescimo:   +${formatBRL(entry.valor_acrescimo)}`);
  }

  b.divider('=');
  b.align('right').bold(true).size('double');
  b.textLine(`TOTAL: ${formatBRL(entry.valor_total)}`);
  b.size('normal').bold(false).align('left');

  if (entry.payment) {
    b.textLine(`Forma Pagto: ${entry.payment.metodo.toUpperCase()}`);
    b.textLine(`Comprovante: ${entry.payment.comprovante_codigo || 'APROVADO'}`);
    b.textLine(`Data/Hora:   ${formatDateTime(entry.payment.data_pagamento)}`);
  }

  b.divider('-');
  b.align('center');
  b.textLine('Obrigado pela preferencia!');
  b.textLine('Volte sempre!');

  b.cut();
  return b.build();
}

/**
 * Thermal Printer Hardware Connectors:
 * Supports Web Bluetooth, Web Serial, RawBT Android Intent, and standard Print Dialog
 */
export async function printViaWebBluetooth(data: Uint8Array): Promise<boolean> {
  const nav = navigator as any;
  if (!nav.bluetooth) {
    throw new Error('Web Bluetooth não é suportado neste navegador.');
  }

  const device = await nav.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2', 0xff00],
  });

  const server = await device.gatt.connect();
  const services = await server.getPrimaryServices();

  for (const service of services) {
    const characteristics = await service.getCharacteristics();
    for (const char of characteristics) {
      if (char.properties.write || char.properties.writeWithoutResponse) {
        // Send data in chunks of 100 bytes to avoid Bluetooth MTU saturation
        const chunkSize = 100;
        for (let i = 0; i < data.length; i += chunkSize) {
          const slice = data.slice(i, i + chunkSize);
          await char.writeValue(slice);
        }
        return true;
      }
    }
  }

  throw new Error('Nenhuma característica de escrita encontrada na impressora.');
}

export function printViaRawBT(data: Uint8Array): void {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  const base64 = btoa(binary);
  window.location.href = `rawbt:base64,${base64}`;
}
