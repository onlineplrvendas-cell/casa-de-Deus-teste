import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useCRM } from '../context/CRMContext';
import { UserProfile, Congregation, UserRole } from '../types';
import { Shield, Key, Eye, EyeOff, Building2, User, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: UserProfile | null;
}

export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({
  isOpen,
  onClose,
  userToEdit,
}) => {
  const { createUser, updateUser, deleteUser } = useCRM();

  const isEditing = !!userToEdit;

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [congregationScope, setCongregationScope] = useState<'Recreio' | 'Curicica' | 'Guaratiba' | 'all'>('Recreio');
  const [role, setRole] = useState<UserRole>('equipe');
  const [active, setActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isMasterUser = userToEdit?.uid === 'master-pastorbruno' || userToEdit?.uid === 'admin-1';

  useEffect(() => {
    setConfirmDelete(false);
    if (userToEdit) {
      setName(userToEdit.name);
      setUsername(userToEdit.username || userToEdit.email.split('@')[0] || '');
      setEmail(userToEdit.email);
      setPassword(userToEdit.password || '123');
      if (userToEdit.assignedCongregations.length >= 3) {
        setCongregationScope('all');
      } else {
        setCongregationScope(userToEdit.assignedCongregations[0] || 'Recreio');
      }
      setRole(userToEdit.role);
      setActive(userToEdit.active);
    } else {
      setName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setCongregationScope('Recreio');
      setRole('equipe');
      setActive(true);
    }
    setErrors({});
    setSuccessMessage(null);
  }, [userToEdit, isOpen]);

  const validate = (): boolean => {
    const err: Record<string, string> = {};
    if (!name.trim()) err.name = 'Nome completo é obrigatório';
    if (!username.trim()) err.username = 'Login/Usuário é obrigatório';
    if (!isEditing && !password) err.password = 'Defina uma senha de acesso para o membro';
    if (password && password.length < 3) err.password = 'A senha deve ter no mínimo 3 caracteres';

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const assignedCongregations: Congregation[] =
        congregationScope === 'all'
          ? ['Recreio', 'Curicica', 'Guaratiba']
          : [congregationScope as Congregation];

      const cleanUsername = username.trim().replace(/\s+/g, '').toLowerCase();
      const userEmail = email.trim() || `${cleanUsername}@casadedeus.org`;

      if (isEditing && userToEdit) {
        await updateUser(userToEdit.uid, {
          name: name.trim(),
          username: cleanUsername,
          email: userEmail,
          password: password.trim() || userToEdit.password,
          role,
          assignedCongregations,
          active,
        });
        setSuccessMessage('Acesso atualizado com sucesso!');
      } else {
        await createUser({
          name: name.trim(),
          username: cleanUsername,
          email: userEmail,
          password: password.trim(),
          role,
          assignedCongregations,
          active,
        });
        setSuccessMessage('Novo acesso de equipe criado com sucesso!');
      }

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Falha ao salvar permissões do usuário';
      setErrors({ submit: msg });
    }
  };

  const handleDeleteMember = async () => {
    if (!userToEdit || isMasterUser) return;
    setIsSubmitting(true);
    try {
      await deleteUser(userToEdit.uid);
      setSuccessMessage(`Conta de "${userToEdit.name}" excluída com sucesso!`);
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Falha ao excluir conta';
      setErrors({ submit: msg });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Acesso da Equipe' : 'Criar Novo Acesso de Equipe'}
      subtitle="Autorização e destinação de unidade pelo Pr. Bruno Bitencourt"
      maxWidth="lg"
    >
      {successMessage ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-white" />
          <p className="text-sm font-semibold text-white">{successMessage}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errors.submit && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg text-red-200">
              {errors.submit}
            </div>
          )}

          {/* Nome */}
          <div>
            <label className="block text-xs font-medium text-[#CCCCCC] mb-1">
              Nome do Membro da Equipe <span className="text-white font-bold">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Mariana Souza, Diácono Roberto"
              className={`w-full px-3 py-2 bg-[#141414] border ${
                errors.name ? 'border-red-500' : 'border-[#262626]'
              } rounded-lg text-white text-xs focus:outline-none focus:border-white transition-colors`}
            />
            {errors.name && <p className="text-red-400 text-[10px] mt-1">{errors.name}</p>}
          </div>

          {/* Login e Senha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#CCCCCC] mb-1">
                Login / Usuário de Acesso <span className="text-white font-bold">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="mariana.recreio"
                className={`w-full px-3 py-2 bg-[#141414] border ${
                  errors.username ? 'border-red-500' : 'border-[#262626]'
                } rounded-lg text-white text-xs focus:outline-none focus:border-white transition-colors`}
              />
              {errors.username && <p className="text-red-400 text-[10px] mt-1">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CCCCCC] mb-1">
                Senha de Acesso {isEditing ? '(deixe em branco para manter)' : <span className="text-white font-bold">*</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-3 pr-8 py-2 bg-[#141414] border ${
                    errors.password ? 'border-red-500' : 'border-[#262626]'
                  } rounded-lg text-white text-xs focus:outline-none focus:border-white transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-[10px] mt-1">{errors.password}</p>}
            </div>
          </div>

          {/* E-mail opcional */}
          <div>
            <label className="block text-xs font-medium text-[#CCCCCC] mb-1">
              E-mail Institucional (opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="equipe.recreio@casadedeus.org"
              className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white text-xs focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Destinação da Unidade da Igreja */}
          <div className="p-3 bg-[#0F0F0F] border border-[#262626] rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <Building2 className="w-3.5 h-3.5 text-white" />
              <span>Unidade Autorizada da Igreja</span>
            </div>
            <p className="text-[11px] text-[#888888] leading-relaxed">
              O membro da equipe <strong>só poderá visualizar, consultar e cadastrar pessoas dentro da unidade autorizada</strong> pelo Pr. Bruno Bitencourt.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { id: 'Recreio', label: 'Recreio' },
                { id: 'Curicica', label: 'Curicica' },
                { id: 'Guaratiba', label: 'Guaratiba' },
                { id: 'all', label: 'Todas as Unidades' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setCongregationScope(opt.id as any);
                    if (opt.id === 'all') {
                      setRole('admin');
                    } else {
                      setRole('equipe');
                    }
                  }}
                  className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-colors ${
                    congregationScope === opt.id
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-[#141414] text-[#888888] hover:text-white border-[#262626]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Ativo / Inativo */}
          <div className="p-3 bg-[#0F0F0F] border border-[#262626] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-white block">Status da Autorização</span>
              <span className="text-[10px] text-[#777777]">
                {active ? 'Acesso liberado para operar no sistema' : 'Acesso suspenso (bloqueado)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                active ? 'bg-white' : 'bg-[#262626]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full shadow transition duration-200 ease-in-out ${
                  active ? 'translate-x-4 bg-black' : 'translate-x-0 bg-[#666666]'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-[#1C1C1C]">
            <div>
              {isEditing && !isMasterUser && (
                confirmDelete ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleDeleteMember}
                      disabled={isSubmitting}
                      className="px-2.5 py-1.5 text-[11px] font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Confirmar Exclusão
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1.5 text-[11px] text-[#888888] hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 rounded-lg transition-colors"
                    title="Excluir este acesso da equipe"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir Conta</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#CCCCCC] hover:text-white bg-[#141414] border border-[#262626] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Acesso'}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
