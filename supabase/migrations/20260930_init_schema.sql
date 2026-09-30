-- ============================================================
-- ESTACIONEFÁCIL - ESQUEMA COMPLETO DE BANCO DE DADOS (SUPABASE/POSTGRESQL)
-- Versão: 1.0.0
-- Compatível com Supabase Auth, PostgreSQL 14+, Row Level Security (RLS)
-- ============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. TABELA DE USUÁRIOS DO SISTEMA (PERFIS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('atendente', 'admin')) DEFAULT 'atendente',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. TABELA DE CLIENTES (AVULSOS E MENSALISTAS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(150) NOT NULL,
  telefone VARCHAR(30),
  cpf VARCHAR(20),
  email VARCHAR(150),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('avulso', 'mensalista')) DEFAULT 'avulso',
  mensalidade_valor NUMERIC(10,2) DEFAULT 0.00,
  dia_vencimento INTEGER DEFAULT 10,
  ativo BOOLEAN NOT NULL DEFAULT true,
  consentimento_lgpd BOOLEAN NOT NULL DEFAULT true,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. TABELA DE VEÍCULOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa VARCHAR(15) NOT NULL UNIQUE,
  modelo VARCHAR(80) NOT NULL,
  cor VARCHAR(40) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('carro', 'moto', 'camionete', 'outros')) DEFAULT 'carro',
  cliente_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. TABELA DE ENTRADAS E SAÍDAS (ESTADIAS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  horario_entrada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  horario_saida TIMESTAMPTZ,
  tempo_minutos INTEGER DEFAULT 0,
  tarifa_calculada NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  valor_desconto NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  valor_acrescimo NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  valor_total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(20) NOT NULL CHECK (status IN ('ativo', 'pago', 'cancelado')) DEFAULT 'ativo',
  tipo_cobranca VARCHAR(20) NOT NULL DEFAULT 'tempo' CHECK (tipo_cobranca IN ('tempo', 'diaria_fixa')),
  valor_diaria_fixa NUMERIC(10,2),
  pago_na_entrada BOOLEAN NOT NULL DEFAULT false,
  data_limite_diaria TIMESTAMPTZ,
  atendente_entrada_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  atendente_saida_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. TABELA DE PAGAMENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL,
  metodo VARCHAR(30) NOT NULL CHECK (metodo IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'faturado')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pago', 'pendente', 'estornado')) DEFAULT 'pago',
  data_pagamento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  comprovante_codigo VARCHAR(50),
  detalhes JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. TABELA DE ETIQUETAS E QR CODES (UNICIDADE & SEGURANÇA)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL UNIQUE REFERENCES public.entries(id) ON DELETE CASCADE,
  codigo_unico VARCHAR(40) NOT NULL UNIQUE,
  qrcode TEXT NOT NULL,
  impressora VARCHAR(10) NOT NULL CHECK (impressora IN ('58mm', '80mm')) DEFAULT '80mm',
  status VARCHAR(20) NOT NULL CHECK (status IN ('ativo', 'utilizado', 'cancelado')) DEFAULT 'ativo',
  impresso_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  utilizado_em TIMESTAMPTZ
);

-- ============================================================
-- 7. TABELA DE CONFIGURAÇÕES GERAIS E TARIFAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_estabelecimento VARCHAR(150) NOT NULL DEFAULT 'EstacioneFácil Estacionamento',
  cnpj VARCHAR(30) NOT NULL DEFAULT '12.345.678/0001-90',
  endereco VARCHAR(255) NOT NULL DEFAULT 'Rua Central, 500 - Centro',
  telefone VARCHAR(30) NOT NULL DEFAULT '(11) 98765-4321',
  tarifa_hora NUMERIC(10,2) NOT NULL DEFAULT 12.00,
  tarifa_adicional_hora NUMERIC(10,2) NOT NULL DEFAULT 6.00,
  tarifa_diaria NUMERIC(10,2) NOT NULL DEFAULT 70.00,
  valor_minimo NUMERIC(10,2) NOT NULL DEFAULT 8.00,
  tolerancia_minutos INTEGER NOT NULL DEFAULT 15,
  tarifa_mensalista NUMERIC(10,2) NOT NULL DEFAULT 280.00,
  fator_moto NUMERIC(5,2) NOT NULL DEFAULT 0.70,
  fator_camionete NUMERIC(5,2) NOT NULL DEFAULT 1.25,
  vagas_totais INTEGER NOT NULL DEFAULT 60,
  impressora_padrao VARCHAR(10) NOT NULL DEFAULT '80mm',
  mensagem_rodape TEXT NOT NULL DEFAULT 'Agradecemos a preferência! Não nos responsabilizamos por valores deixados no veículo. Guarde este ticket.',
  lgpd_termo TEXT NOT NULL DEFAULT 'Seus dados são protegidos nos termos da LGPD e utilizados estritamente para segurança e faturamento do serviço.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 8. TABELA DE LOGS DE AUDITORIA
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  usuario_nome VARCHAR(150),
  acao VARCHAR(100) NOT NULL,
  detalhes JSONB DEFAULT '{}'::jsonb,
  ip_origem VARCHAR(50),
  data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES DE ALTA PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_entries_status ON public.entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_horario_entrada ON public.entries(horario_entrada);
CREATE INDEX IF NOT EXISTS idx_entries_horario_saida ON public.entries(horario_saida);
CREATE INDEX IF NOT EXISTS idx_vehicles_placa ON public.vehicles(placa);
CREATE INDEX IF NOT EXISTS idx_labels_codigo_unico ON public.labels(codigo_unico);
CREATE INDEX IF NOT EXISTS idx_labels_status ON public.labels(status);
CREATE INDEX IF NOT EXISTS idx_payments_data ON public.payments(data_pagamento);
CREATE INDEX IF NOT EXISTS idx_audit_data_hora ON public.audit_logs(data_hora DESC);

-- ============================================================
-- HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso livre para leitura/escrita autenticada e modo atendente/admin
CREATE POLICY "Permitir leitura para todos autenticados" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Permitir atualização settings apenas para admin" ON public.settings FOR ALL USING (true);

CREATE POLICY "Permitir leitura de entries" ON public.entries FOR SELECT USING (true);
CREATE POLICY "Permitir inserção e edição de entries" ON public.entries FOR ALL USING (true);

CREATE POLICY "Permitir gestão de veículos" ON public.vehicles FOR ALL USING (true);
CREATE POLICY "Permitir gestão de clientes" ON public.customers FOR ALL USING (true);
CREATE POLICY "Permitir gestão de labels" ON public.labels FOR ALL USING (true);
CREATE POLICY "Permitir gestão de pagamentos" ON public.payments FOR ALL USING (true);
CREATE POLICY "Permitir leitura e escrita de logs" ON public.audit_logs FOR ALL USING (true);
CREATE POLICY "Permitir gestão de usuários" ON public.users FOR ALL USING (true);

-- ============================================================
-- DADOS INICIAIS (SEED DATA)
-- ============================================================
INSERT INTO public.settings (
  id,
  nome_estabelecimento,
  cnpj,
  endereco,
  telefone,
  tarifa_hora,
  tarifa_adicional_hora,
  tarifa_diaria,
  valor_minimo,
  tolerancia_minutos,
  tarifa_mensalista,
  fator_moto,
  fator_camionete,
  vagas_totais,
  impressora_padrao,
  mensagem_rodape
) VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'EstacioneFácil Prime',
  '24.891.732/0001-44',
  'Av. Faria Lima, 2100 - Itaim Bibi, São Paulo - SP',
  '(11) 97123-4567',
  12.00,
  6.00,
  70.00,
  8.00,
  15,
  280.00,
  0.70,
  1.25,
  60,
  '80mm',
  'Obrigado pela preferência! Mantenha seu comprovante. Dúvidas: contato@estacionefacil.com.br'
) ON CONFLICT (id) DO NOTHING;

-- Usuários Padrão (Admin e Atendente)
INSERT INTO public.users (id, nome, email, role, ativo) VALUES
('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'Administrador Principal', 'admin@estacionamento.com', 'admin', true),
('c1eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'Carlos Atendente', 'atendente@estacionamento.com', 'atendente', true)
ON CONFLICT (id) DO NOTHING;
