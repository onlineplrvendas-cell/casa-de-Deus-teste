export type Congregation = 'Recreio' | 'Curicica' | 'Guaratiba';

export type CongregationFilter = 'all' | Congregation;

export type ContactCategory = 'Novo contato' | 'Visitante' | 'Membro';

export type ContactStage =
  | 'Aguardando primeiro contato'
  | '1º contato feito'
  | 'Em acompanhamento'
  | 'Integrado'
  | 'Acompanhamento pausado';

export type ContactSource =
  | 'Culto'
  | 'Indicação'
  | 'Instagram'
  | 'Site'
  | 'Evento'
  | 'Outro';

export type InteractionChannel = 'WhatsApp' | 'Ligação' | 'Presencial' | 'Outro';

export type TaskStatus = 'pending' | 'completed';

export type UserRole = 'admin' | 'equipe';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: UserRole;
  assignedCongregations: Congregation[];
  active: boolean;
  avatarUrl?: string;
  createdAt?: string;
}

export type MainTab = 'dashboard' | 'contacts' | 'unireino' | 'conexaojovem' | 'followup' | 'team' | 'security';

export type ContactViewTab = 'all' | 'membros' | 'convidados' | 'confirmados';

export type UniReinoSemester = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type UniReinoStatus = 'matriculado' | 'trancado' | 'concluido';

export interface UniReinoEnrollment {
  isEnrolled: boolean;
  semester: UniReinoSemester; // 1 to 8
  enrolledAt: string;
  status: UniReinoStatus;
  matricula?: string;
  turma?: string;
  notes?: string;
  completedAt?: string;
}

export type ConexaoColor =
  | 'verde'
  | 'vermelho'
  | 'laranja'
  | 'azul'
  | 'amarelo'
  | 'turquesa';

export type ConexaoRole =
  | 'lider'          // Líder Geral da Cor
  | 'sublider_base'  // Base da Equipe (Sub-líder responsável pela base de jovens)
  | 'membro'         // Membro ativo da Cor
  | 'convidado';     // Jovem Convidado / Visitante

export interface ConexaoParticipant {
  id: string;
  name: string;
  phone: string;
  color: ConexaoColor;
  role: ConexaoRole;
  congregation: Congregation;
  baseName?: string;         // Ex: "Base Conquistadores", "Base Leão de Judá", "Base Avivamento"
  baseLeaderId?: string;     // ID da base / sub-líder responsável
  baseLeaderName?: string;   // Nome da base / sub-líder responsável
  invitedById?: string;      // ID de quem convidou
  invitedByName?: string;    // Nome de quem convidou (membro ou sub-líder)
  confirmedNextCulto?: boolean; // Presença confirmada no próximo Culto do Conexão Jovem
  firstVisitDate?: string;   // Data do primeiro culto / evento
  points?: number;           // Pontos na gincana/conexão da cor
  notes?: string;            // Observações pastorais/integração
  contactId?: string;        // ID vinculado na tabela de contatos geral
  createdAt: string;
  updatedAt: string;
}

export interface ConexaoMembership {
  color: ConexaoColor;
  role: ConexaoRole;
  baseName?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  normalizedPhone: string;
  email?: string;
  neighborhood?: string;
  congregation: Congregation;
  category: ContactCategory;
  stage: ContactStage;
  source: ContactSource;
  assignedToId?: string;
  assignedToName?: string;
  firstVisitDate?: string;
  memberSinceDate?: string;
  initialNotes?: string;
  confirmedThisWeek?: boolean;
  confirmedNotes?: string;
  isArchived: boolean;
  archivedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  uniReino?: UniReinoEnrollment;
  conexaoJovem?: ConexaoMembership;
}

export interface Interaction {
  id: string;
  contactId: string;
  congregation: Congregation;
  channel: InteractionChannel;
  notes: string;
  userId: string;
  userName: string;
  stageAtInteraction: ContactStage;
  date: string;
  createdAt: string;
}

export interface Task {
  id: string;
  contactId: string;
  contactName: string;
  congregation: Congregation;
  description: string;
  assignedToId?: string;
  assignedToName?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  status: TaskStatus;
  completedAt?: string;
  completedBy?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactsFilterState {
  search: string;
  category: 'all' | ContactCategory;
  stage: 'all' | ContactStage;
  assignedTo: 'all' | string;
  startDate?: string;
  endDate?: string;
  showArchived: boolean;
}

export interface DashboardMetrics {
  activeMembers: number;
  newVisitorsThisMonth: number;
  newContactsThisMonth: number;
  pendingReturnsTotal: number;
  pendingReturnsToday: number;
  pendingReturnsOverdue: number;
}

export interface MonthlyTrendData {
  monthKey: string; // e.g. "2026-04"
  monthLabel: string; // e.g. "Abr 26"
  firstVisits: number;
  memberEntries: number;
}
