import React, { useState, useMemo } from 'react';
import { useCRM } from '../context/CRMContext';
import { useAuth } from '../context/AuthContext';
import { UserProfile, Congregation } from '../types';
import {
  Shield,
  ShieldCheck,
  Plus,
  Key,
  Building2,
  UserCheck,
  UserX,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface TeamAccessPageProps {
  onOpenNewMember: () => void;
  onEditMember: (user: UserProfile) => void;
}

export const TeamAccessPage: React.FC<TeamAccessPageProps> = ({
  onOpenNewMember,
  onEditMember,
}) => {
  const { users, deleteUser, updateUser } = useCRM();
  const { currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(term) ||
        (u.username && u.username.toLowerCase().includes(term)) ||
        u.email.toLowerCase().includes(term) ||
        u.assignedCongregations.some(c => c.toLowerCase().includes(term))
      );
    });
  }, [users, searchTerm]);

  // Counts by unit
  const stats = useMemo(() => {
    const total = users.length;
    const recreio = users.filter(u => u.assignedCongregations.includes('Recreio')).length;
    const curicica = users.filter(u => u.assignedCongregations.includes('Curicica')).length;
    const guaratiba = users.filter(u => u.assignedCongregations.includes('Guaratiba')).length;
    return { total, recreio, curicica, guaratiba };
  }, [users]);

  const togglePasswordReveal = (uid: string) => {
    setRevealedPasswords(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const handleToggleActive = async (user: UserProfile) => {
    if (user.uid === 'admin-1' || user.uid === 'master-pastorbruno') return;
    try {
      await updateUser(user.uid, { active: !user.active });
      setActionSuccessNotice(`Status de ${user.name} atualizado para ${!user.active ? 'Ativo' : 'Inativo'}.`);
      setTimeout(() => setActionSuccessNotice(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmUser) return;
    const deletedName = deleteConfirmUser.name;
    setIsDeleting(true);
    try {
      await deleteUser(deleteConfirmUser.uid);
      setDeleteConfirmUser(null);
      setActionSuccessNotice(`A conta de "${deletedName}" foi excluída com sucesso pelo Master.`);
      setTimeout(() => setActionSuccessNotice(null), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-12 text-center bg-[#0B0B0B] border border-[#262626] rounded-xl text-xs space-y-3">
        <Shield className="w-8 h-8 text-neutral-500 mx-auto" />
        <h2 className="text-sm font-semibold text-white">Acesso Restrito ao Pastor Master</h2>
        <p className="text-[#888888]">
          Apenas o Pr. Bruno Bitencourt tem permissão para gerenciar os acessos da equipe e destinar unidades da igreja.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1F1F1F]">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-heading tracking-tight flex items-center gap-2">
            <span>Gestão de Acessos da Equipe</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#888888] mt-0.5">
            Criação de logins, senhas e destinação de congregações autorizadas pelo Pr. Bruno Bitencourt
          </p>
        </div>

        <button
          onClick={onOpenNewMember}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-black font-semibold text-xs sm:text-sm rounded-lg hover:bg-neutral-200 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Acesso de Equipe</span>
        </button>
      </div>

      {/* Action Notification */}
      {actionSuccessNotice && (
        <div className="p-3 bg-neutral-900 border border-neutral-600 rounded-xl text-white text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span className="font-medium">{actionSuccessNotice}</span>
          </div>
          <button
            onClick={() => setActionSuccessNotice(null)}
            className="text-[#888888] hover:text-white text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[#0B0B0B] border border-[#262626] rounded-xl space-y-1">
          <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider">Total de Acessos</span>
          <div className="text-xl font-bold text-white font-heading">{stats.total}</div>
          <span className="text-[10px] text-[#888888]">Usuários cadastrados</span>
        </div>

        <div className="p-3.5 bg-[#0B0B0B] border border-[#262626] rounded-xl space-y-1">
          <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider">Unidade Recreio</span>
          <div className="text-xl font-bold text-white font-heading">{stats.recreio}</div>
          <span className="text-[10px] text-[#888888]">Autorizados Recreio</span>
        </div>

        <div className="p-3.5 bg-[#0B0B0B] border border-[#262626] rounded-xl space-y-1">
          <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider">Unidade Curicica</span>
          <div className="text-xl font-bold text-white font-heading">{stats.curicica}</div>
          <span className="text-[10px] text-[#888888]">Autorizados Curicica</span>
        </div>

        <div className="p-3.5 bg-[#0B0B0B] border border-[#262626] rounded-xl space-y-1">
          <span className="text-[10px] text-[#777777] uppercase font-bold tracking-wider">Unidade Guaratiba</span>
          <div className="text-xl font-bold text-white font-heading">{stats.guaratiba}</div>
          <span className="text-[10px] text-[#888888]">Autorizados Guaratiba</span>
        </div>
      </div>

      {/* Security Rule Card */}
      <div className="p-4 bg-[#0F0F0F] border border-[#222222] rounded-xl text-xs space-y-1.5">
        <div className="flex items-center gap-2 text-white font-semibold">
          <ShieldCheck className="w-4 h-4 text-white" />
          <span>Regra de Autorização Restrita</span>
        </div>
        <p className="text-[#888888] leading-relaxed text-[11px]">
          Ao destinar uma unidade específica (ex: <strong>Recreio</strong>, <strong>Curicica</strong> ou <strong>Guaratiba</strong>), o membro da equipe terá acesso restrito exclusivamente aos cadastros, membros, visitantes e rotinas daquela congregação. Ele não tem acesso aos dados das demais igrejas sem expressa permissão do Pr. Bruno Bitencourt.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar membro por nome, login ou congregação..."
          className="w-full pl-9 pr-3 py-2 bg-[#0B0B0B] border border-[#262626] rounded-lg text-white text-xs focus:outline-none focus:border-white transition-colors"
        />
      </div>

      {/* Users Table (Desktop) */}
      <div className="hidden md:block bg-[#0B0B0B] border border-[#262626] rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0F0F0F] border-b border-[#262626] text-[#888888] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Membro da Equipe</th>
              <th className="py-3 px-4">Login de Acesso</th>
              <th className="py-3 px-4">Senha</th>
              <th className="py-3 px-4">Unidade Autorizada</th>
              <th className="py-3 px-4">Nível</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A1A]">
            {filteredUsers.map(user => {
              const isMaster = user.uid === 'admin-1' || user.uid === 'master-pastorbruno';
              const isRevealed = revealedPasswords[user.uid];

              return (
                <tr key={user.uid} className="hover:bg-[#121212] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#1C1C1C] border border-[#333333] flex items-center justify-center text-[10px] font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <span>{user.name}</span>
                        {isMaster && (
                          <span className="ml-2 text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-white text-black rounded">
                            Master
                          </span>
                        )}
                        <span className="block text-[10px] text-[#777777] font-normal">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-white font-mono text-xs">
                    {user.username || user.email.split('@')[0]}
                  </td>
                  <td className="py-3.5 px-4">
                    {isMaster ? (
                      <span className="text-[#888888] italic text-[11px] font-mono">
                        [Protegido Master]
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span>{isRevealed ? (user.password || '123') : '••••••••'}</span>
                        <button
                          onClick={() => togglePasswordReveal(user.uid)}
                          className="text-[#666666] hover:text-white p-0.5"
                          title={isRevealed ? 'Ocultar senha' : 'Ver senha'}
                        >
                          {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      {user.assignedCongregations.length >= 3 ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1C1C1C] text-white border border-[#333333]">
                          Todas as Unidades
                        </span>
                      ) : (
                        user.assignedCongregations.map(c => (
                          <span
                            key={c}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#141414] text-white border border-[#2B2B2B]"
                          >
                            {c}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] text-[#AAAAAA]">
                      {user.role === 'admin' ? 'Administrador' : 'Equipe de Atendimento'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={isMaster}
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        user.active
                          ? 'bg-neutral-900 text-white border border-neutral-700'
                          : 'bg-red-950/40 text-red-300 border border-red-900/50'
                      } ${isMaster ? 'cursor-default' : 'cursor-pointer hover:border-white'}`}
                      title={isMaster ? 'Acesso Master' : 'Clique para alternar status'}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-white' : 'bg-red-400'}`} />
                      <span>{user.active ? 'Ativo' : 'Inativo'}</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onEditMember(user)}
                        className="p-1.5 text-[#888888] hover:text-white bg-[#141414] hover:bg-[#1A1A1A] rounded border border-[#262626] transition-colors"
                        title="Editar permissões"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {!isMaster && (
                        <button
                          onClick={() => setDeleteConfirmUser(user)}
                          className="p-1.5 text-[#888888] hover:text-red-400 bg-[#141414] hover:bg-red-950/40 rounded border border-[#262626] transition-colors"
                          title="Remover acesso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Cards View (Mobile) */}
      <div className="md:hidden space-y-3">
        {filteredUsers.map(user => {
          const isMaster = user.uid === 'admin-1' || user.uid === 'master-pastorbruno';
          const isRevealed = revealedPasswords[user.uid];

          return (
            <div key={user.uid} className="p-4 bg-[#0B0B0B] border border-[#262626] rounded-xl space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <span>{user.name}</span>
                    {isMaster && (
                      <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-white text-black rounded">
                        Master
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-[#888888]">{user.email}</p>
                </div>
                <button
                  onClick={() => handleToggleActive(user)}
                  disabled={isMaster}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    user.active ? 'bg-neutral-900 text-white border-neutral-700' : 'bg-red-950/40 text-red-400 border-red-900'
                  }`}
                >
                  {user.active ? 'Ativo' : 'Inativo'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#1A1A1A]">
                <div>
                  <span className="text-[10px] text-[#777777] block">Login:</span>
                  <span className="font-mono text-white">{user.username || user.email.split('@')[0]}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#777777] block">Senha:</span>
                  {isMaster ? (
                    <span className="text-[#888888] italic text-[10px] font-mono">
                      [Protegido Master]
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 font-mono text-white">
                      <span>{isRevealed ? (user.password || '123') : '••••••'}</span>
                      <button onClick={() => togglePasswordReveal(user.uid)} className="text-[#666666]">
                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#1A1A1A] flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {user.assignedCongregations.map(c => (
                    <span key={c} className="text-[10px] px-2 py-0.5 rounded bg-[#141414] text-white border border-[#2B2B2B]">
                      {c}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {!isMaster ? (
                    <>
                      <button
                        onClick={() => onEditMember(user)}
                        className="p-1.5 text-white bg-[#141414] rounded border border-[#262626]"
                        title="Editar permissões"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmUser(user)}
                        className="p-1.5 text-red-400 bg-[#141414] rounded border border-[#262626]"
                        title="Remover acesso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[10px] text-[#666666] px-2 py-0.5 bg-[#141414] rounded border border-[#222222]">
                      Titular Master
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0B0B0B] border border-[#262626] rounded-xl p-5 shadow-2xl space-y-4 text-white">
            <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Excluir Conta da Equipe</span>
            </div>
            <div className="space-y-2 text-xs text-[#AAAAAA] leading-relaxed">
              <p>
                Tem certeza de que deseja excluir a conta de <strong>{deleteConfirmUser.name}</strong>?
              </p>
              <div className="p-2.5 bg-[#141414] rounded-lg border border-[#222222] font-mono text-[11px] text-[#CCCCCC]">
                <div>Login: <span className="text-white">{deleteConfirmUser.username || deleteConfirmUser.email}</span></div>
                <div>Unidade: <span className="text-white">{deleteConfirmUser.assignedCongregations.join(', ')}</span></div>
              </div>
              <p className="text-[11px] text-red-300">
                Esta ação revogará o login imediatamente. Apenas o Master pode recriar este acesso no futuro.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1C1C1C]">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-3 py-1.5 text-xs text-[#CCCCCC] bg-[#141414] hover:bg-[#1C1C1C] border border-[#262626] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir Conta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
