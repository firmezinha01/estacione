import { describe, it, expect } from 'vitest';
import { buildTicketEscPos, buildReceiptEscPos } from '../services/escpos';
import { Entry, Settings } from '../types/parking';

describe('ESC/POS Thermal Ticket & Single QR Builder', () => {
  const mockSettings: Settings = {
    id: 'default',
    nome_estabelecimento: 'ESTACIONE FACIL',
    cnpj: '12.345.678/0001-90',
    endereco: 'Rua das Flores, 100',
    telefone: '(11) 98765-4321',
    tarifa_hora: 15.0,
    tarifa_adicional_hora: 10.0,
    tarifa_diaria: 60.0,
    valor_minimo: 10.0,
    tolerancia_minutos: 15,
    tarifa_mensalista: 250.0,
    fator_moto: 0.7,
    fator_camionete: 1.25,
    impressora_padrao: '80mm',
    mensagem_rodape: 'Obrigado pela preferencia!',
    lgpd_termo: 'Termo LGPD padrao',
    vagas_totais: 50,
  };

  const mockEntry: Entry = {
    id: 'entry-test-12345678',
    vehicle_id: 'veh-1',
    horario_entrada: new Date().toISOString(),
    tarifa_calculada: 0,
    valor_total: 0,
    status: 'ativo',
    tipo_cobranca: 'diaria_fixa',
    valor_diaria_fixa: 50.0,
    pago_na_entrada: true,
    data_limite_diaria: new Date(Date.now() + 86400000).toISOString(),
    tempo_minutos: 0,
    valor_desconto: 0,
    valor_acrescimo: 0,
    vehicle: {
      id: 'veh-1',
      placa: 'BRA2E19',
      modelo: 'Toyota Corolla',
      cor: 'Preto',
      tipo: 'carro',
      created_at: new Date().toISOString(),
    },
    label: {
      id: 'lbl-1',
      entry_id: 'entry-test-12345678',
      codigo_unico: 'BRA2E19-890123',
      qrcode: 'http://localhost:5173/validar/BRA2E19-890123',
      impressora: '80mm',
      status: 'ativo',
      impresso_em: new Date().toISOString(),
    },
    payment: {
      id: 'pay-1',
      entry_id: 'entry-test-12345678',
      valor: 50.0,
      metodo: 'pix',
      status: 'pago',
      data_pagamento: new Date().toISOString(),
      comprovante_codigo: 'PIX-12345',
    },
  };

  it('deve gerar payload ESC/POS com comandos de inicialização, corte e QR code', () => {
    const bytes = buildTicketEscPos(mockEntry, mockSettings, '80mm');
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(100);

    // Initial ESC @ command (0x1B, 0x40)
    expect(bytes[0]).toBe(0x1b);
    expect(bytes[1]).toBe(0x40);

    // Paper cut command GS V (0x1D, 0x56) at the end
    const lastBytes = Array.from(bytes.slice(-6));
    expect(lastBytes).toContain(0x1d);
    expect(lastBytes).toContain(0x56);
  });

  it('deve incluir textos essenciais como nome, placa, diária pré-paga e código do ticket', () => {
    const bytes = buildTicketEscPos(mockEntry, mockSettings, '80mm');
    const textDecoder = new TextDecoder('latin1');
    const decoded = textDecoder.decode(bytes);

    expect(decoded).toContain('ESTACIONE FACIL');
    expect(decoded).toContain('BRA2E19');
    expect(decoded).toContain('DIARIA FIXA (PRE-PAGA)');
    expect(decoded).toContain('VALOR DIARIA: R$ 50,00');
    expect(decoded).toContain('PAGO NA ENTRADA');
    expect(decoded).toContain('BRA2E19-890123');
  });

  it('deve gerar comprovante de saída/recibo com dados do pagamento', () => {
    const receiptBytes = buildReceiptEscPos(mockEntry, mockSettings, '58mm');
    const textDecoder = new TextDecoder('latin1');
    const decoded = textDecoder.decode(receiptBytes);

    expect(decoded).toContain('RECIBO DE PAGAMENTO');
    expect(decoded).toContain('ESTACIONE FACIL');
    expect(decoded).toContain('BRA2E19');
  });
});
