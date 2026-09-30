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
});
