import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { useAuth } from '../context/AuthContext';
import {
  ConexaoColor,
  ConexaoParticipant,
  ConexaoRole,
  CongregationFilter,
} from '../types';
import {
  CONEXAO_COLORS,
  CONEXAO_COLOR_CONFIGS,
  CONEXAO_ROLE_META,
  getConexaoColorConfig,
} from '../utils/conexaoConfig';
import { ConexaoColorBadge } from '../components/ConexaoColorBadge';
import { ConexaoParticipantModal } from '../components/ConexaoParticipantModal';
import { ConexaoColorReportModal } from '../components/ConexaoColorReportModal';
import { formatDateBR } from '../utils/date';
import { getWhatsAppUrl } from '../utils/phone';
import {
  Sparkles,
  Users,
  Shield,
  Crown,
  Search,
  Filter,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  Phone,
  MessageSquare,
  Award,
  ChevronRight,
  TrendingUp,
  Flame,
  Zap,
  ArrowRight,
  Trash2,
  Edit,
  ExternalLink,
} from 'lucide-react';

interface ConexaoJovemPageProps {
  onOpenContactDetails?: (contact: any) => void;
}

type ConexaoViewMode = ConexaoColor | 'geral';
type ColorSubTab = 'convidados' | 'bases' | 'membros' | 'relatorio';

export const ConexaoJovemPage: React.FC<ConexaoJovemPageProps> = () => {
  const {
    conexaoParticipants,
    selectedCongregation,
    toggleConexaoCultoConfirmation,
    deleteConexaoParticipant,
  } = useCRM();
  const { currentUser } = useAuth();

  // Active view: either a specific color team (e.g. 'verde') or 'geral' (Coordenação Geral)
  const [activeColorView, setActiveColorView] = useState<ConexaoViewMode>('verde');

  // Sub-tab inside a color workspace: 'convidados' | 'bases' | 'membros' | 'relatorio'
  const [activeSubTab, setActiveSubTab] = useState<ColorSubTab>('convidados');

  // Filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | ConexaoRole>('all');
  const [statusPresenceFilter, setStatusPresenceFilter] = useState<'all' | 'confirmado' | 'pendente'>('all');

  // Modals state
  const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false);
  const [participantToEdit, setParticipantToEdit] = useState<ConexaoParticipant | null>(null);
  const [modalDefaultColor, setModalDefaultColor] = useState<ConexaoColor>('verde');
  const [modalDefaultRole, setModalDefaultRole] = useState<ConexaoRole>('convidado');

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTargetColor, setReportTargetColor] = useState<ConexaoColor>('verde');

  // Feedback notifications
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Group participants by color
  const colorStats = useMemo(() => {
    const stats: Record<
      ConexaoColor,
      {
        total: number;
        leader?: ConexaoParticipant;
        bases: ConexaoParticipant[];
        members: ConexaoParticipant[];
        guests: ConexaoParticipant[];
        confirmedGuests: number;
        points: number;
      }
    > = {
      verde: { total: 0, bases: [], members: [], guests: [], confirmedGuests: 0, points: 0 },
      vermelho: { total: 0, bases: [], members: [], guests: [], confirmedGuests: 0, points: 0 },
      laranja: { total: 0, bases: [], members: [], guests: [], confirmedGuests: 0, points: 0 },
      azul: { total: 0, bases: [], members: [], guests: [], confirmedGuests: 0, points: 0 },
      amarelo: { total: 0, bases: [], members: [], guests: [], confirmedGuests: 0, points: 0 },
      turquesa: { total: 0, bases: [], members: [], guests: [], confirmedGuests: 0, points: 0 },
    };

    conexaoParticipants.forEach(p => {
      const c = stats[p.color];
      if (!c) return;
      c.total += 1;
      c.points += p.points || 0;

      if (p.role === 'lider') {
        c.leader = p;
      } else if (p.role === 'sublider_base') {
        c.bases.push(p);
      } else if (p.role === 'membro') {
        c.members.push(p);
      } else if (p.role === 'convidado') {
        c.guests.push(p);
        if (p.confirmedNextCulto) {
          c.confirmedGuests += 1;
        }
      }
    });

    return stats;
  }, [conexaoParticipants]);

  // Overall totals
  const overallTotals = useMemo(() => {
    const totalParticipants = conexaoParticipants.length;
    const totalBases = conexaoParticipants.filter(p => p.role === 'sublider_base').length;
    const totalMembers = conexaoParticipants.filter(p => p.role === 'membro').length;
    const totalGuests = conexaoParticipants.filter(p => p.role === 'convidado').length;
    const confirmedGuests = conexaoParticipants.filter(p => p.role === 'convidado' && p.confirmedNextCulto).length;

    return {
      totalParticipants,
      totalBases,
      totalMembers,
      totalGuests,
      confirmedGuests,
    };
  }, [conexaoParticipants]);

  // Current active color config (if not in 'geral')
  const currentColorConfig = useMemo(() => {
    if (activeColorView === 'geral') return null;
    return getConexaoColorConfig(activeColorView);
  }, [activeColorView]);

  // Filtered list based on active color and local search/subtab
  const displayedParticipants = useMemo(() => {
    let list = conexaoParticipants;

    // Filter by color if not 'geral'
    if (activeColorView !== 'geral') {
      list = list.filter(p => p.color === activeColorView);

      // Filter by subtab inside color view
      if (activeSubTab === 'convidados') {
        list = list.filter(p => p.role === 'convidado');
      } else if (activeSubTab === 'bases') {
        list = list.filter(p => p.role === 'sublider_base');
      } else if (activeSubTab === 'membros') {
        list = list.filter(p => p.role === 'membro');
      }
    } else {
      // In 'geral', if user selected role filter
      if (roleFilter !== 'all') {
        list = list.filter(p => p.role === roleFilter);
      }
    }

    // Filter by confirmation status
    if (statusPresenceFilter !== 'all') {
      if (statusPresenceFilter === 'confirmado') {
        list = list.filter(p => p.confirmedNextCulto);
      } else {
        list = list.filter(p => !p.confirmedNextCulto);
      }
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesPhone = p.phone.includes(q);
        const matchesBase = p.baseName?.toLowerCase().includes(q) || false;
        const matchesInvited = p.invitedByName?.toLowerCase().includes(q) || false;
        return matchesName || matchesPhone || matchesBase || matchesInvited;
      });
    }

    return list;
  }, [
    conexaoParticipants,
    activeColorView,
    activeSubTab,
    roleFilter,
    statusPresenceFilter,
    searchQuery,
  ]);

  const handleOpenAddParticipant = (
    color: ConexaoColor = activeColorView !== 'geral' ? activeColorView : 'verde',
    role: ConexaoRole = 'convidado'
  ) => {
    setParticipantToEdit(null);
    setModalDefaultColor(color);
    setModalDefaultRole(role);
    setIsParticipantModalOpen(true);
  };

  const handleEditParticipant = (participant: ConexaoParticipant) => {
    setParticipantToEdit(participant);
    setModalDefaultColor(participant.color);
    setModalDefaultRole(participant.role);
    setIsParticipantModalOpen(true);
  };

  const handleToggleConfirmation = async (id: string, name: string) => {
    try {
      const updated = await toggleConexaoCultoConfirmation(id);
      setFeedbackNotice(
        updated.confirmedNextCulto
          ? `Presença de ${name} confirmada para o próximo culto!`
          : `Presença de ${name} alterada para pendente.`
      );
      setTimeout(() => setFeedbackNotice(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover ${name} do Conexão Jovem?`)) {
      await deleteConexaoParticipant(id);
    }
  };

  const handleOpenReport = (color: ConexaoColor) => {
    setReportTargetColor(color);
    setIsReportModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Feedback Alert */}
      {feedbackNotice && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-emerald-400 hover:text-white"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Main Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-[#0F0F0F] via-[#141414] to-[#0A0A0A] p-6 rounded-2xl border border-[#222222] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-gradient-to-br from-amber-500 to-rose-500 rounded-lg text-black shadow-md">
              <Flame className="w-4 h-4 stroke-[2.5]" />
            </span>
            <span className="text-[11px] uppercase tracking-widest font-extrabold text-amber-400">
              MINISTÉRIO DE JOVENS • CASA DE DEUS
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
            CONEXÃO JOVEM
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold hidden sm:inline-block">
              6 Cores / Tribos
            </span>
          </h1>
          <p className="text-xs md:text-sm text-zinc-400 max-w-2xl">
            Gestão estratégica das equipes por cores: cada líder possui o relatório exclusivo da sua cor.
            Foco permanente em <strong className="text-white">Bases (Sub-líderes)</strong> e <strong className="text-amber-300">Convidados</strong> para os cultos!
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {activeColorView !== 'geral' && (
            <button
              onClick={() => handleOpenReport(activeColorView)}
              className="px-4 py-2.5 bg-[#181818] hover:bg-[#222222] text-white border border-[#333333] rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
            >
              <Printer className="w-4 h-4 text-zinc-400" />
              <span>Relatório da Cor</span>
            </button>
          )}

          <button
            onClick={() =>
              handleOpenAddParticipant(
                activeColorView !== 'geral' ? activeColorView : 'verde',
                'convidado'
              )
            }
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Novo Convidado</span>
          </button>

          <button
            onClick={() =>
              handleOpenAddParticipant(
                activeColorView !== 'geral' ? activeColorView : 'verde',
                'sublider_base'
              )
            }
            className="px-4 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg"
          >
            <Shield className="w-4 h-4" />
            <span>+ Nova Base</span>
          </button>
        </div>
      </div>

      {/* Top Overall Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-[#0A0A0A] border border-[#222222] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
              Total Conexão
            </span>
            <p className="text-2xl font-black text-white">{overallTotals.totalParticipants}</p>
            <span className="text-[11px] text-zinc-400">Jovens cadastrados</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-[#0A0A0A] border border-[#222222] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
              Bases (Sub-líderes)
            </span>
            <p className="text-2xl font-black text-indigo-300">{overallTotals.totalBases}</p>
            <span className="text-[11px] text-zinc-400">Líderes de células</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-[#0A0A0A] border border-[#222222] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
              Convidados (Visitantes)
            </span>
            <p className="text-2xl font-black text-amber-300">{overallTotals.totalGuests}</p>
            <span className="text-[11px] text-zinc-400">Novos jovens acolhidos</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-[#0A0A0A] border border-[#222222] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              Presenças Confirmadas
            </span>
            <p className="text-2xl font-black text-emerald-300">{overallTotals.confirmedGuests}</p>
            <span className="text-[11px] text-zinc-400">No próximo Culto Jovem</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* SELETOR DE CORES & ÁREA SEPARADA POR COR */}
      {/* "essa area precisa estar separado dentro do conexão jovem e cada lider so ter o relatorio das suas cores" */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Equipes por Cores & Áreas Exclusivas dos Líderes
            </h2>
            <p className="text-xs text-zinc-400">
              Selecione a sua cor para acessar a área exclusiva e o relatório oficial da sua equipe:
            </p>
          </div>
        </div>

        {/* The 6 Color Selector Cards + Global View Button */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {CONEXAO_COLORS.map(cId => {
            const cfg = CONEXAO_COLOR_CONFIGS[cId];
            const stats = colorStats[cId];
            const isSelected = activeColorView === cId;
            return (
              <button
                key={cId}
                onClick={() => {
                  setActiveColorView(cId);
                  setActiveSubTab('convidados');
                }}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? `bg-[#131313] border-2 ${cfg.glowClass}`
                    : 'bg-[#0A0A0A] border-[#222222] hover:border-[#383838]'
                }`}
                style={{
                  borderColor: isSelected ? cfg.hex : undefined,
                }}
              >
                {/* Accent top stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: cfg.hex }}
                />

                <div className="flex items-start justify-between mb-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shadow-sm"
                    style={{ backgroundColor: cfg.hex }}
                  />
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${cfg.hex}25`,
                      color: cfg.hex,
                    }}
                  >
                    {stats.points} pts
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-white leading-tight capitalize">
                    {cfg.displayName}
                  </h3>
                  <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                    {stats.leader ? stats.leader.name : 'Líder a definir'}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] text-zinc-400">
                  <span>{stats.bases.length} bases</span>
                  <span className="font-semibold text-amber-300">
                    {stats.guests.length} conv.
                  </span>
                </div>
              </button>
            );
          })}

          {/* Coordenação Geral Tab */}
          <button
            onClick={() => setActiveColorView('geral')}
            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
              activeColorView === 'geral'
                ? 'bg-[#181818] border-2 border-white shadow-lg'
                : 'bg-[#0A0A0A] border-[#222222] hover:border-[#383838]'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400" />
              <span className="text-[10px] font-bold text-white bg-zinc-800 px-1.5 py-0.5 rounded">
                Geral
              </span>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white leading-tight">
                Coordenação Geral
              </h3>
              <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                Placar & Visão Total
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-[#1C1C1C] flex items-center justify-between text-[10px] text-zinc-400">
              <span>Pastores / Adm</span>
              <span className="text-white font-bold">{overallTotals.totalParticipants}</span>
            </div>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ISOLATED COLOR WORKSPACE (WHEN A COLOR IS SELECTED)       */}
      {/* ======================================================== */}
      {activeColorView !== 'geral' && currentColorConfig && (
        <div className="space-y-5">
          {/* Active Color Team Hero Card */}
          <div
            className={`p-5 md:p-6 rounded-2xl border bg-gradient-to-br ${currentColorConfig.gradientBg} ${currentColorConfig.borderClass} ${currentColorConfig.glowClass} text-white transition-all`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: currentColorConfig.hex }}
                  />
                  <span className="text-xs uppercase font-extrabold tracking-widest text-zinc-300">
                    ÁREA EXCLUSIVA DO LÍDER • {currentColorConfig.displayName.toUpperCase()}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white">
                  {currentColorConfig.displayName}
                </h2>
                <p className="text-xs md:text-sm text-zinc-300">
                  Lema Oficial: <span className="font-semibold text-white">"{currentColorConfig.motto}"</span>
                </p>
              </div>

              {/* Leader Info & WhatsApp button */}
              <div className="p-3.5 bg-black/50 border border-white/10 rounded-xl flex items-center justify-between gap-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-black shadow-md"
                    style={{ backgroundColor: currentColorConfig.hex }}
                  >
                    <Crown className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                      Líder Geral da Cor
                    </span>
                    <p className="text-sm font-bold text-white">
                      {colorStats[activeColorView].leader
                        ? colorStats[activeColorView].leader?.name
                        : 'Líder a definir'}
                    </p>
                    {colorStats[activeColorView].leader && (
                      <span className="text-xs text-zinc-400">
                        {colorStats[activeColorView].leader?.phone}
                      </span>
                    )}
                  </div>
                </div>

                {colorStats[activeColorView].leader?.phone && (
                  <a
                    href={getWhatsAppUrl(
                      colorStats[activeColorView].leader!.phone,
                      `Olá ${colorStats[activeColorView].leader!.name}, alinhamento ministerial do Conexão Jovem - ${currentColorConfig.displayName}!`
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Chamar Líder no WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            {/* Quick Metrics of this isolated color */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10">
              <div className="p-2.5 bg-black/40 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                  Bases (Sub-líderes)
                </span>
                <p className="text-xl font-black text-white">
                  {colorStats[activeColorView].bases.length}
                </p>
                <span className="text-[10px] text-zinc-400">Células da Cor</span>
              </div>

              <div className="p-2.5 bg-black/40 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                  Membros da Cor
                </span>
                <p className="text-xl font-black text-white">
                  {colorStats[activeColorView].members.length}
                </p>
                <span className="text-[10px] text-zinc-400">Integrados</span>
              </div>

              <div className="p-2.5 bg-black/40 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">
                  Convidados
                </span>
                <p className="text-xl font-black text-amber-300">
                  {colorStats[activeColorView].guests.length}
                </p>
                <span className="text-[10px] text-zinc-400">
                  {colorStats[activeColorView].confirmedGuests} confirmados no culto
                </span>
              </div>

              <div className="p-2.5 bg-black/40 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-yellow-400 block">
                  Pontos da Cor
                </span>
                <p className="text-xl font-black text-yellow-300">
                  {colorStats[activeColorView].points} pts
                </p>
                <span className="text-[10px] text-zinc-400">Gincana do Conexão</span>
              </div>
            </div>
          </div>

          {/* Sub-tabs inside Color Workspace */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222222] pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveSubTab('convidados')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeSubTab === 'convidados'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-[#111111] text-zinc-400 hover:text-white hover:bg-[#1A1A1A]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Convidados da Cor</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeSubTab === 'convidados' ? 'bg-black text-amber-400' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {colorStats[activeColorView].guests.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSubTab('bases')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeSubTab === 'bases'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-[#111111] text-zinc-400 hover:text-white hover:bg-[#1A1A1A]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Bases (Sub-líderes)</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeSubTab === 'bases' ? 'bg-black text-indigo-300' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {colorStats[activeColorView].bases.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSubTab('membros')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeSubTab === 'membros'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-[#111111] text-zinc-400 hover:text-white hover:bg-[#1A1A1A]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Membros da Equipe</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeSubTab === 'membros' ? 'bg-black text-emerald-300' : 'bg-zinc-800 text-zinc-300'
                  }`}
                >
                  {colorStats[activeColorView].members.length}
                </span>
              </button>

              <button
                onClick={() => setActiveSubTab('relatorio')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  activeSubTab === 'relatorio'
                    ? 'bg-white text-black shadow-md'
                    : 'bg-[#111111] text-zinc-400 hover:text-white hover:bg-[#1A1A1A]'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Relatório Oficial da Cor</span>
              </button>
            </div>

            {/* Sub-tab quick actions */}
            <div className="flex items-center gap-2">
              {activeSubTab === 'convidados' && (
                <button
                  onClick={() => handleOpenAddParticipant(activeColorView, 'convidado')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Convidado</span>
                </button>
              )}
              {activeSubTab === 'bases' && (
                <button
                  onClick={() => handleOpenAddParticipant(activeColorView, 'sublider_base')}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Nova Base</span>
                </button>
              )}
              {activeSubTab === 'membros' && (
                <button
                  onClick={() => handleOpenAddParticipant(activeColorView, 'membro')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Membro</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Filter Bar */}
          {activeSubTab !== 'relatorio' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0A0A0A] p-3 rounded-xl border border-[#222222]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder={`Buscar em ${currentColorConfig.displayName}...`}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121212] border border-[#262626] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-400 transition-colors"
                />
              </div>

              {activeSubTab === 'convidados' && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 font-medium">Presença:</span>
                  <select
                    value={statusPresenceFilter}
                    onChange={e => setStatusPresenceFilter(e.target.value as any)}
                    className="bg-[#121212] border border-[#262626] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-400"
                  >
                    <option value="all">Todas as presenças</option>
                    <option value="confirmado">Confirmados no Culto</option>
                    <option value="pendente">Aguardando confirmação</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* =================================================== */}
          {/* SUBTAB 1: CONVIDADOS DA COR (Foco Principal)        */}
          {/* =================================================== */}
          {activeSubTab === 'convidados' && (
            <div className="space-y-4">
              {displayedParticipants.length === 0 ? (
                <div className="p-8 text-center bg-[#0A0A0A] border border-[#222222] rounded-2xl space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Nenhum convidado encontrado</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    O foco do Conexão Jovem é trazer novos jovens aos cultos e eventos.
                    Cadastre o primeiro convidado da {currentColorConfig.displayName}!
                  </p>
                  <button
                    onClick={() => handleOpenAddParticipant(activeColorView, 'convidado')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl inline-flex items-center gap-2 transition-colors shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Convidado</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-[#222222] bg-[#0A0A0A]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#121212] text-zinc-400 font-semibold border-b border-[#222222]">
                      <tr>
                        <th className="p-3.5">Convidado</th>
                        <th className="p-3.5">WhatsApp / Celular</th>
                        <th className="p-3.5">Quem Convidou (Foco)</th>
                        <th className="p-3.5">Base Vinculada</th>
                        <th className="p-3.5">1ª Visita</th>
                        <th className="p-3.5 text-center">Presença no Culto</th>
                        <th className="p-3.5 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C1C1C]">
                      {displayedParticipants.map(g => (
                        <tr key={g.id} className="hover:bg-[#121212]/60 transition-colors">
                          <td className="p-3.5">
                            <p className="font-bold text-white text-sm">{g.name}</p>
                            {g.notes && (
                              <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                                {g.notes}
                              </p>
                            )}
                          </td>

                          <td className="p-3.5">
                            <span className="text-zinc-300 font-mono text-[11px]">{g.phone}</span>
                            <span className="text-[10px] text-zinc-500 block">{g.congregation}</span>
                          </td>

                          <td className="p-3.5">
                            {g.invitedByName ? (
                              <span className="font-semibold text-white bg-zinc-900 border border-zinc-700/60 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                {g.invitedByName}
                              </span>
                            ) : (
                              <span className="text-zinc-600 text-[11px]">Não registrado</span>
                            )}
                          </td>

                          <td className="p-3.5">
                            {g.baseName ? (
                              <span className="font-medium text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1">
                                <Shield className="w-3 h-3 text-indigo-400" />
                                {g.baseName}
                              </span>
                            ) : (
                              <span className="text-zinc-600 text-[11px]">Geral</span>
                            )}
                          </td>

                          <td className="p-3.5 text-zinc-400 text-[11px]">
                            {g.firstVisitDate ? formatDateBR(g.firstVisitDate) : '-'}
                          </td>

                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => handleToggleConfirmation(g.id, g.name)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                                g.confirmedNextCulto
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white hover:bg-zinc-700'
                              }`}
                              title="Clique para alternar status de presença"
                            >
                              {g.confirmedNextCulto ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Confirmado</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                                  <span>Pendente</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* WhatsApp Contact Button */}
                              <a
                                href={getWhatsAppUrl(
                                  g.phone,
                                  `Olá ${g.name}, tudo bem? Aqui é da liderança do Conexão Jovem da Casa de Deus (${currentColorConfig.displayName})! Esperamos você no culto deste sábado!`
                                )}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 rounded-lg transition-colors border border-emerald-500/30"
                                title="Enviar mensagem no WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>

                              <button
                                onClick={() => handleEditParticipant(g)}
                                className="p-1.5 bg-[#181818] hover:bg-[#252525] text-zinc-300 hover:text-white rounded-lg transition-colors border border-[#2B2B2B]"
                                title="Editar convidado"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDelete(g.id, g.name)}
                                className="p-1.5 bg-[#181818] hover:bg-red-950/60 text-zinc-500 hover:text-red-400 rounded-lg transition-colors border border-[#2B2B2B]"
                                title="Remover"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =================================================== */}
          {/* SUBTAB 2: BASES DA EQUIPE (SUB-LÍDERES)            */}
          {/* =================================================== */}
          {activeSubTab === 'bases' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    Bases & Células da {currentColorConfig.displayName}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Os sub-líderes são responsáveis pelas bases que acolhem e pastoreiam os jovens.
                  </p>
                </div>
              </div>

              {displayedParticipants.length === 0 ? (
                <div className="p-8 text-center bg-[#0A0A0A] border border-[#222222] rounded-2xl space-y-3">
                  <Shield className="w-10 h-10 text-indigo-400 mx-auto" />
                  <h3 className="text-sm font-bold text-white">Nenhuma base cadastrada</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Cadastre os sub-líderes responsáveis pelas bases da {currentColorConfig.displayName}.
                  </p>
                  <button
                    onClick={() => handleOpenAddParticipant(activeColorView, 'sublider_base')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 transition-colors shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Cadastrar Sub-líder / Base</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayedParticipants.map(b => {
                    // Calculate members and guests linked to this base
                    const baseMembers = colorStats[activeColorView].members.filter(
                      m => m.baseLeaderId === b.id || (m.baseName && m.baseName === b.baseName)
                    );
                    const baseGuests = colorStats[activeColorView].guests.filter(
                      g => g.baseLeaderId === b.id || (g.baseName && g.baseName === b.baseName)
                    );
                    const confirmedCount = baseGuests.filter(g => g.confirmedNextCulto).length;

                    return (
                      <div
                        key={b.id}
                        className="p-5 bg-[#0C0C0C] border border-[#262626] rounded-2xl hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4 shadow-lg"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-sm shadow-md">
                              <Shield className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                                {b.baseName || 'Base sem nome'}
                              </span>
                              <h4 className="text-base font-bold text-white mt-1">{b.name}</h4>
                              <p className="text-xs text-zinc-400">
                                {b.phone} • {b.congregation}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleEditParticipant(b)}
                              className="p-1.5 bg-[#181818] hover:bg-[#252525] text-zinc-300 rounded-lg border border-[#2B2B2B]"
                              title="Editar base"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(b.id, b.name)}
                              className="p-1.5 bg-[#181818] hover:bg-red-950/60 text-zinc-500 hover:text-red-400 rounded-lg border border-[#2B2B2B]"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {b.notes && (
                          <p className="text-xs text-zinc-400 italic bg-[#121212] p-2.5 rounded-lg border border-[#1E1E1E]">
                            "{b.notes}"
                          </p>
                        )}

                        <div className="grid grid-cols-3 gap-2 p-3 bg-[#111111] rounded-xl border border-[#1F1F1F] text-center">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                              Membros
                            </span>
                            <span className="text-base font-black text-white">
                              {baseMembers.length}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-amber-500 block">
                              Convidados
                            </span>
                            <span className="text-base font-black text-amber-300">
                              {baseGuests.length}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                              Confirmados
                            </span>
                            <span className="text-base font-black text-emerald-300">
                              {confirmedCount}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between">
                          <span className="text-xs text-zinc-400">
                            Pontos da Base: <strong className="text-white">{b.points || 0} pts</strong>
                          </span>
                          <a
                            href={getWhatsAppUrl(
                              b.phone,
                              `Olá líder ${b.name}, alinhamento da ${b.baseName || 'sua Base'} (${currentColorConfig.displayName}) para o Culto Conexão Jovem!`
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>WhatsApp Sub-líder</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* =================================================== */}
          {/* SUBTAB 3: MEMBROS INTEGRADOS DA COR                */}
          {/* =================================================== */}
          {activeSubTab === 'membros' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Membros Ativos da {currentColorConfig.displayName}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Jovens batizados e integrados que participam ativamente da equipe e convidam amigos.
                  </p>
                </div>
              </div>

              {displayedParticipants.length === 0 ? (
                <div className="p-8 text-center bg-[#0A0A0A] border border-[#222222] rounded-2xl space-y-3">
                  <Users className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-bold text-white">Nenhum membro cadastrado</h3>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    Adicione os membros que compõem a equipe da {currentColorConfig.displayName}.
                  </p>
                  <button
                    onClick={() => handleOpenAddParticipant(activeColorView, 'membro')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 transition-colors shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Membro</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {displayedParticipants.map(m => (
                    <div
                      key={m.id}
                      className="p-4 bg-[#0C0C0C] border border-[#242424] rounded-xl hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3 shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{m.name}</h4>
                          <p className="text-xs text-zinc-400 font-mono mt-0.5">{m.phone}</p>
                          <p className="text-[11px] text-zinc-500 mt-1">
                            {m.congregation} • {m.baseName ? `Base: ${m.baseName}` : 'Sem base'}
                          </p>
                        </div>
                        <span className="text-[11px] font-semibold text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded">
                          {m.points || 0} pts
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between">
                        <a
                          href={getWhatsAppUrl(
                            m.phone,
                            `Fala ${m.name}, beleza? Contagem regressiva pro Culto Conexão Jovem (${currentColorConfig.displayName})!`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditParticipant(m)}
                            className="p-1 text-zinc-400 hover:text-white"
                            title="Editar"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id, m.name)}
                            className="p-1 text-zinc-600 hover:text-red-400"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =================================================== */}
          {/* SUBTAB 4: RELATÓRIO OFICIAL DA COR (EMBEDDED VIEW) */}
          {/* =================================================== */}
          {activeSubTab === 'relatorio' && (
            <div className="space-y-4 bg-[#0A0A0A] border border-[#262626] rounded-2xl p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: currentColorConfig.hex }}
                    />
                    <span className="text-xs uppercase font-extrabold text-zinc-400 tracking-wider">
                      CASA DE DEUS • CONEXÃO JOVEM
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">
                    Relatório da {currentColorConfig.displayName}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Relatório exclusivo e oficial para prestação de contas pastoral.
                  </p>
                </div>

                <button
                  onClick={() => handleOpenReport(activeColorView)}
                  className="px-4 py-2 bg-white text-black hover:bg-zinc-200 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Relatório Formatado / Salvar PDF</span>
                </button>
              </div>

              {/* Quick Summary Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-[#111111] rounded-xl border border-[#222222]">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Sub-líderes (Bases)</span>
                  <p className="text-xl font-bold text-white">{colorStats[activeColorView].bases.length}</p>
                </div>
                <div className="p-3 bg-[#111111] rounded-xl border border-[#222222]">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Membros Ativos</span>
                  <p className="text-xl font-bold text-white">{colorStats[activeColorView].members.length}</p>
                </div>
                <div className="p-3 bg-[#111111] rounded-xl border border-[#222222]">
                  <span className="text-[10px] text-amber-500 uppercase font-bold">Convidados Trazidos</span>
                  <p className="text-xl font-bold text-amber-300">{colorStats[activeColorView].guests.length}</p>
                </div>
                <div className="p-3 bg-[#111111] rounded-xl border border-[#222222]">
                  <span className="text-[10px] text-emerald-500 uppercase font-bold">Presenças Confirmadas</span>
                  <p className="text-xl font-bold text-emerald-300">{colorStats[activeColorView].confirmedGuests}</p>
                </div>
              </div>

              <div className="p-4 bg-[#111111] rounded-xl border border-[#222222] space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Lista de Convidados & Quem Convidou:
                </h4>
                {colorStats[activeColorView].guests.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Nenhum convidado cadastrado.</p>
                ) : (
                  <div className="space-y-1.5 divide-y divide-[#1C1C1C]">
                    {colorStats[activeColorView].guests.map(g => (
                      <div key={g.id} className="pt-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-white">{g.name}</span>
                          <span className="text-zinc-500 ml-2">({g.phone})</span>
                          <p className="text-[11px] text-zinc-400">
                            Convidado por: <strong className="text-amber-300">{g.invitedByName || 'Não informado'}</strong>
                            {g.baseName && ` • Base: ${g.baseName}`}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            g.confirmedNextCulto
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {g.confirmedNextCulto ? 'Presença Confirmada' : 'Aguardando Confirmação'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* COORDENAÇÃO GERAL (VISÃO TOTAL DE TODAS AS 6 CORES)     */}
      {/* ======================================================== */}
      {activeColorView === 'geral' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#0E0E0E] border border-[#262626] rounded-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222222] pb-5 mb-5">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                  PAINEL PASTORAL & COORDENAÇÃO GERAL
                </span>
                <h2 className="text-2xl font-black text-white mt-0.5">
                  Placar & Ranking Geral do Conexão Jovem
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Desempenho comparativo entre as 6 cores da Casa de Deus (Convidados, Bases, Presença e Pontos).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">
                  Total de Jovens no Conexão: <strong className="text-white text-sm">{overallTotals.totalParticipants}</strong>
                </span>
              </div>
            </div>

            {/* Ranking Cards for the 6 Colors */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CONEXAO_COLORS.map(cId => {
                const cfg = CONEXAO_COLOR_CONFIGS[cId];
                const stats = colorStats[cId];
                return (
                  <div
                    key={cId}
                    className="p-5 bg-[#080808] border border-[#222222] rounded-2xl hover:border-[#383838] transition-all flex flex-col justify-between space-y-4 shadow-lg relative overflow-hidden"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: cfg.hex }}
                    />

                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-full shadow-md"
                          style={{ backgroundColor: cfg.hex }}
                        />
                        <div>
                          <h3 className="text-base font-bold text-white capitalize">
                            {cfg.displayName}
                          </h3>
                          <p className="text-xs text-zinc-400">
                            Líder: <strong className="text-zinc-200">{stats.leader?.name || 'A definir'}</strong>
                          </p>
                        </div>
                      </div>

                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded shadow-sm"
                        style={{
                          backgroundColor: `${cfg.hex}25`,
                          color: cfg.hex,
                        }}
                      >
                        {stats.points} pts
                      </span>
                    </div>

                    {/* Stats metrics */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-[#111111] rounded-xl text-center border border-[#1A1A1A]">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                          Bases
                        </span>
                        <span className="text-base font-black text-indigo-400">
                          {stats.bases.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                          Membros
                        </span>
                        <span className="text-base font-black text-emerald-400">
                          {stats.members.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                          Convidados
                        </span>
                        <span className="text-base font-black text-amber-300">
                          {stats.guests.length}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>
                        Confirmados culto: <strong className="text-emerald-400">{stats.confirmedGuests}</strong>
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#1C1C1C] flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setActiveColorView(cId);
                          setActiveSubTab('convidados');
                        }}
                        className="flex-1 py-1.5 bg-[#141414] hover:bg-[#202020] text-white border border-[#2A2A2A] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <span>Acessar Equipe</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenReport(cId)}
                        className="p-1.5 bg-[#141414] hover:bg-[#202020] text-zinc-400 hover:text-white border border-[#2A2A2A] rounded-lg transition-colors"
                        title="Ver Relatório Oficial da Cor"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ConexaoParticipantModal
        isOpen={isParticipantModalOpen}
        onClose={() => {
          setIsParticipantModalOpen(false);
          setParticipantToEdit(null);
        }}
        participantToEdit={participantToEdit}
        defaultColor={modalDefaultColor}
        defaultRole={modalDefaultRole}
      />

      <ConexaoColorReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        color={reportTargetColor}
        participants={conexaoParticipants}
      />
    </div>
  );
};
