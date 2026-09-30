export function formatBRL(value: number): string {
  return (value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatDateTime(date: string | Date | undefined | null): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(date: string | Date | undefined | null): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatPlate(raw: string): string {
  if (!raw) return '';
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Old Brazilian format: ABC-1234
  if (/^[A-Z]{3}[0-9]{4}$/.test(clean)) {
    return `${clean.substring(0, 3)}-${clean.substring(3)}`;
  }
  // Mercosul format: ABC1D23 (or standard 7 chars)
  return clean;
}

export function isValidPlate(plate: string): boolean {
  const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // Standard 3 letters + 4 digits OR Mercosul: 3 letters + 1 digit + 1 letter + 2 digits
  const standardRegex = /^[A-Z]{3}[0-9]{4}$/;
  const mercosulRegex = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  return standardRegex.test(clean) || mercosulRegex.test(clean);
}

export function generateTicketCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EST-${randomPart}`;
}

export function formatDurationMinutes(minutes: number): string {
  const mins = Math.max(0, minutes || 0);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}min`;
}

export function formatCPF(cpf?: string): string {
  if (!cpf) return '';
  const num = cpf.replace(/\D/g, '');
  if (num.length !== 11) return cpf;
  return num.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatPhone(phone?: string): string {
  if (!phone) return '';
  const num = phone.replace(/\D/g, '');
  if (num.length === 11) {
    return num.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (num.length === 10) {
    return num.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}
