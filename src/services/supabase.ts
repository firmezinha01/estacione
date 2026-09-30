import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Read from Vite environment or localStorage override
const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const storedConfig = (() => {
  try {
    const raw = localStorage.getItem('estacionamento_supabase_config');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

export const supabaseUrl = storedConfig?.url || envUrl;
export const supabaseAnonKey = storedConfig?.key || envKey;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function saveSupabaseConfig(url: string, key: string): void {
  localStorage.setItem(
    'estacionamento_supabase_config',
    JSON.stringify({ url: url.trim(), key: key.trim() })
  );
  window.location.reload();
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem('estacionamento_supabase_config');
  window.location.reload();
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase não está configurado. Operando em Modo Demonstração Local.',
    };
  }

  try {
    const { error } = await supabase.from('settings').select('id').limit(1);
    if (error) {
      return {
        success: false,
        message: `Erro ao conectar com Supabase: ${error.message}. Verifique se aplicou o script SQL das tabelas!`,
      };
    }
    return {
      success: true,
      message: 'Conexão com o Supabase estabelecida com sucesso!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha de rede ao conectar com Supabase: ${err.message || err}`,
    };
  }
}
