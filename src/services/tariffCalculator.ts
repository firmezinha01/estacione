import { Settings, TariffCalculationResult, VehicleType } from '../types/parking';

export interface EntryTariffMeta {
  tipo_cobranca?: 'tempo' | 'diaria_fixa';
  valor_diaria_fixa?: number | null;
  pago_na_entrada?: boolean;
}

export function calculateTariff(
  entryDate: string | Date,
  exitDate: string | Date = new Date(),
  vehicleType: VehicleType = 'carro',
  isMensalista: boolean = false,
  settings: Settings,
  entryMeta?: EntryTariffMeta
): TariffCalculationResult {
  const start = new Date(entryDate).getTime();
  const end = new Date(exitDate).getTime();
  const diffMs = Math.max(0, end - start);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const tempoFormatado = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

  // 1. Mensalista: isenção de cobrança avulsa
  if (isMensalista) {
    return {
      tempoMinutos: diffMinutes,
      tempoFormatado,
      horasCobradas: 0,
      tarifaBase: 0,
      fatorTipo: 1,
      valorBruto: 0,
      valorFinal: 0,
      isTolerancia: false,
      isDiaria: false,
      isMensalista: true,
      descricaoRegra: 'Cliente Mensalista (mensalidade vigente)',
    };
  }

  // 2. Diária Fixa (Pré-paga na entrada ou acordada na entrada)
  if (
    entryMeta?.tipo_cobranca === 'diaria_fixa' &&
    entryMeta.valor_diaria_fixa != null &&
    entryMeta.valor_diaria_fixa > 0
  ) {
    const fixedRate = entryMeta.valor_diaria_fixa;
    const formattedRate = fixedRate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    if (entryMeta.pago_na_entrada) {
      return {
        tempoMinutos: diffMinutes,
        tempoFormatado,
        horasCobradas: 0,
        tarifaBase: fixedRate,
        fatorTipo: 1,
        valorBruto: fixedRate,
        valorFinal: 0, // Saída liberada sem cobrança adicional no caixa
        isTolerancia: false,
        isDiaria: true,
        isMensalista: false,
        isDiariaFixa: true,
        isPagoNaEntrada: true,
        descricaoRegra: `Diária Fixa Pré-paga na Entrada (${formattedRate}) - Saída Liberada`,
      };
    } else {
      return {
        tempoMinutos: diffMinutes,
        tempoFormatado,
        horasCobradas: 0,
        tarifaBase: fixedRate,
        fatorTipo: 1,
        valorBruto: fixedRate,
        valorFinal: fixedRate,
        isTolerancia: false,
        isDiaria: true,
        isMensalista: false,
        isDiariaFixa: true,
        isPagoNaEntrada: false,
        descricaoRegra: `Diária Fixa (${formattedRate})`,
      };
    }
  }

  // 3. Período de tolerância (ex: até 15 minutos gratuitos)
  if (diffMinutes <= settings.tolerancia_minutos) {
    return {
      tempoMinutos: diffMinutes,
      tempoFormatado,
      horasCobradas: 0,
      tarifaBase: 0,
      fatorTipo: 1,
      valorBruto: 0,
      valorFinal: 0,
      isTolerancia: true,
      isDiaria: false,
      isMensalista: false,
      descricaoRegra: `Dentro da tolerância (${settings.tolerancia_minutos} min)`,
    };
  }

  // 4. Fator por categoria de veículo
  let fatorTipo = 1.0;
  if (vehicleType === 'moto') {
    fatorTipo = settings.fator_moto || 0.70;
  } else if (vehicleType === 'camionete') {
    fatorTipo = settings.fator_camionete || 1.25;
  }

  // 5. Cálculo normal por tempo (diárias e frações progressivas)
  const totalDays = Math.floor(diffMinutes / (24 * 60));
  const remainingMinutes = diffMinutes % (24 * 60);

  let valorHoras = 0;
  let horasCobradas = 0;

  if (remainingMinutes > 0) {
    horasCobradas = Math.ceil(remainingMinutes / 60);

    if (horasCobradas <= 1) {
      valorHoras = settings.tarifa_hora;
    } else {
      valorHoras = settings.tarifa_hora + (horasCobradas - 1) * settings.tarifa_adicional_hora;
    }

    if (valorHoras > settings.tarifa_diaria) {
      valorHoras = settings.tarifa_diaria;
    }
  }

  const valorTotalBruto = totalDays * settings.tarifa_diaria + valorHoras;
  let valorFinal = valorTotalBruto * fatorTipo;

  // Garantir valor mínimo se houver cobrança
  if (valorFinal > 0 && valorFinal < settings.valor_minimo) {
    valorFinal = settings.valor_minimo;
  }

  valorFinal = Math.round(valorFinal * 100) / 100;

  const isDiaria = totalDays > 0 || valorHoras >= settings.tarifa_diaria;
  let descricaoRegra = `${horasCobradas} hora(s) calculada(s) por tempo`;
  if (totalDays > 0) {
    descricaoRegra = `${totalDays} diária(s) + ${horasCobradas}h por tempo`;
  } else if (isDiaria) {
    descricaoRegra = `Tarifa teto diária (${settings.tarifa_diaria.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`;
  }

  if (fatorTipo !== 1.0) {
    const perc = Math.round((fatorTipo - 1) * 100);
    const percStr = perc > 0 ? `+${perc}%` : `${perc}%`;
    descricaoRegra += ` (${vehicleType} ${percStr})`;
  }

  return {
    tempoMinutos: diffMinutes,
    tempoFormatado,
    horasCobradas,
    tarifaBase: valorTotalBruto,
    fatorTipo,
    valorBruto: valorTotalBruto,
    valorFinal,
    isTolerancia: false,
    isDiaria,
    isMensalista: false,
    isDiariaFixa: false,
    isPagoNaEntrada: false,
    descricaoRegra,
  };
}
