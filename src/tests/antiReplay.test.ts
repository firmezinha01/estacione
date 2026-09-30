import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../services/storage';

describe('Segurança e Proteção Anti-Replay de QR Code (Validação Única)', () => {
  beforeEach(() => {
    storage.resetDatabase();
  });

  it('deve gerar ticket único ativo na entrada', () => {
    const { entry, label } = storage.createEntry({
      placa: 'TEST123',
      modelo: 'Civic',
      cor: 'Preto',
      tipo: 'carro',
    });

    expect(entry).toBeDefined();
    expect(label.codigo_unico).toMatch(/^EST-[A-Z0-9]{6}$/);
    expect(label.status).toBe('ativo');
    expect(entry.status).toBe('ativo');
  });

  it('deve permitir a baixa e pagamento do ticket na primeira vez', () => {
    const { entry } = storage.createEntry({
      placa: 'TEST999',
      modelo: 'Gol',
      cor: 'Branco',
      tipo: 'carro',
    });

    const result = storage.processCheckout(entry.id, 'pix', 15.0);
    expect(result.success).toBe(true);
    expect(result.entry?.status).toBe('pago');
    expect(result.entry?.label?.status).toBe('utilizado');
  });

  it('deve BLOQUEAR tentativa de reutilização do QR Code já baixado (Anti-Replay)', () => {
    const { entry } = storage.createEntry({
      placa: 'REPLAY1',
      modelo: 'Cruze',
      cor: 'Cinza',
      tipo: 'carro',
    });

    // 1ª Baixa - Sucesso
    const firstCheckout = storage.processCheckout(entry.id, 'dinheiro', 20.0);
    expect(firstCheckout.success).toBe(true);

    // 2ª Baixa (Tentativa de fraude / reutilização) - DEVE SER BLOQUEADA
    const secondCheckout = storage.processCheckout(entry.id, 'dinheiro', 20.0);
    expect(secondCheckout.success).toBe(false);
    expect(secondCheckout.message).toContain('já foi utilizado');
  });

  it('deve impedir checkout de ticket cancelado', () => {
    const { entry } = storage.createEntry({
      placa: 'CANCEL1',
      modelo: 'HB20',
      cor: 'Vermelho',
      tipo: 'carro',
    });

    // Cancelar
    storage.cancelEntry(entry.id, 'Cancelamento para teste unitario');

    const result = storage.processCheckout(entry.id, 'cartao_credito', 10.0);
    expect(result.success).toBe(false);
    expect(result.message).toContain('cancelado');
  });
});
