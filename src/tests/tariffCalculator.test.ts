import { describe, it, expect } from 'vitest';
import { calculateTariff } from '../services/tariffCalculator';
import { Settings } from '../types/parking';

const mockSettings: Settings = {
  id: 'test-settings',
  nome_estabelecimento: 'Estacionamento Teste',
  cnpj: '12.345.678/0001-90',
  endereco: 'Rua Teste, 100',
  telefone: '(11) 9999-8888',
  tarifa_hora: 10.0,
  tarifa_adicional_hora: 5.0,
  tarifa_diaria: 50.0,
  valor_minimo: 8.0,
  tolerancia_minutos: 15,
  tarifa_mensalista: 250.0,
  fator_moto: 0.7,
  fator_camionete: 1.2,
  vagas_totais: 50,
  impressora_padrao: '80mm',
  mensagem_rodape: 'Volte sempre',
  lgpd_termo: 'Termo LGPD',
};

describe('Motor de Cálculo de Tarifas (tariffCalculator)', () => {
  it('deve aplicar tolerância gratuita se tempo <= tolerancia_minutos', () => {
    const entry = new Date('2026-10-01T10:00:00Z');
    const exit = new Date('2026-10-01T10:14:00Z'); // 14 min

    const result = calculateTariff(entry, exit, 'carro', false, mockSettings);
    expect(result.tempoMinutos).toBe(14);
    expect(result.valorFinal).toBe(0);
    expect(result.isTolerancia).toBe(true);
  });

  it('deve isentar clientes mensalistas de cobrança avulsa', () => {
    const entry = new Date('2026-10-01T08:00:00Z');
    const exit = new Date('2026-10-01T18:00:00Z'); // 10 horas

    const result = calculateTariff(entry, exit, 'carro', true, mockSettings);
    expect(result.valorFinal).toBe(0);
    expect(result.isMensalista).toBe(true);
  });

  it('deve cobrar a primeira hora cheia após a tolerância', () => {
    const entry = new Date('2026-10-01T10:00:00Z');
    const exit = new Date('2026-10-01T10:45:00Z'); // 45 min

    const result = calculateTariff(entry, exit, 'carro', false, mockSettings);
    expect(result.tempoMinutos).toBe(45);
    expect(result.horasCobradas).toBe(1);
    expect(result.valorFinal).toBe(10.0);
  });

  it('deve calcular horas adicionais progressivas corretamente', () => {
    const entry = new Date('2026-10-01T10:00:00Z');
    const exit = new Date('2026-10-01T12:05:00Z'); // 2h 05m -> 3 horas comerciais

    // 1ª hora: 10 + 2 adicionais a 5 cada = 20.00
    const result = calculateTariff(entry, exit, 'carro', false, mockSettings);
    expect(result.horasCobradas).toBe(3);
    expect(result.valorFinal).toBe(20.0);
  });

  it('deve aplicar teto da diária quando horas excederem o valor da diária', () => {
    const entry = new Date('2026-10-01T08:00:00Z');
    const exit = new Date('2026-10-01T20:00:00Z'); // 12 horas: 10 + 11*5 = 65, mas diária = 50

    const result = calculateTariff(entry, exit, 'carro', false, mockSettings);
    expect(result.valorFinal).toBe(50.0);
    expect(result.isDiaria).toBe(true);
  });

  it('deve aplicar fator de desconto para motos', () => {
    const entry = new Date('2026-10-01T10:00:00Z');
    const exit = new Date('2026-10-01T11:00:00Z'); // 1 hora: 10 * 0.7 = 7.00, mas mínimo é 8.00

    const result = calculateTariff(entry, exit, 'moto', false, mockSettings);
    expect(result.valorFinal).toBe(8.0); // mínimo respeitado
  });

  it('deve aplicar fator de acréscimo para camionetes', () => {
    const entry = new Date('2026-10-01T10:00:00Z');
    const exit = new Date('2026-10-01T12:00:00Z'); // 2 horas: 10 + 5 = 15 * 1.2 = 18.00

    const result = calculateTariff(entry, exit, 'camionete', false, mockSettings);
    expect(result.valorFinal).toBe(18.0);
  });

  it('deve liberar saída com R$ 0,00 quando a diária fixa for paga adiantada na entrada', () => {
    const entry = new Date('2026-10-01T08:00:00Z');
    const exit = new Date('2026-10-01T17:30:00Z'); // 9h 30m de permanência

    const result = calculateTariff(entry, exit, 'carro', false, mockSettings, {
      tipo_cobranca: 'diaria_fixa',
      valor_diaria_fixa: 60.0,
      pago_na_entrada: true,
    });

    expect(result.isDiariaFixa).toBe(true);
    expect(result.isPagoNaEntrada).toBe(true);
    expect(result.valorFinal).toBe(0); // Quitado na entrada
    expect(result.descricaoRegra).toContain('Pré-paga');
  });

  it('deve cobrar o valor fixo da diária na saída quando acordado na entrada e não pré-pago', () => {
    const entry = new Date('2026-10-01T08:00:00Z');
    const exit = new Date('2026-10-01T14:00:00Z'); // 6 horas

    const result = calculateTariff(entry, exit, 'carro', false, mockSettings, {
      tipo_cobranca: 'diaria_fixa',
      valor_diaria_fixa: 55.0,
      pago_na_entrada: false,
    });

    expect(result.isDiariaFixa).toBe(true);
    expect(result.isPagoNaEntrada).toBe(false);
    expect(result.valorFinal).toBe(55.0); // Valor exato da diária fixa
  });

  it('deve calcular por tempo normal quando o valor da diária não for preenchido (campo vazio)', () => {
    const entry = new Date('2026-10-01T10:00:00Z');
    const exit = new Date('2026-10-01T11:30:00Z'); // 1h 30m -> 2 horas comerciais

    // Campo vazio / null -> cobrança normal por tempo: 10 (1ªh) + 5 (adicional) = 15.00
    const result = calculateTariff(entry, exit, 'carro', false, mockSettings, {
      tipo_cobranca: 'tempo',
      valor_diaria_fixa: null,
      pago_na_entrada: false,
    });

    expect(result.isDiariaFixa).toBe(false);
    expect(result.horasCobradas).toBe(2);
    expect(result.valorFinal).toBe(15.0);
  });
});
