import React, { useMemo } from 'react';
import {
  DollarSign,
  Car,
  Clock,
  TrendingUp,
  CreditCard,
  Percent,
  Download,
  ShieldAlert,
  ArrowUpRight,
  PieChart as PieIcon,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { useParking } from '../../context/ParkingContext';
import { formatBRL, formatDurationMinutes } from '../../utils/formatters';
import { exportEntriesToCsv } from '../../services/exportCsv';

export const AdminDashboard: React.FC = () => {
  const { entries, activeEntries, settings, customers } = useParking();

  // Financial KPIs
  const completedEntries = useMemo(() => entries.filter(e => e.status === 'pago'), [entries]);

  const totalFaturamento = useMemo(() => {
    return completedEntries.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
  }, [completedEntries]);

  // Mensalistas total active revenue
  const totalMensalistasFaturamento = useMemo(() => {
    return customers
      .filter(c => c.tipo === 'mensalista' && c.ativo)
      .reduce((acc, curr) => acc + (curr.mensalidade_valor || settings.tarifa_mensalista), 0);
  }, [customers, settings.tarifa_mensalista]);

  // Average stay time
  const tempoMedioMinutos = useMemo(() => {
    if (completedEntries.length === 0) return 0;
    const totalMins = completedEntries.reduce((acc, curr) => acc + (curr.tempo_minutos || 0), 0);
    return Math.round(totalMins / completedEntries.length);
  }, [completedEntries]);

  // Occupancy rate
  const occupancyCount = activeEntries.length;
  const occupancyPercent = Math.min(100, Math.round((occupancyCount / settings.vagas_totais) * 100));

  // Payment Methods Distribution Data
  const paymentMethodsData = useMemo(() => {
    const counts: Record<string, number> = {
      pix: 0,
      dinheiro: 0,
      cartao_credito: 0,
      cartao_debito: 0,
      faturado: 0,
    };

    completedEntries.forEach(e => {
      const method = e.payment?.metodo || 'dinheiro';
      counts[method] = (counts[method] || 0) + (e.valor_total || 0);
    });

    const labelsMap: Record<string, string> = {
      pix: 'PIX',
      dinheiro: 'Dinheiro',
      cartao_credito: 'C. Crédito',
      cartao_debito: 'C. Débito',
      faturado: 'Mensalista',
    };

    return Object.entries(counts).map(([key, val]) => ({
      name: labelsMap[key] || key,
      valor: Math.round(val * 100) / 100,
    }));
  }, [completedEntries]);

  // Vehicle Categories Breakdown Data
  const vehicleCategoryData = useMemo(() => {
    const counts: Record<string, number> = {
      carro: 0,
      moto: 0,
      camionete: 0,
      outros: 0,
    };

    entries.forEach(e => {
      const tipo = e.vehicle?.tipo || 'carro';
      counts[tipo] = (counts[tipo] || 0) + 1;
    });

    return [
      { name: 'Carros', count: counts.carro, color: '#3b82f6' },
      { name: 'Motos', count: counts.moto, color: '#f59e0b' },
      { name: 'Camionetes', count: counts.camionete, color: '#8b5cf6' },
      { name: 'Outros', count: counts.outros, color: '#10b981' },
    ].filter(item => item.count > 0);
  }, [entries]);

  // Hourly Traffic Trends
  const hourlyTrafficData = useMemo(() => {
    const hoursCount: Record<number, number> = {};
    for (let i = 6; i <= 22; i++) {
      hoursCount[i] = 0;
    }

    entries.forEach(e => {
      const d = new Date(e.horario_entrada);
      const h = d.getHours();
      if (hoursCount[h] !== undefined) {
        hoursCount[h]++;
      }
    });

    return Object.entries(hoursCount).map(([hour, count]) => ({
      hora: `${hour.padStart(2, '0')}h`,
      veiculos: count,
    }));
  }, [entries]);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4'];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Painel Administrativo & Métricas</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-mono font-semibold border border-purple-500/30">
              Admin Ativo
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Métricas de faturamento, ocupação em tempo real e tempo médio de permanência
          </p>
        </div>

        <button
          onClick={() => exportEntriesToCsv(entries)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all border border-slate-700 shadow active:scale-95"
          title="Exportar todas as estadias para planilha CSV"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Exportar Relatório CSV</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Faturamento Baixas</span>
            <div className="p-2 bg-emerald-600/20 text-emerald-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white font-mono tracking-tight block">
              {formatBRL(totalFaturamento)}
            </span>
            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>{completedEntries.length} tickets finalizados</span>
            </span>
          </div>
        </div>

        {/* Card 2: Veículos Ativos & Ocupação */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Ocupação Atual</span>
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                {occupancyCount} / {settings.vagas_totais}
              </span>
              <span className="text-xs font-bold text-blue-400">({occupancyPercent}%)</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${occupancyPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Tempo Médio de Permanência */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Permanência Média</span>
            <div className="p-2 bg-amber-600/20 text-amber-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white font-mono tracking-tight block">
              {formatDurationMinutes(tempoMedioMinutos)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Baseado no histórico do período
            </span>
          </div>
        </div>

        {/* Card 4: Receita Mensalistas */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Contratos Mensalistas</span>
            <div className="p-2 bg-purple-600/20 text-purple-400 rounded-xl">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-purple-300 font-mono tracking-tight block">
              {formatBRL(totalMensalistasFaturamento)}
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {customers.filter(c => c.tipo === 'mensalista' && c.ativo).length} mensalistas ativos
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Traffic Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span>Fluxo de Entradas por Horário (Picos)</span>
              </h3>
              <p className="text-[11px] text-slate-500">Distribuição ao longo do dia comercial</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyTrafficData}>
                <defs>
                  <linearGradient id="colorVeiculos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hora" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="veiculos"
                  name="Entradas"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorVeiculos)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Bar Chart */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-400" />
                <span>Receita por Forma de Pagamento (R$)</span>
              </h3>
              <p className="text-[11px] text-slate-500">PIX, Dinheiro, Débito e Crédito</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentMethodsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  formatter={(val: any) => formatBRL(Number(val) || 0)}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="valor" name="Total (R$)" radius={[6, 6, 0, 0]}>
                  {paymentMethodsData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
