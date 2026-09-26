import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CRMProvider, useCRM } from './context/CRMContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileDrawer } from './components/MobileDrawer';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ContactsPage } from './pages/ContactsPage';
import { FollowUpPage } from './pages/FollowUpPage';
import { TeamAccessPage } from './pages/TeamAccessPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { UniReinoPage } from './pages/UniReinoPage';
import { ConexaoJovemPage } from './pages/ConexaoJovemPage';
import { ContactFormModal } from './components/ContactFormModal';
import { ContactDetailsDrawer } from './components/ContactDetailsDrawer';
import { InteractionModal } from './components/InteractionModal';
import { TaskModal } from './components/TaskModal';
import { TeamMemberModal } from './components/TeamMemberModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { SetupInstructionsModal } from './components/SetupInstructionsModal';
import { Contact, Task, MainTab, UserProfile } from './types';

const MainCRMApp: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  const {
    archiveContact,
    restoreContact,
    deleteContactPermanent,
    selectedContact,
    setSelectedContact,
    isContactDrawerOpen,
    setIsContactDrawerOpen,
    openContactDetails,
  } = useCRM();

  // Navigation state
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals state
  const [isNewContactOpen, setIsNewContactOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);

  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false);
  const [targetContactForInteraction, setTargetContactForInteraction] = useState<Contact | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [targetContactForTask, setTargetContactForTask] = useState<Contact | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  // Team Access Modal state
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);

  const [isSetupInstructionsOpen, setIsSetupInstructionsOpen] = useState(false);

  // Deletion / Archiving confirmation modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmContact, setConfirmContact] = useState<Contact | null>(null);
  const [confirmActionType, setConfirmActionType] = useState<'archive' | 'restore' | 'deletePermanent'>('archive');
  const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-xs uppercase tracking-widest text-[#888888]">Carregando Casa de Deus CRM...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <LoginPage
        onOpenSetupInstructions={() => setIsSetupInstructionsOpen(true)}
      />
    );
  }

  // Handlers for modal interactions
  const handleOpenEditContact = (contact: Contact) => {
    setContactToEdit(contact);
    setIsNewContactOpen(true);
  };

  const handleOpenNewInteraction = (contact: Contact) => {
    setTargetContactForInteraction(contact);
    setIsInteractionModalOpen(true);
  };

  const handleOpenNewTask = (contact?: Contact) => {
    setTargetContactForTask(contact || null);
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setIsTaskModalOpen(true);
  };

  const handleRequestArchive = (contact: Contact) => {
    setConfirmContact(contact);
    setConfirmActionType('archive');
    setIsConfirmModalOpen(true);
  };

  const handleRequestRestore = (contact: Contact) => {
    setConfirmContact(contact);
    setConfirmActionType('restore');
    setIsConfirmModalOpen(true);
  };

  const handleOpenNewMember = () => {
    setUserToEdit(null);
    setIsTeamModalOpen(true);
  };

  const handleEditMember = (user: UserProfile) => {
    setUserToEdit(user);
    setIsTeamModalOpen(true);
  };

  const handleRequestDeletePermanent = (contact: Contact) => {
    setConfirmContact(contact);
    setConfirmActionType('deletePermanent');
    setIsConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmContact) return;
    setIsConfirmSubmitting(true);
    try {
      if (confirmActionType === 'archive') {
        await archiveContact(confirmContact.id);
      } else if (confirmActionType === 'restore') {
        await restoreContact(confirmContact.id);
      } else if (confirmActionType === 'deletePermanent') {
        await deleteContactPermanent(confirmContact.id);
      }
      setIsConfirmModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsConfirmSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenNewContact={() => {
          setContactToEdit(null);
          setIsNewContactOpen(true);
        }}
        onOpenSetupInstructions={() => setIsSetupInstructionsOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Layout Area */}
      <div className="flex grow">
        {/* Desktop Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Mobile Navigation Drawer */}
        <MobileDrawer
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewContact={() => {
            setContactToEdit(null);
            setIsNewContactOpen(true);
          }}
        />

        {/* Primary Page Content */}
        <main className="grow p-4 md:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onOpenNewContact={() => {
                setContactToEdit(null);
                setIsNewContactOpen(true);
              }}
              onNavigateToContacts={() => setActiveTab('contacts')}
              onNavigateToFollowUp={() => setActiveTab('followup')}
              onOpenContactDetails={openContactDetails}
            />
          )}

          {activeTab === 'contacts' && (
            <ContactsPage
              onOpenNewContact={() => {
                setContactToEdit(null);
                setIsNewContactOpen(true);
              }}
              onOpenContactDetails={openContactDetails}
              onOpenNewInteraction={handleOpenNewInteraction}
              onOpenNewTask={handleOpenNewTask}
              onOpenEditContact={handleOpenEditContact}
              onRequestArchive={handleRequestArchive}
              onRequestRestore={handleRequestRestore}
              onRequestDeletePermanent={handleRequestDeletePermanent}
            />
          )}

          {activeTab === 'unireino' && (
            <UniReinoPage onOpenContactDetails={openContactDetails} />
          )}

          {activeTab === 'followup' && (
            <FollowUpPage
              onOpenNewTask={handleOpenNewTask}
              onOpenContactDetails={openContactDetails}
              onEditTask={handleEditTask}
            />
          )}

          {activeTab === 'team' && (
            <TeamAccessPage
              onOpenNewMember={handleOpenNewMember}
              onEditMember={handleEditMember}
            />
          )}

          {activeTab === 'security' && (
            <ChangePasswordPage />
          )}
        </main>
      </div>

      {/* Modals and Slide-over Drawers */}
      <ContactFormModal
        isOpen={isNewContactOpen}
        onClose={() => {
          setIsNewContactOpen(false);
          setContactToEdit(null);
        }}
        contactToEdit={contactToEdit}
      />

      <ContactDetailsDrawer
        contact={selectedContact}
        isOpen={isContactDrawerOpen}
        onClose={() => {
          setIsContactDrawerOpen(false);
          setSelectedContact(null);
        }}
        onOpenEdit={handleOpenEditContact}
        onOpenNewInteraction={handleOpenNewInteraction}
        onOpenNewTask={handleOpenNewTask}
        onRequestArchive={handleRequestArchive}
        onRequestRestore={handleRequestRestore}
        onRequestDeletePermanent={handleRequestDeletePermanent}
      />

      <InteractionModal
        isOpen={isInteractionModalOpen}
        onClose={() => {
          setIsInteractionModalOpen(false);
          setTargetContactForInteraction(null);
        }}
        contact={targetContactForInteraction}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTargetContactForTask(null);
          setTaskToEdit(null);
        }}
        contact={targetContactForTask}
        taskToEdit={taskToEdit}
      />

      <TeamMemberModal
        isOpen={isTeamModalOpen}
        onClose={() => {
          setIsTeamModalOpen(false);
          setUserToEdit(null);
        }}
        userToEdit={userToEdit}
      />

      <DeleteConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        contact={confirmContact}
        actionType={confirmActionType}
        onConfirm={handleConfirmAction}
        isSubmitting={isConfirmSubmitting}
      />

      <SetupInstructionsModal
        isOpen={isSetupInstructionsOpen}
        onClose={() => setIsSetupInstructionsOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <CRMProvider>
        <MainCRMApp />
      </CRMProvider>
    </AuthProvider>
  );
}
