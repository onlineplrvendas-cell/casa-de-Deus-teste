import { ConexaoColor, ConexaoRole } from '../types';

export interface ConexaoColorConfig {
  id: ConexaoColor;
  name: string;
  displayName: string;
  hex: string;
  gradientBg: string;
  borderClass: string;
  textClass: string;
  badgeBg: string;
  dotBg: string;
  glowClass: string;
  motto: string;
  accentBar: string;
}

export const CONEXAO_COLORS: ConexaoColor[] = [
  'verde',
  'vermelho',
  'laranja',
  'azul',
  'amarelo',
  'turquesa',
];

export const CONEXAO_COLOR_CONFIGS: Record<ConexaoColor, ConexaoColorConfig> = {
  verde: {
    id: 'verde',
    name: 'Verde',
    displayName: 'Equipe Verde',
    hex: '#10B981',
    gradientBg: 'from-emerald-950/40 via-[#06241a]/60 to-[#021811]/90',
    borderClass: 'border-emerald-500/40 hover:border-emerald-400/70',
    textClass: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotBg: 'bg-emerald-500',
    glowClass: 'shadow-[0_0_30px_rgba(16,185,129,0.22)]',
    motto: 'Força & Esperança',
    accentBar: 'bg-emerald-500',
  },
  vermelho: {
    id: 'vermelho',
    name: 'Vermelho',
    displayName: 'Equipe Vermelha',
    hex: '#EF4444',
    gradientBg: 'from-rose-950/40 via-[#2e0909]/60 to-[#1a0505]/90',
    borderClass: 'border-rose-500/40 hover:border-rose-400/70',
    textClass: 'text-rose-400',
    badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotBg: 'bg-rose-500',
    glowClass: 'shadow-[0_0_30px_rgba(239,68,68,0.22)]',
    motto: 'Paixão & Fogo',
    accentBar: 'bg-rose-500',
  },
  laranja: {
    id: 'laranja',
    name: 'Laranja',
    displayName: 'Equipe Laranja',
    hex: '#F97316',
    gradientBg: 'from-orange-950/40 via-[#2e1307]/60 to-[#1a0b04]/90',
    borderClass: 'border-orange-500/40 hover:border-orange-400/70',
    textClass: 'text-orange-400',
    badgeBg: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    dotBg: 'bg-orange-500',
    glowClass: 'shadow-[0_0_30px_rgba(249,115,22,0.22)]',
    motto: 'Ousadia & Energia',
    accentBar: 'bg-orange-500',
  },
  azul: {
    id: 'azul',
    name: 'Azul',
    displayName: 'Equipe Azul',
    hex: '#3B82F6',
    gradientBg: 'from-blue-950/40 via-[#0b1b36]/60 to-[#061021]/90',
    borderClass: 'border-blue-500/40 hover:border-blue-400/70',
    textClass: 'text-blue-400',
    badgeBg: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dotBg: 'bg-blue-500',
    glowClass: 'shadow-[0_0_30px_rgba(59,130,246,0.22)]',
    motto: 'Firmeza & Fé',
    accentBar: 'bg-blue-500',
  },
  amarelo: {
    id: 'amarelo',
    name: 'Amarelo',
    displayName: 'Equipe Amarela',
    hex: '#EAB308',
    gradientBg: 'from-amber-950/40 via-[#2d1f05]/60 to-[#1a1203]/90',
    borderClass: 'border-amber-500/40 hover:border-amber-400/70',
    textClass: 'text-amber-400',
    badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotBg: 'bg-amber-400',
    glowClass: 'shadow-[0_0_30px_rgba(234,179,8,0.22)]',
    motto: 'Luz & Alegria',
    accentBar: 'bg-amber-400',
  },
  turquesa: {
    id: 'turquesa',
    name: 'Turquesa',
    displayName: 'Equipe Turquesa',
    hex: '#06B6D4',
    gradientBg: 'from-cyan-950/40 via-[#07252f]/60 to-[#03151b]/90',
    borderClass: 'border-cyan-500/40 hover:border-cyan-400/70',
    textClass: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    dotBg: 'bg-cyan-400',
    glowClass: 'shadow-[0_0_30px_rgba(6,182,212,0.22)]',
    motto: 'Avivamento & Graça',
    accentBar: 'bg-cyan-400',
  },
};

export const CONEXAO_ROLE_META: Record<
  ConexaoRole,
  { label: string; shortLabel: string; badgeClass: string; description: string }
> = {
  lider: {
    label: 'Líder da Cor',
    shortLabel: 'Líder',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    description: 'Líder geral responsável por toda a equipe da cor',
  },
  sublider_base: {
    label: 'Sub-líder (Base)',
    shortLabel: 'Base / Sub-líder',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    description: 'Responsável pela Base jovem e acolhimento direto de liderados',
  },
  membro: {
    label: 'Membro da Equipe',
    shortLabel: 'Membro',
    badgeClass: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    description: 'Jovem ativo integrado na equipe',
  },
  convidado: {
    label: 'Convidado / Visitante',
    shortLabel: 'Convidado',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: 'Novo convidado trazido para os cultos e encontros do Conexão',
  },
};

export function getConexaoColorConfig(color: ConexaoColor): ConexaoColorConfig {
  return CONEXAO_COLOR_CONFIGS[color] || CONEXAO_COLOR_CONFIGS.verde;
}

export function getConexaoRoleMeta(role: ConexaoRole) {
  return CONEXAO_ROLE_META[role] || CONEXAO_ROLE_META.membro;
}
