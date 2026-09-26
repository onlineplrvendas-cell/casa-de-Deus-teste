/**
 * Utilities for dates and timezones (America/Sao_Paulo, DD/MM/AAAA)
 */

export const SAO_PAULO_TZ = 'America/Sao_Paulo';

const MONTH_NAMES_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

/**
 * Returns current date object localized to Sao Paulo
 */
export function getNowInSaoPaulo(): Date {
  // Use Intl to compute the current wall-clock date in Sao Paulo
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: SAO_PAULO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  const map: Record<string, string> = {};
  parts.forEach(p => { map[p.type] = p.value; });

  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10) - 1;
  const day = parseInt(map.day, 10);
  const hour = parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);
  const second = parseInt(map.second, 10);

  return new Date(year, month, day, hour, minute, second);
}

/**
 * Returns today in YYYY-MM-DD format (Sao Paulo timezone)
 */
export function getTodayString(): string {
  const spDate = getNowInSaoPaulo();
  const year = spDate.getFullYear();
  const month = String(spDate.getMonth() + 1).padStart(2, '0');
  const day = String(spDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats an ISO string or YYYY-MM-DD to DD/MM/AAAA
 */
export function formatDateBR(dateInput?: string | null): string {
  if (!dateInput) return '-';
  try {
    // If it's YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split('-');
      return `${day}/${month}/${year}`;
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: SAO_PAULO_TZ,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return '-';
  }
}

/**
 * Formats an ISO string to DD/MM/AAAA às HH:mm
 */
export function formatDateTimeBR(dateInput?: string | null): string {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '-';
    const datePart = new Intl.DateTimeFormat('pt-BR', {
      timeZone: SAO_PAULO_TZ,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);

    const timePart = new Intl.DateTimeFormat('pt-BR', {
      timeZone: SAO_PAULO_TZ,
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);

    return `${datePart} às ${timePart}`;
  } catch {
    return '-';
  }
}

/**
 * Checks if a given date string or ISO belongs to current year and month in SP
 */
export function isCurrentMonthInSP(dateInput?: string | null): boolean {
  if (!dateInput) return false;
  try {
    let year: number;
    let month: number;

    if (/^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
      const parts = dateInput.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
    } else {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return false;
      const sp = getNowInSaoPaulo();
      return d.getFullYear() === sp.getFullYear() && d.getMonth() === sp.getMonth();
    }

    const todaySP = getNowInSaoPaulo();
    return year === todaySP.getFullYear() && month === todaySP.getMonth();
  } catch {
    return false;
  }
}

/**
 * Evaluates task due state: 'overdue' | 'today' | 'upcoming'
 */
export function getTaskDueState(dueDate: string): 'overdue' | 'today' | 'upcoming' {
  const today = getTodayString();
  const dateOnly = dueDate.slice(0, 10);
  if (dateOnly < today) return 'overdue';
  if (dateOnly === today) return 'today';
  return 'upcoming';
}

/**
 * Returns the last 6 months (including current month) formatted for charts
 */
export function getLast6Months(): { key: string; label: string; year: number; month: number }[] {
  const spDate = getNowInSaoPaulo();
  const result: { key: string; label: string; year: number; month: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(spDate.getFullYear(), spDate.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const label = `${MONTH_NAMES_PT[month]}/${String(year).slice(2)}`;
    result.push({ key, label, year, month });
  }

  return result;
}
