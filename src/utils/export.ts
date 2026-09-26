import { Contact, ContactsFilterState, CongregationFilter } from '../types';
import { formatDateBR } from './date';

/**
 * Sanitizes a cell to prevent CSV formula injection attacks in Excel/Google Sheets
 */
function sanitizeCSVCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value).trim();

  // If string begins with characters that trigger formula execution in spreadsheets
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape internal double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports contacts to CSV format in UTF-8 with BOM for Excel compatibility
 */
export function exportContactsToCSV(
  contacts: Contact[],
  activeCongregation: CongregationFilter,
  filterState: ContactsFilterState
): void {
  const lines: string[] = [];

  // Metadata comments in header
  lines.push(`# EXPORTAÇÃO CASA DE DEUS - CRM`);
  lines.push(`# Data de geração: ${new Date().toLocaleString('pt-BR')}`);
  lines.push(`# Congregação: ${activeCongregation === 'all' ? 'Todas / Visão Geral' : activeCongregation}`);
  lines.push(`# Categoria: ${filterState.category === 'all' ? 'Todas' : filterState.category}`);
  lines.push(`# Etapa: ${filterState.stage === 'all' ? 'Todas' : filterState.stage}`);
  lines.push(`# Responsável: ${filterState.assignedTo === 'all' ? 'Todos' : filterState.assignedTo}`);
  lines.push(`# Inclui arquivados: ${filterState.showArchived ? 'Sim' : 'Não'}`);
  lines.push(`# Total de registros: ${contacts.length}`);
  lines.push('');

  // CSV Column headers
  const headers = [
    'ID',
    'Nome Completo',
    'Telefone/WhatsApp',
    'Congregação',
    'Categoria',
    'Etapa do Acompanhamento',
    'Responsável',
    'E-mail',
    'Bairro',
    'Origem',
    'Primeira Visita',
    'Membro Desde',
    'Data de Cadastro',
    'Status'
  ];

  lines.push(headers.map(sanitizeCSVCell).join(';'));

  for (const c of contacts) {
    const row = [
      c.id,
      c.name,
      c.phone,
      c.congregation,
      c.category,
      c.stage,
      c.assignedToName || 'Não atribuído',
      c.email || '',
      c.neighborhood || '',
      c.source || 'Outro',
      formatDateBR(c.firstVisitDate),
      formatDateBR(c.memberSinceDate),
      formatDateBR(c.createdAt),
      c.isArchived ? 'Arquivado' : 'Ativo'
    ];
    lines.push(row.map(sanitizeCSVCell).join(';'));
  }

  // Prepend UTF-8 BOM so Excel opens with proper accents (ç, ã, é, etc.)
  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateSlug = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `casa-de-deus-contatos-${activeCongregation}-${dateSlug}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
