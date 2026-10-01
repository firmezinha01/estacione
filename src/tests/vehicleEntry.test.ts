import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../services/storage';
import { formatPlate, isValidPlate, extractTicketCode, formatWhatsAppUrl } from '../utils/formatters';

describe('Validação de Veículos e Entrada (vehicleEntry)', () => {
  beforeEach(() => {
    storage.resetDatabase();
  });

  it('deve validar formatos de placas padrão (ABC-1234) e Mercosul (ABC1D23)', () => {
    expect(isValidPlate('ABC1234')).toBe(true);
    expect(isValidPlate('ABC-1234')).toBe(true);
    expect(isValidPlate('BRA2E19')).toBe(true);
    expect(isValidPlate('XYZ9A88')).toBe(true);
    expect(isValidPlate('1234567')).toBe(false);
    expect(isValidPlate('ABC')).toBe(false);
  });

  it('deve formatar placa antiga com hífen', () => {
    expect(formatPlate('abc1234')).toBe('ABC-1234');
    expect(formatPlate('bra2e19')).toBe('BRA2E19');
  });

  it('deve registrar entrada e vincular dados do veículo corretamente', () => {
    const { entry, label } = storage.createEntry(
      {
        placa: 'XYZ9A88',
        modelo: 'Tracker Premier',
        cor: 'Azul Metálico',
        tipo: 'carro',
      },
      '80mm',
      'Entrada via portão 2'
    );

    expect(entry.vehicle?.placa).toBe('XYZ9A88');
    expect(entry.vehicle?.modelo).toBe('Tracker Premier');
    expect(entry.status).toBe('ativo');
    expect(label.impressora).toBe('80mm');
    expect(entry.observacoes).toBe('Entrada via portão 2');

    // Confirm stored in active list
    const actives = storage.getActiveEntries();
    expect(actives.some(e => e.id === entry.id)).toBe(true);
  });

  it('deve registrar entrada com diária fixa pré-paga e liberar saída sem cobrança extra', () => {
    const { entry, payment } = storage.createEntry(
      {
        placa: 'DIA5R99',
        modelo: 'Civic Touring',
        cor: 'Branco',
        tipo: 'carro',
      },
      '80mm',
      'Diária pré-paga',
      {
        tipo_cobranca: 'diaria_fixa',
        valor_diaria_fixa: 70.0,
        pago_na_entrada: true,
        metodo_pagamento_entrada: 'pix',
      }
    );

    expect(entry.tipo_cobranca).toBe('diaria_fixa');
    expect(entry.valor_diaria_fixa).toBe(70.0);
    expect(entry.pago_na_entrada).toBe(true);
    expect(payment).toBeDefined();
    expect(payment?.valor).toBe(70.0);
    expect(payment?.metodo).toBe('pix');

    // Ao realizar o checkout, valor final deve ser 0 (já pago)
    const checkoutResult = storage.processCheckout(entry.id, 'pix', 0.0);
    expect(checkoutResult.success).toBe(true);
    expect(checkoutResult.entry?.status).toBe('pago');
  });

  it('deve registrar entrada com Nome do Cliente e WhatsApp e associar ao veículo', () => {
    const { entry } = storage.createEntry(
      {
        placa: 'WPP1A23',
        modelo: 'Corolla Altis',
        cor: 'Prata',
        tipo: 'carro',
        cliente_nome: 'Carlos Eduardo Silva',
        cliente_telefone: '(11) 98765-4321',
      },
      '80mm',
      'Entrada com cliente e zap'
    );

    expect(entry.vehicle?.cliente).toBeDefined();
    expect(entry.vehicle?.cliente?.nome).toBe('Carlos Eduardo Silva');
    expect(entry.vehicle?.cliente?.telefone).toBe('(11) 98765-4321');

    // Ao buscar a entrada por ticket ou placa, cliente e telefone devem estar disponíveis
    const found = storage.findEntryByTicketCode(entry.label?.codigo_unico || '');
    expect(found?.vehicle?.cliente?.nome).toBe('Carlos Eduardo Silva');
    expect(found?.vehicle?.cliente?.telefone).toBe('(11) 98765-4321');
  });

  it('deve extrair código do ticket de URLs completas, rotas e query params', () => {
    expect(extractTicketCode('EST-8B7C52')).toBe('EST-8B7C52');
    expect(extractTicketCode('https://estacione.vercel.app/validar/EST-8B7C52')).toBe('EST-8B7C52');
    expect(extractTicketCode('http://localhost:5173/validar/EST-8B7C52?ref=scanner')).toBe('EST-8B7C52');
    expect(extractTicketCode('https://estacione.vercel.app/#/ticket/EST-99AA11')).toBe('EST-99AA11');
    expect(extractTicketCode('bra2e19')).toBe('BRA2E19');

    // WhatsApp URL
    const zapUrl = formatWhatsAppUrl('(11) 98765-4321', 'Olá Carlos');
    expect(zapUrl).toContain('https://wa.me/5511987654321?text=');
  });
});

