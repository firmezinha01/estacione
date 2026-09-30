import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  Printer,
  Shield,
  Building,
  Car,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';
import { Settings } from '../../types/parking';

export const TariffSettings: React.FC = () => {
  const { settings, updateSettings, resetDatabase } = useParking();

  const [formData, setFormData] = useState<Settings>({ ...settings });
  const [successMsg, setSuccessMsg] = useState(false);

  const handleChange = (field: keyof Settings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Tem certeza que deseja restaurar os dados de demonstração? Isso recriará os veículos de teste e estadias pré-configuradas.'
      )
    ) {
      resetDatabase();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Configurações & Tarifas</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-mono font-semibold border border-blue-500/30">
              Precificação
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Personalize os valores de hora, tolerância, diária, taxas de categorias e impressora térmica
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetData}
          className="flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-95"
          title="Restaura banco local com dados de demonstração"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Demo</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Tarifas e Regras de Cobrança */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800 text-sm font-bold text-white mb-4">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Tabela de Tarifas & Tolerância</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Tarifa da 1ª Hora (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.50"
                required
                value={formData.tarifa_hora}
                onChange={e => handleChange('tarifa_hora', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Valor cobrado ao completar a primeira hora
              </span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Hora Adicional (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.50"
                required
                value={formData.tarifa_adicional_hora}
                onChange={e =>
                  handleChange('tarifa_adicional_hora', parseFloat(e.target.value) || 0)
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Cobrado por cada hora ou fração subsequente
              </span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Tarifa Diária / Teto 24h (R$)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={formData.tarifa_diaria}
                onChange={e => handleChange('tarifa_diaria', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Teto máximo por período de 24 horas
              </span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Tolerância Gratuita (minutos)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                required
                value={formData.tolerancia_minutos}
                onChange={e => handleChange('tolerancia_minutos', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Permanência até este tempo não é cobrada
              </span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Valor Mínimo Cobrado (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.50"
                required
                value={formData.valor_minimo}
                onChange={e => handleChange('valor_minimo', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Piso financeiro ao ultrapassar a tolerância
              </span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Mensalidade Padrão (R$)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                required
                value={formData.tarifa_mensalista}
                onChange={e => handleChange('tarifa_mensalista', parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Valor de referência para novos contratos
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Fatores por Categoria & Capacidade */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800 text-sm font-bold text-white mb-4">
            <Car className="w-4 h-4 text-blue-400" />
            <span>Fatores de Categoria & Vagas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Fator Moto (Ex: 0.70 = 30% desconto)
              </label>
              <input
                type="number"
                min="0.1"
                max="2.0"
                step="0.05"
                required
                value={formData.fator_moto}
                onChange={e => handleChange('fator_moto', parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Aplica multiplicador na tarifa de motocicletas
              </span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Fator Camionete (Ex: 1.25 = 25% acréscimo)
              </label>
              <input
                type="number"
                min="0.5"
                max="3.0"
                step="0.05"
                required
                value={formData.fator_camionete}
                onChange={e => handleChange('fator_camionete', parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Aplica multiplicador para veículos grandes
              </span>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Total de Vagas do Estacionamento
              </label>
              <input
                type="number"
                min="1"
                max="5000"
                required
                value={formData.vagas_totais}
                onChange={e => handleChange('vagas_totais', parseInt(e.target.value) || 50)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none font-mono font-bold"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Capacidade física máxima de vagas
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Impressão Térmica & Dados do Estabelecimento */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-md">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800 text-sm font-bold text-white mb-4">
            <Building className="w-4 h-4 text-purple-400" />
            <span>Dados da Empresa & Impressão Térmica</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Nome do Estabelecimento
              </label>
              <input
                type="text"
                required
                value={formData.nome_estabelecimento}
                onChange={e => handleChange('nome_estabelecimento', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">CNPJ</label>
              <input
                type="text"
                required
                value={formData.cnpj}
                onChange={e => handleChange('cnpj', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">Endereço Completo</label>
              <input
                type="text"
                required
                value={formData.endereco}
                onChange={e => handleChange('endereco', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                required
                value={formData.telefone}
                onChange={e => handleChange('telefone', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Largura Padrão da Impressora Térmica
              </label>
              <select
                value={formData.impressora_padrao}
                onChange={e => handleChange('impressora_padrao', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="80mm">80mm (Bobina Padrão de Ponto de Venda)</option>
                <option value="58mm">58mm (Bobina Compacta / Impressora Bluetooth)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Mensagem de Rodapé da Etiqueta
              </label>
              <input
                type="text"
                value={formData.mensagem_rodape}
                onChange={e => handleChange('mensagem_rodape', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          {successMsg ? (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-800 px-3 py-2 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
              Configurações salvas com sucesso!
            </span>
          ) : (
            <div></div>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </form>
    </div>
  );
};
