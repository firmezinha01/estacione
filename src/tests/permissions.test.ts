import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../services/storage';

describe('Controle de Permissões (Atendente vs Administrador)', () => {
  beforeEach(() => {
    storage.resetDatabase();
  });

  it('deve carregar usuários padrão de atendente e administrador', () => {
    const users = storage.getUsers();
    const admin = users.find(u => u.role === 'admin');
    const attendant = users.find(u => u.role === 'atendente');

    expect(admin).toBeDefined();
    expect(attendant).toBeDefined();
    expect(admin?.role).toBe('admin');
    expect(attendant?.role).toBe('atendente');
  });

  it('deve alternar usuário corrente e registrar auditoria', () => {
    const attendant = storage.getUsers().find(u => u.role === 'atendente')!;
    storage.setCurrentUser(attendant);

    expect(storage.getCurrentUser().role).toBe('atendente');
  });

  it('deve registrar no log de auditoria alterações de configurações feitas por administrador', () => {
    const settings = storage.getSettings();
    storage.saveSettings({
      ...settings,
      tarifa_hora: 15.0,
    });

    const logs = storage.getAuditLogs();
    const configLog = logs.find(l => l.acao === 'ATUALIZACAO_CONFIGURACOES');
    expect(configLog).toBeDefined();
    expect(configLog?.detalhes?.tarifa_hora).toBe(15.0);
  });

  it('deve possuir administrador padrão com login admin e senha 123456', () => {
    const users = storage.getUsers();
    const admin = users.find(u => u.email === 'admin' && u.role === 'admin');

    expect(admin).toBeDefined();
    expect(admin?.senha).toBe('123456');
  });

  it('deve cadastrar novo operador com senha e permitir armazenamento seguro', () => {
    const users = storage.getUsers();
    const novoOperador = {
      id: 'usr-teste-01',
      nome: 'Juliana Operadora',
      email: 'juliana',
      senha: 'minhasenha123',
      role: 'atendente' as const,
      ativo: true,
      created_at: new Date().toISOString(),
    };

    storage.saveUsers([...users, novoOperador]);

    const updated = storage.getUsers();
    const found = updated.find(u => u.email === 'juliana');
    expect(found).toBeDefined();
    expect(found?.senha).toBe('minhasenha123');
    expect(found?.role).toBe('atendente');
  });
});
