import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, X, Download, RefreshCw, Key, Globe } from 'lucide-react';
import {
  clearSupabaseConfig,
  isSupabaseConfigured,
  saveSupabaseConfig,
  supabaseAnonKey,
  supabaseUrl,
  testSupabaseConnection,
} from '../../services/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState(supabaseUrl);
  const [key, setKey] = useState(supabaseAnonKey);
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ success: boolean; text: string } | null>(null);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setStatusMsg(null);
    const res = await testSupabaseConnection();
    setStatusMsg({ success: res.success, text: res.message });
    setTesting(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) {
      setStatusMsg({ success: false, text: 'Preencha a URL e a Anon Key do Supabase.' });
      return;
    }
    saveSupabaseConfig(url, key);
  };

  const handleClear = () => {
    clearSupabaseConfig();
  };

  const handleDownloadSchema = () => {
    const link = document.createElement('a');
    link.href = '/supabase/migrations/20260930_init_schema.sql';
    link.download = 'estacionamento_schema.sql';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 my-auto">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-600/20 text-emerald-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Configuração do Supabase</h3>
              <p className="text-xs text-slate-400">Banco de Dados PostgreSQL & Autenticação</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status pill */}
        <div className="my-4 p-3 rounded-xl border flex items-center justify-between bg-slate-950/70 border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            ></span>
            <span className="font-semibold text-slate-200">
              {isSupabaseConfigured
                ? 'Conectado ao Supabase Remoto'
                : 'Modo Demonstração Ativo (Armazenamento Local)'}
            </span>
          </div>
          {isSupabaseConfigured && (
            <button
              onClick={handleClear}
              className="text-[11px] text-red-400 hover:text-red-300 underline font-medium"
            >
              Desconectar
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Project URL do Supabase
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="url"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Anon / Public API Key
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={key}
                onChange={e => setKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                statusMsg.success
                  ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
                  : 'bg-red-950/70 border border-red-800 text-red-300'
              }`}
            >
              {statusMsg.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Migration script notice */}
          <div className="p-3 bg-blue-950/30 border border-blue-900/60 rounded-xl text-xs text-blue-200 space-y-1.5">
            <div className="font-semibold text-blue-300 flex items-center justify-between">
              <span>Script SQL de Migração do Banco:</span>
              <button
                type="button"
                onClick={handleDownloadSchema}
                className="text-[11px] bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 px-2 py-0.5 rounded border border-blue-500/40 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                Baixar SQL
              </button>
            </div>
            <p className="text-[11px] text-blue-300/80 leading-relaxed">
              O arquivo completo de tabelas e permissões RLS está salvo em{' '}
              <code className="bg-slate-900 px-1 py-0.5 rounded text-blue-300 font-mono">
                supabase/migrations/20260930_init_schema.sql
              </code>
              . Basta colar no SQL Editor do Supabase para criar as tabelas instantaneamente!
            </p>
          </div>

          <div className="pt-2 flex justify-between gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !isSupabaseConfigured}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              Testar Conexão
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs"
              >
                Fechar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow"
              >
                Salvar e Conectar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
