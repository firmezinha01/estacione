# 🚗 EstacioneFácil - Sistema Completo de Estacionamento Inteligente (PWA)

Sistema moderno, responsivo e seguro para gestão de estacionamentos com controle de entrada e saída de veículos, cálculo automático de tarifas, emissão de etiquetas térmicas (58mm e 80mm com comandos ESC/POS e layout de impressão otimizado), validação via QR Code pelo celular com proteção contra reutilização (anti-replay), painel do atendente, painel administrativo, relatórios gerenciais com gráficos Recharts e exportação em CSV, além de suporte completo a PWA (Progressive Web App).

---

## 🌟 Principais Funcionalidades

1. **Controle de Entrada e Saída de Veículos:**
   - Cadastro rápido com suporte a placas no formato padrão (`ABC-1234`) e Mercosul (`ABC1D23`).
   - Categorização por tipos de veículo: Carros, Motos, Camionetes/Pickups e Outros.
   - Associação de clientes avulsos e clientes mensalistas.
   - Cronômetro em tempo real de permanência no pátio.

2. **Cálculo Automático e Flexível de Tarifas:**
   - Período de tolerância gratuita configurável (ex: 15 minutos).
   - Cobrança de 1ª hora cheia + horas adicionais progressivas.
   - Teto diário de 24 horas (diária com bloqueio de estouro de horas).
   - Fatores multiplicadores por categoria de veículo (ex: desconto de 30% para motos e acréscimo de 25% para camionetes).
   - Isenção automática de cobrança avulsa para clientes mensalistas com plano ativo.
   - Calculadora de troco integrada para pagamentos em dinheiro.

3. **Emissão de Etiquetas Térmicas (58mm e 80mm) & ESC/POS:**
   - Compatível com bobinas de 58mm (impressoras portáteis Bluetooth como POS-58, MPT-II) e 80mm (impressoras de mesa de PDV).
   - Comandos nativos **ESC/POS** em binário (`Uint8Array`) para envio direto via **Web Bluetooth API**, **Web Serial API** ou aplicativo **RawBT Print Service** para celulares Android.
   - Layout CSS `@media print` de alto contraste com código QR de alta definição, código único do ticket, dados do estabelecimento, tabela resumida de tarifas e linha guia de corte `✂`.

4. **Validação de QR Code no Celular com Proteção Anti-Replay:**
   - Leitor de câmera mobile integrado com alternância de câmera frontal/traseira (`html5-qrcode`).
   - Campo de busca manual por código (`EST-XXXXXX`) ou placa para ambientes sem câmera.
   - **Garantia de uso único:** O sistema valida a unicidade do QR Code e bloqueia tentativas de reutilização de tickets já baixados anteriormente ou cancelados.

5. **Painel do Atendente (Operacional):**
   - Grade/lista de veículos estacionados com busca instantânea e filtros por categoria.
   - Acesso em 1 clique para emissão de entrada, reimpressão de ticket e baixa com recebimento (PIX, Dinheiro, Cartão de Crédito, Débito e Faturado).

6. **Gestão de Mensalistas:**
   - Cadastro de mensalistas com valor do plano contratado, dia de vencimento e múltiplos veículos vinculados.
   - Botão de liberação rápida de entrada para mensalistas cadastrados.

7. **Painel Administrativo & Gráficos:**
   - Indicadores-chave de desempenho (KPIs): Faturamento total, taxa de ocupação do pátio, tempo médio de permanência e arrecadação de mensalidades.
   - Gráficos interativos em **Recharts**:
     - Arrecadação por forma de pagamento (PIX, Dinheiro, Cartões).
     - Horários de pico de entrada ao longo do dia.
   - Gestão completa das configurações e tabela de preços.
   - Gestão de operadores (Perfis: Administrador vs Atendente).

8. **Logs de Auditoria & Conformidade LGPD:**
   - Registro de data/hora, operador e IP para todas as ações operacionais, alterações tarifárias e baixas.
   - Direito ao esquecimento: ferramenta para exclusão auditada de dados de clientes a pedido do titular.
   - Exportação em CSV de relatórios de estadias e logs de auditoria.

9. **Progressive Web App (PWA):**
   - Instalável na tela inicial do celular (Android e iOS) ou como aplicativo de computador (Windows, Mac, Linux).
   - Manifesto customizado, Service Worker com cache offline e ícones em alta resolução (192x192 e 512x512).

---

## 🏗️ Arquitetura do Projeto

```
/
├── public/
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   └── icons/
│       ├── icon-192x192.png
│       └── icon-512x512.png
├── src/
│   ├── components/
│   │   ├── checkout/
│   │   │   └── CheckoutModal.tsx          # Modal de pagamento, descontos e baixa
│   │   ├── common/
│   │   │   ├── LgpdModal.tsx              # Conformidade e privacidade LGPD
│   │   │   └── SupabaseModal.tsx          # Conexão e status do banco
│   │   ├── entry/
│   │   │   └── VehicleEntryModal.tsx      # Cadastro de entrada e emissão
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                 # Barra superior com relógio e ocupação
│   │   │   └── Sidebar.tsx                # Navegação lateral por abas
│   │   ├── scanner/
│   │   │   └── QrScannerModal.tsx         # Leitor de QR Code via câmera mobile
│   │   └── ticket/
│   │       ├── ThermalTicket.tsx          # Layout visual da etiqueta 58mm/80mm
│   │       └── TicketPrintModal.tsx       # Impressão térmica e ESC/POS
│   ├── context/
│   │   └── ParkingContext.tsx             # Estado global, sincronização e operadores
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── AdminDashboard.tsx         # Gráficos Recharts e métricas financeiras
│   │   │   ├── AuditLogsPage.tsx          # Visualização de auditoria e exportação
│   │   │   ├── ReportsPage.tsx            # Histórico de estadias com filtros e CSV
│   │   │   ├── TariffSettings.tsx         # Configuração de tarifas e dados da empresa
│   │   │   └── UserManagement.tsx         # Gestão de atendentes e administradores
│   │   ├── attendant/
│   │   │   ├── AttendantDashboard.tsx     # Pátio ativo e veículos estacionados
│   │   │   └── MensalistasPage.tsx        # Controle de mensalistas e contratos
│   │   └── public/
│   │       └── TicketValidatorPublic.tsx  # Consulta pública e validação de tickets
│   ├── services/
│   │   ├── escpos.ts                      # Construtor de comandos binários ESC/POS
│   │   ├── exportCsv.ts                   # Utilitário de exportação para Excel
│   │   ├── storage.ts                     # Banco de dados local persistente e mock
│   │   ├── supabase.ts                    # Cliente Supabase e verificação de conexão
│   │   └── tariffCalculator.ts            # Motor matemático de cálculo de tarifas
│   ├── tests/
│   │   ├── antiReplay.test.ts             # Testes de bloqueio de reutilização de QR
│   │   ├── permissions.test.ts            # Testes de permissões e auditoria
│   │   ├── tariffCalculator.test.ts       # Testes de regras de cobrança e tolerância
│   │   └── vehicleEntry.test.ts           # Testes de placas e cadastro de entrada
│   ├── types/
│   │   └── parking.ts                     # Interfaces TypeScript
│   ├── utils/
│   │   └── formatters.ts                  # Formatação de moedas, placas e datas
│   ├── App.tsx                            # Orquestração principal
│   ├── index.css                          # Estilos Tailwind e @media print térmico
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   │   └── 20260930_init_schema.sql       # Script PostgreSQL completo com RLS
│   └── schema.sql
├── vite.config.ts                         # Configuração Vite com PWA e Tailwind v4
└── package.json
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- Node.js versão 18+ (recomendado 20 ou 22)
- npm ou yarn

### 1. Clonar e Instalar Dependências
```bash
cd estacionamento-pwa
npm install
```

### 2. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
O aplicativo iniciará em `http://localhost:5173`.

### 3. Rodar os Testes Automatizados
```bash
npm test
```
Executa a suíte de testes com **Vitest**, validando cálculo de tarifas, tolerância, validação de placas, anti-replay e controle de permissões.

### 4. Gerar Build de Produção
```bash
npm run build
```
Gera a compilação final minificada na pasta `dist/` com todos os service workers e manifesto do PWA configurados.

---

## 🗄️ Integração com Supabase (PostgreSQL)

O sistema conta com arquitetura **Dual-Engine / Offline-First**:
- Funciona imediatamente em **Modo Demonstração Local** (persistido em `localStorage`) sem necessidade de configurar nenhuma credencial prévia.
- Para conectar ao seu banco **Supabase**:
  1. Crie um projeto no [Supabase](https://supabase.com).
  2. Acesse o **SQL Editor** no painel do Supabase.
  3. Copie e execute o conteúdo do arquivo `supabase/migrations/20260930_init_schema.sql`.
  4. No aplicativo, clique no botão **Modo Demo / Supabase** na barra superior e informe a URL e a Anon Key do seu projeto, ou adicione no arquivo `.env`:
     ```env
     VITE_SUPABASE_URL=https://seu-projeto.supabase.co
     VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
     ```

---

## 🖨️ Instruções de Impressão Térmica (58mm e 80mm)

O sistema suporta múltiplas formas de conexão com impressoras térmicas:

1. **Impressão via Navegador (`window.print()`):**
   - Funciona em qualquer impressora instalada no Windows/Mac/Linux (USB ou rede).
   - O CSS `@media print` oculta menus, barras e botões, enviando para a impressora estritamente a etiqueta formatada no tamanho correto (58mm ou 80mm).

2. **Impressão ESC/POS via Web Bluetooth:**
   - Conecta diretamente do navegador em impressoras térmicas portáteis Bluetooth (ex: POS-58, GOOJPRT, MPT-II, Epson) sem precisar instalar drivers.
   - Envia comandos binários ESC/POS com corte automático e inicialização limpa.

3. **Impressão em Dispositivos Android (App RawBT):**
   - Ao clicar no botão **App RawBT**, o sistema gera o payload ESC/POS em base64 e dispara a intenção nativa para o app RawBT instalado no celular.

---

## 🔒 Segurança e Regras de Negócio

- **Validação Anti-Replay de QR Code:** Cada etiqueta recebe um código único criptográfico (`EST-XXXXXX`). Assim que a saída é confirmada e o pagamento registrado, o status da etiqueta é alterado para `utilizado`. Qualquer tentativa posterior de validar o mesmo ticket é recusada imediatamente com alerta de segurança.
- **Adequação à LGPD:** O sistema armazena minimamente os dados de clientes para faturamento e segurança do pátio, disponibiliza política de privacidade e possui função de direito ao esquecimento com auditoria.
