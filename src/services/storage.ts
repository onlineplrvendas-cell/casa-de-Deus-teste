import {
  Contact,
  Interaction,
  Task,
  UserProfile,
  UniReinoEnrollment,
  UniReinoSemester,
  UniReinoStatus,
  ConexaoParticipant,
} from '../types';
import { generateInitialDemoData, DEMO_USERS, generateInitialConexaoParticipants } from '../data/mockData';
import {
  db,
  auth,
  isFirebaseConfigured,
  handleFirestoreError,
  OperationType,
} from './firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

const DEMO_STORAGE_KEY = 'casadedeus_crm_demo_data_v4';
const REAL_STORAGE_KEY = 'casadedeus_crm_real_data_v2';

interface DataStore {
  contacts: Contact[];
  interactions: Interaction[];
  tasks: Task[];
  users: UserProfile[];
  conexaoParticipants: ConexaoParticipant[];
}

export class PersistentDataManager {
  private storageKey: string;
  private listeners: Set<() => void> = new Set();
  private data: DataStore;
  private initialFactory: () => DataStore;

  constructor(storageKey: string, initialFactory: () => DataStore) {
    this.storageKey = storageKey;
    this.initialFactory = initialFactory;
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): DataStore {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.conexaoParticipants) {
          parsed.conexaoParticipants = this.initialFactory().conexaoParticipants || [];
        }
        return parsed;
      }
    } catch (e) {
      console.error(`Failed to read data from ${this.storageKey}`, e);
    }
    const initial = this.initialFactory();
    this.saveToStorage(initial);
    return initial;
  }

  private saveToStorage(data: DataStore) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to write data to ${this.storageKey}`, e);
    }
  }

  private notify() {
    this.saveToStorage(this.data);
    this.listeners.forEach(fn => fn());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public resetData() {
    this.data = this.initialFactory();
    this.notify();
  }

  public resetDemoData() {
    this.resetData();
  }

  public getContacts(): Contact[] {
    return [...this.data.contacts];
  }

  public getInteractions(): Interaction[] {
    return [...this.data.interactions];
  }

  public getTasks(): Task[] {
    return [...this.data.tasks];
  }

  public getUsers(): UserProfile[] {
    return [...this.data.users];
  }

  public addContact(contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Contact {
    const newId = `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newContact: Contact = {
      ...contact,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    this.data.contacts.unshift(newContact);
    this.notify();
    return newContact;
  }

  public updateContact(id: string, updates: Partial<Contact>): Contact {
    const idx = this.data.contacts.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Contato não encontrado');
    const updated: Contact = {
      ...this.data.contacts[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.contacts[idx] = updated;

    // If congregation changed, synchronize associated tasks and interactions
    if (updates.congregation && updates.congregation !== this.data.contacts[idx].congregation) {
      this.data.tasks = this.data.tasks.map(t =>
        t.contactId === id ? { ...t, congregation: updates.congregation! } : t
      );
      this.data.interactions = this.data.interactions.map(i =>
        i.contactId === id ? { ...i, congregation: updates.congregation! } : i
      );
    }

    this.notify();
    return updated;
  }

  public toggleWeeklyConfirmation(id: string): Contact {
    const idx = this.data.contacts.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Contato não encontrado');
    const current = this.data.contacts[idx];
    const newStatus = !current.confirmedThisWeek;
    return this.updateContact(id, {
      confirmedThisWeek: newStatus,
      confirmedNotes: newStatus ? 'Confirmou presença para o culto desta semana' : undefined,
    });
  }

  public enrollInUniReino(
    id: string,
    enrollment: {
      semester?: UniReinoSemester;
      matricula?: string;
      turma?: string;
      notes?: string;
      status?: UniReinoStatus;
    }
  ): Contact {
    const idx = this.data.contacts.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Contato não encontrado');
    const current = this.data.contacts[idx];
    const now = new Date().toISOString();
    const updatedUniReino: UniReinoEnrollment = {
      isEnrolled: true,
      semester: enrollment.semester || 1,
      enrolledAt: current.uniReino?.enrolledAt || now,
      status: enrollment.status || 'matriculado',
      matricula:
        enrollment.matricula ||
        current.uniReino?.matricula ||
        `UN-${Math.floor(1000 + Math.random() * 9000)}`,
      turma:
        enrollment.turma ||
        current.uniReino?.turma ||
        `Turma ${new Date().getFullYear()}.${new Date().getMonth() < 6 ? 1 : 2}`,
      notes: enrollment.notes !== undefined ? enrollment.notes : (current.uniReino?.notes || ''),
    };

    return this.updateContact(id, {
      uniReino: updatedUniReino,
    });
  }

  public updateUniReino(id: string, updates: Partial<UniReinoEnrollment>): Contact {
    const idx = this.data.contacts.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Contato não encontrado');
    const current = this.data.contacts[idx];
    if (!current.uniReino) {
      return this.enrollInUniReino(id, updates);
    }
    const updatedUniReino: UniReinoEnrollment = {
      ...current.uniReino,
      ...updates,
      isEnrolled: updates.isEnrolled !== undefined ? updates.isEnrolled : true,
    };
    if (updates.status === 'concluido' && !updatedUniReino.completedAt) {
      updatedUniReino.completedAt = new Date().toISOString();
    }
    return this.updateContact(id, { uniReino: updatedUniReino });
  }

  public advanceUniReinoSemester(id: string): Contact {
    const idx = this.data.contacts.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Contato não encontrado');
    const current = this.data.contacts[idx];
    if (!current.uniReino) {
      return this.enrollInUniReino(id, { semester: 1 });
    }
    const curSemester = current.uniReino.semester;
    if (curSemester < 8) {
      const nextSemester = (curSemester + 1) as UniReinoSemester;
      return this.updateUniReino(id, { semester: nextSemester, status: 'matriculado' });
    } else {
      return this.updateUniReino(id, {
        semester: 8,
        status: 'concluido',
        completedAt: new Date().toISOString(),
      });
    }
  }

  public unenrollFromUniReino(id: string): Contact {
    return this.updateContact(id, {
      uniReino: undefined,
    });
  }

  public archiveContact(id: string): void {
    this.updateContact(id, {
      isArchived: true,
      archivedAt: new Date().toISOString(),
    });
  }

  public restoreContact(id: string): void {
    this.updateContact(id, {
      isArchived: false,
      archivedAt: undefined,
    });
  }

  public deleteContactPermanent(id: string): void {
    this.data.contacts = this.data.contacts.filter(c => c.id !== id);
    this.data.tasks = this.data.tasks.filter(t => t.contactId !== id);
    this.data.interactions = this.data.interactions.filter(i => i.contactId !== id);
    this.notify();
  }

  public addInteraction(interaction: Omit<Interaction, 'id' | 'createdAt'>): Interaction {
    const newId = `int-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newInt: Interaction = {
      ...interaction,
      id: newId,
      createdAt: now,
    };
    this.data.interactions.unshift(newInt);
    this.notify();
    return newInt;
  }

  public addTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const newId = `t-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    this.data.tasks.unshift(newTask);
    this.notify();
    return newTask;
  }

  public updateTask(id: string, updates: Partial<Task>): Task {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Tarefa não encontrada');
    const updated: Task = {
      ...this.data.tasks[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.tasks[idx] = updated;
    this.notify();
    return updated;
  }

  public deleteTask(id: string): void {
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    this.notify();
  }

  public addUser(user: Omit<UserProfile, 'uid' | 'createdAt'>): UserProfile {
    const newUid = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newUser: UserProfile = {
      ...user,
      uid: newUid,
      createdAt: now,
    };
    this.data.users.push(newUser);
    this.notify();
    return newUser;
  }

  public updateUser(uid: string, updates: Partial<UserProfile>): UserProfile {
    const idx = this.data.users.findIndex(u => u.uid === uid);
    if (idx === -1) throw new Error('Usuário não encontrado');
    const updated: UserProfile = {
      ...this.data.users[idx],
      ...updates,
    };
    this.data.users[idx] = updated;
    this.notify();
    return updated;
  }

  public deleteUser(uid: string): void {
    if (uid === 'admin-1' || uid === 'master-pastorbruno') {
      throw new Error('Não é possível remover o acesso Master do Pastor Bruno Bitencourt.');
    }
    this.data.users = this.data.users.filter(u => u.uid !== uid);
    this.notify();
  }

  // --- CONEXÃO JOVEM METHODS ---
  public getConexaoParticipants(): ConexaoParticipant[] {
    return [...(this.data.conexaoParticipants || [])];
  }

  public addConexaoParticipant(
    participant: Omit<ConexaoParticipant, 'id' | 'createdAt' | 'updatedAt'>
  ): ConexaoParticipant {
    const newId = `cx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const newParticipant: ConexaoParticipant = {
      ...participant,
      id: newId,
      points: participant.points ?? 50,
      confirmedNextCulto: participant.confirmedNextCulto ?? false,
      createdAt: now,
      updatedAt: now,
    };
    if (!this.data.conexaoParticipants) {
      this.data.conexaoParticipants = [];
    }
    this.data.conexaoParticipants.unshift(newParticipant);
    this.notify();
    return newParticipant;
  }

  public updateConexaoParticipant(
    id: string,
    updates: Partial<ConexaoParticipant>
  ): ConexaoParticipant {
    if (!this.data.conexaoParticipants) {
      this.data.conexaoParticipants = [];
    }
    const idx = this.data.conexaoParticipants.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Participante do Conexão Jovem não encontrado');
    const updated: ConexaoParticipant = {
      ...this.data.conexaoParticipants[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.data.conexaoParticipants[idx] = updated;
    this.notify();
    return updated;
  }

  public deleteConexaoParticipant(id: string): void {
    if (!this.data.conexaoParticipants) return;
    this.data.conexaoParticipants = this.data.conexaoParticipants.filter(p => p.id !== id);
    this.notify();
  }

  public toggleConexaoCultoConfirmation(id: string): ConexaoParticipant {
    if (!this.data.conexaoParticipants) {
      this.data.conexaoParticipants = [];
    }
    const idx = this.data.conexaoParticipants.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Participante não encontrado');
    const current = this.data.conexaoParticipants[idx];
    const newStatus = !current.confirmedNextCulto;
    return this.updateConexaoParticipant(id, {
      confirmedNextCulto: newStatus,
      points: newStatus ? (current.points || 0) + 30 : Math.max(0, (current.points || 0) - 30),
    });
  }

  public addConexaoPoints(id: string, additionalPoints: number): ConexaoParticipant {
    if (!this.data.conexaoParticipants) {
      this.data.conexaoParticipants = [];
    }
    const idx = this.data.conexaoParticipants.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Participante não encontrado');
    const current = this.data.conexaoParticipants[idx];
    return this.updateConexaoParticipant(id, {
      points: Math.max(0, (current.points || 0) + additionalPoints),
    });
  }
}

// 1. Isolated Demo Data Manager (30 rich contacts + full Conexão Jovem colors data)
export const demoManager = new PersistentDataManager(DEMO_STORAGE_KEY, () => {
  const initial = generateInitialDemoData();
  return {
    contacts: initial.contacts,
    interactions: initial.interactions,
    tasks: initial.tasks,
    users: DEMO_USERS,
    conexaoParticipants: generateInitialConexaoParticipants(),
  };
});

// 2. Persistent Real Data Manager (Separate store for real church data, retained permanently)
export const realManager = new PersistentDataManager(REAL_STORAGE_KEY, () => {
  return {
    contacts: [],
    interactions: [],
    tasks: [],
    users: [
      {
        uid: 'master-pastorbruno',
        name: 'Pr. Bruno Bitencourt',
        email: 'pastorbruno@casadedeus.org',
        username: 'PastorBruno',
        password: '123456',
        role: 'admin',
        assignedCongregations: ['Recreio', 'Curicica', 'Guaratiba'],
        active: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    conexaoParticipants: [],
  };
});

/**
 * Service bridge routing writes to Demo or Real storage
 */
export const CRMService = {
  isConfigured(): boolean {
    return isFirebaseConfigured && !!db;
  },

  async createContact(
    contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>,
    isDemo: boolean
  ): Promise<Contact> {
    if (isDemo) {
      return demoManager.addContact(contact);
    }

    // Real Mode: always persist in realManager
    const saved = realManager.addContact(contact);

    if (db) {
      try {
        const colRef = collection(db, 'contacts');
        const docRef = doc(colRef, saved.id);
        await setDoc(docRef, saved);
      } catch (error) {
        console.warn('Firestore write warning:', error);
      }
    }

    return saved;
  },

  async updateContact(
    id: string,
    updates: Partial<Contact>,
    isDemo: boolean
  ): Promise<Contact | void> {
    if (isDemo) {
      return demoManager.updateContact(id, updates);
    }

    const updated = realManager.updateContact(id, updates);

    if (db) {
      try {
        const docRef = doc(db, 'contacts', id);
        await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
      } catch (error) {
        console.warn('Firestore update warning:', error);
      }
    }

    return updated;
  },

  async toggleWeeklyConfirmation(id: string, isDemo: boolean): Promise<Contact> {
    const manager = isDemo ? demoManager : realManager;
    const updated = manager.toggleWeeklyConfirmation(id);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'contacts', id);
        await updateDoc(docRef, {
          confirmedThisWeek: updated.confirmedThisWeek,
          confirmedNotes: updated.confirmedNotes,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Firestore confirmation warning:', e);
      }
    }

    return updated;
  },

  async enrollInUniReino(
    id: string,
    enrollment: {
      semester?: UniReinoSemester;
      matricula?: string;
      turma?: string;
      notes?: string;
      status?: UniReinoStatus;
    },
    isDemo: boolean
  ): Promise<Contact> {
    const manager = isDemo ? demoManager : realManager;
    const updated = manager.enrollInUniReino(id, enrollment);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'contacts', id);
        await updateDoc(docRef, {
          uniReino: updated.uniReino,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Firestore enroll UniReino error:', e);
      }
    }

    return updated;
  },

  async updateUniReino(
    id: string,
    updates: Partial<UniReinoEnrollment>,
    isDemo: boolean
  ): Promise<Contact> {
    const manager = isDemo ? demoManager : realManager;
    const updated = manager.updateUniReino(id, updates);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'contacts', id);
        await updateDoc(docRef, {
          uniReino: updated.uniReino,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Firestore update UniReino error:', e);
      }
    }

    return updated;
  },

  async advanceUniReinoSemester(id: string, isDemo: boolean): Promise<Contact> {
    const manager = isDemo ? demoManager : realManager;
    const updated = manager.advanceUniReinoSemester(id);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'contacts', id);
        await updateDoc(docRef, {
          uniReino: updated.uniReino,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Firestore advance UniReino error:', e);
      }
    }

    return updated;
  },

  async unenrollFromUniReino(id: string, isDemo: boolean): Promise<Contact> {
    const manager = isDemo ? demoManager : realManager;
    const updated = manager.unenrollFromUniReino(id);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'contacts', id);
        await updateDoc(docRef, {
          uniReino: null,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Firestore unenroll UniReino error:', e);
      }
    }

    return updated;
  },

  async archiveContact(id: string, isDemo: boolean): Promise<void> {
    const manager = isDemo ? demoManager : realManager;
    manager.archiveContact(id);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'contacts', id);
        await updateDoc(docRef, {
          isArchived: true,
          archivedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.warn('Firestore archive error:', error);
      }
    }
  },

  async restoreContact(id: string, isDemo: boolean): Promise<void> {
    const manager = isDemo ? demoManager : realManager;
    manager.restoreContact(id);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'contacts', id);
        await updateDoc(docRef, {
          isArchived: false,
          archivedAt: null,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.warn('Firestore restore error:', error);
      }
    }
  },

  async deleteContactPermanent(id: string, isDemo: boolean): Promise<void> {
    const manager = isDemo ? demoManager : realManager;
    manager.deleteContactPermanent(id);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'contacts', id);
        await deleteDoc(docRef);
      } catch (error) {
        console.warn('Firestore delete error:', error);
      }
    }
  },

  async createInteraction(
    interaction: Omit<Interaction, 'id' | 'createdAt'>,
    isDemo: boolean
  ): Promise<Interaction> {
    if (isDemo) {
      return demoManager.addInteraction(interaction);
    }

    const saved = realManager.addInteraction(interaction);

    if (db) {
      try {
        const colRef = collection(db, 'interactions');
        const docRef = doc(colRef, saved.id);
        await setDoc(docRef, saved);
      } catch (e) {
        console.warn('Firestore interaction error:', e);
      }
    }

    return saved;
  },

  async createTask(
    task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
    isDemo: boolean
  ): Promise<Task> {
    if (isDemo) {
      return demoManager.addTask(task);
    }

    const saved = realManager.addTask(task);

    if (db) {
      try {
        const colRef = collection(db, 'tasks');
        const docRef = doc(colRef, saved.id);
        await setDoc(docRef, saved);
      } catch (e) {
        console.warn('Firestore task error:', e);
      }
    }

    return saved;
  },

  async updateTask(
    id: string,
    updates: Partial<Task>,
    isDemo: boolean
  ): Promise<Task | void> {
    if (isDemo) {
      return demoManager.updateTask(id, updates);
    }

    const updated = realManager.updateTask(id, updates);

    if (db) {
      try {
        const docRef = doc(db, 'tasks', id);
        await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.warn('Firestore task update error:', e);
      }
    }

    return updated;
  },

  async deleteTask(id: string, isDemo: boolean): Promise<void> {
    const manager = isDemo ? demoManager : realManager;
    manager.deleteTask(id);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'tasks', id);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('Firestore task delete error:', e);
      }
    }
  },

  async createUser(user: Omit<UserProfile, 'uid' | 'createdAt'>, isDemo: boolean): Promise<UserProfile> {
    const manager = isDemo ? demoManager : realManager;
    const created = manager.addUser(user);

    if (!isDemo && db) {
      try {
        const colRef = collection(db, 'users');
        const docRef = doc(colRef, created.uid);
        await setDoc(docRef, created);
      } catch (e) {
        console.warn('Firestore user create error:', e);
      }
    }

    return created;
  },

  async updateUser(uid: string, updates: Partial<UserProfile>, isDemo: boolean): Promise<UserProfile> {
    const manager = isDemo ? demoManager : realManager;
    const updated = manager.updateUser(uid, updates);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'users', uid);
        await updateDoc(docRef, updates);
      } catch (e) {
        console.warn('Firestore user update error:', e);
      }
    }

    return updated;
  },

  async deleteUser(uid: string, isDemo: boolean): Promise<void> {
    const manager = isDemo ? demoManager : realManager;
    manager.deleteUser(uid);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'users', uid);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('Firestore user delete error:', e);
      }
    }
  },

  // --- CONEXÃO JOVEM SERVICE BRIDGES ---
  async addConexaoParticipant(
    participant: Omit<ConexaoParticipant, 'id' | 'createdAt' | 'updatedAt'>,
    isDemo: boolean
  ): Promise<ConexaoParticipant> {
    const manager = isDemo ? demoManager : realManager;
    const added = manager.addConexaoParticipant(participant);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'conexao_participants', added.id);
        await setDoc(docRef, added);
      } catch (e) {
        console.warn('Firestore conexao participant write warning:', e);
      }
    }

    return added;
  },

  async updateConexaoParticipant(
    id: string,
    updates: Partial<ConexaoParticipant>,
    isDemo: boolean
  ): Promise<ConexaoParticipant> {
    const manager = isDemo ? demoManager : realManager;
    const updated = manager.updateConexaoParticipant(id, updates);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'conexao_participants', id);
        await updateDoc(docRef, updates);
      } catch (e) {
        console.warn('Firestore conexao participant update warning:', e);
      }
    }

    return updated;
  },

  async deleteConexaoParticipant(id: string, isDemo: boolean): Promise<void> {
    const manager = isDemo ? demoManager : realManager;
    manager.deleteConexaoParticipant(id);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'conexao_participants', id);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('Firestore conexao participant delete warning:', e);
      }
    }
  },

  async toggleConexaoCultoConfirmation(id: string, isDemo: boolean): Promise<ConexaoParticipant> {
    const manager = isDemo ? demoManager : realManager;
    const updated = manager.toggleConexaoCultoConfirmation(id);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'conexao_participants', id);
        await updateDoc(docRef, {
          confirmedNextCulto: updated.confirmedNextCulto,
          points: updated.points,
          updatedAt: updated.updatedAt,
        });
      } catch (e) {
        console.warn('Firestore conexao confirmation warning:', e);
      }
    }

    return updated;
  },

  async addConexaoPoints(id: string, additionalPoints: number, isDemo: boolean): Promise<ConexaoParticipant> {
    const manager = isDemo ? demoManager : realManager;
    const updated = manager.addConexaoPoints(id, additionalPoints);

    if (!isDemo && db) {
      try {
        const docRef = doc(db, 'conexao_participants', id);
        await updateDoc(docRef, {
          points: updated.points,
          updatedAt: updated.updatedAt,
        });
      } catch (e) {
        console.warn('Firestore conexao points warning:', e);
      }
    }

    return updated;
  },
};
