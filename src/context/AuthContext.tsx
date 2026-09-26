import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Congregation } from '../types';
import { DEMO_USERS } from '../data/mockData';
import { auth, isFirebaseConfigured } from '../services/firebaseConfig';
import { demoManager, realManager } from '../services/storage';
import {
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';

interface AuthContextType {
  currentUser: UserProfile | null;
  isDemoMode: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  sendResetPassword: (email: string) => Promise<void>;
  enterDemoMode: (asRole?: 'admin' | 'equipe') => void;
  switchDemoUser: (uid: string) => void;
  clearAuthError: () => void;
  toggleDemoMode: () => void;
  setDemoMode: (enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_AUTH_KEY = 'casadedeus_demo_user_uid';
const DEMO_MODE_ACTIVE_KEY = 'casadedeus_is_demo_mode';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    // Default to true if not configured yet so the church team can explore immediately
    const saved = localStorage.getItem(DEMO_MODE_ACTIVE_KEY);
    if (saved !== null) return saved === 'true';
    return !isFirebaseConfigured;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (isDemoMode) {
      const savedUid = localStorage.getItem(DEMO_AUTH_KEY) || 'admin-1';
      const found = DEMO_USERS.find(u => u.uid === savedUid) || DEMO_USERS[0];
      setCurrentUser(found);
      setIsLoading(false);
      return;
    }

    // In Real Mode (Demo is OFF): Check saved real user session first
    const savedRealUserStr = localStorage.getItem('casadedeus_real_user_session');
    if (savedRealUserStr) {
      try {
        const parsed = JSON.parse(savedRealUserStr);
        if (parsed && parsed.uid) {
          setCurrentUser(parsed);
          setIsLoading(false);
          return;
        }
      } catch {
        localStorage.removeItem('casadedeus_real_user_session');
      }
    }

    if (!isFirebaseConfigured || !auth) {
      // If no session and Firebase not active, show login screen in real mode
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const isAdmin = fbUser.email === 'onlineplrvendas@gmail.com' || fbUser.email?.includes('admin') || fbUser.email?.includes('pastorbruno');
        const userProfile: UserProfile = {
          uid: fbUser.uid,
          name: fbUser.displayName || 'Pr. Bruno Bitencourt',
          email: fbUser.email || 'pastorbruno@casadedeus.org',
          role: isAdmin ? 'admin' : 'equipe',
          assignedCongregations: isAdmin ? ['Recreio', 'Curicica', 'Guaratiba'] : ['Recreio'],
          active: true,
        };
        setCurrentUser(userProfile);
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  const enterDemoMode = (asRole: 'admin' | 'equipe' = 'admin') => {
    const user = DEMO_USERS.find(u => u.role === asRole) || DEMO_USERS[0];
    localStorage.setItem(DEMO_MODE_ACTIVE_KEY, 'true');
    localStorage.setItem(DEMO_AUTH_KEY, user.uid);
    setIsDemoMode(true);
    setCurrentUser(user);
    setAuthError(null);
  };

  const switchDemoUser = (uid: string) => {
    const found = DEMO_USERS.find(u => u.uid === uid);
    if (found) {
      localStorage.setItem(DEMO_AUTH_KEY, uid);
      setCurrentUser(found);
    }
  };

  const login = async (emailOrUsername: string, pass: string) => {
    setAuthError(null);
    setIsLoading(true);

    const cleanInput = emailOrUsername.trim().toLowerCase();
    const cleanPassword = pass.trim();

    try {
      const activeManager = isDemoMode ? demoManager : realManager;
      const allUsers = activeManager.getUsers();

      // Look for user by username, email, or master username
      let matchedUser = allUsers.find(u => {
        const matchesUsername = u.username && u.username.toLowerCase() === cleanInput;
        const matchesEmail = u.email && u.email.toLowerCase() === cleanInput;
        const isMaster = (cleanInput === 'pastorbruno' || cleanInput === 'pastorbruno@casadedeus.org') &&
          (u.uid === 'master-pastorbruno' || u.uid === 'admin-1');
        return Boolean(matchesUsername || matchesEmail || isMaster);
      });

      // If in demo mode and not found in activeManager, check DEMO_USERS
      if (!matchedUser && isDemoMode) {
        matchedUser = DEMO_USERS.find(u => {
          const matchesUsername = u.username && u.username.toLowerCase() === cleanInput;
          const matchesEmail = u.email && u.email.toLowerCase() === cleanInput;
          const isMaster = (cleanInput === 'pastorbruno' || cleanInput === 'pastorbruno@casadedeus.org') &&
            (u.uid === 'admin-1' || u.uid === 'master-pastorbruno');
          return Boolean(matchesUsername || matchesEmail || isMaster);
        });
      }

      // If user exists in system records:
      if (matchedUser) {
        // STRICT PASSWORD VALIDATION:
        // Se errar a senha, NUNCA liberar o acesso de forma alguma!
        const expectedPassword = matchedUser.password || (matchedUser.role === 'admin' ? '123456' : '123');

        if (cleanPassword !== expectedPassword && pass !== expectedPassword) {
          throw new Error('Senha incorreta! O acesso não foi liberado.');
        }

        if (!matchedUser.active) {
          throw new Error('Acesso bloqueado: Este usuário foi desativado pelo Pr. Bruno Bitencourt.');
        }

        if (!isDemoMode) {
          localStorage.setItem('casadedeus_real_user_session', JSON.stringify(matchedUser));
        } else {
          localStorage.setItem(DEMO_AUTH_KEY, matchedUser.uid);
        }
        setCurrentUser(matchedUser);
        setIsLoading(false);
        return;
      }

      // Fallback: If in Real Mode and Firebase Auth is configured
      if (!isDemoMode && isFirebaseConfigured && auth) {
        try {
          await signInWithEmailAndPassword(auth, emailOrUsername.trim(), pass);
          return;
        } catch (fbErr: any) {
          const code = fbErr?.code || '';
          if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
            throw new Error('Senha incorreta! O acesso não foi liberado.');
          }
          if (code === 'auth/user-not-found') {
            throw new Error('Usuário não cadastrado. Apenas pessoas autorizadas pelo Pr. Bruno Bitencourt podem acessar o sistema.');
          }
          throw fbErr;
        }
      }

      // If not recognized:
      throw new Error('Usuário não encontrado ou não autorizado. Verifique os dados digitados.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha na autenticação';
      setAuthError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('Nenhum usuário conectado.');
    }

    const trimmedCurrent = currentPassword.trim();
    const trimmedNew = newPassword.trim();

    if (!trimmedCurrent) {
      throw new Error('Informe sua senha atual.');
    }
    if (!trimmedNew) {
      throw new Error('Informe a nova senha.');
    }
    if (trimmedNew.length < 4) {
      throw new Error('A nova senha deve ter no mínimo 4 caracteres.');
    }
    if (trimmedNew === trimmedCurrent) {
      throw new Error('A nova senha deve ser diferente da senha atual.');
    }

    const activeManager = isDemoMode ? demoManager : realManager;
    const allUsers = activeManager.getUsers();

    // Find current user record in store
    const userInStore = allUsers.find(u => u.uid === currentUser.uid) ||
      allUsers.find(u => u.username && currentUser.username && u.username.toLowerCase() === currentUser.username.toLowerCase()) ||
      allUsers.find(u => u.email && currentUser.email && u.email.toLowerCase() === currentUser.email.toLowerCase());

    const expectedPassword = userInStore?.password || currentUser.password || (currentUser.role === 'admin' ? '123456' : '123');

    // Strict verification of current password
    if (trimmedCurrent !== expectedPassword && currentPassword !== expectedPassword) {
      throw new Error('A senha atual digitada está incorreta. Verifique e tente novamente.');
    }

    // 1. Update in active data manager
    if (userInStore) {
      activeManager.updateUser(userInStore.uid, { password: trimmedNew });
    } else {
      activeManager.updateUser(currentUser.uid, { password: trimmedNew });
    }

    // 2. In Real Mode, if master user, ensure realManager updates master account
    if (!isDemoMode && (currentUser.uid === 'master-pastorbruno' || currentUser.uid === 'admin-1')) {
      try {
        realManager.updateUser('master-pastorbruno', { password: trimmedNew });
      } catch {
        // master is already updated
      }
    }

    // 3. Update current user state in React
    const updatedUser: UserProfile = {
      ...currentUser,
      password: trimmedNew,
    };
    setCurrentUser(updatedUser);

    // 4. Update session storage so page refresh retains updated password
    if (!isDemoMode) {
      localStorage.setItem('casadedeus_real_user_session', JSON.stringify(updatedUser));
    } else {
      localStorage.setItem(DEMO_AUTH_KEY, updatedUser.uid);
    }
  };

  const logout = async () => {
    try {
      if (!isDemoMode && auth) {
        await signOut(auth);
      }
      setCurrentUser(null);
      localStorage.removeItem(DEMO_AUTH_KEY);
      localStorage.removeItem('casadedeus_real_user_session');
    } finally {
      setAuthError(null);
    }
  };

  const sendResetPassword = async (email: string) => {
    setAuthError(null);
    if (!email) {
      throw new Error('Informe o e-mail para recuperação');
    }

    if (isDemoMode || !isFirebaseConfigured || !auth) {
      // Simulate successful reset email dispatch in demo
      await new Promise(r => setTimeout(r, 600));
      return;
    }

    await sendPasswordResetEmail(auth, email);
  };

  const setDemoMode = (enabled: boolean) => {
    localStorage.setItem(DEMO_MODE_ACTIVE_KEY, enabled ? 'true' : 'false');
    setIsDemoMode(enabled);
    if (enabled) {
      const savedUid = localStorage.getItem(DEMO_AUTH_KEY) || 'admin-1';
      const found = DEMO_USERS.find(u => u.uid === savedUid) || DEMO_USERS[0];
      setCurrentUser(found);
      setAuthError(null);
    } else {
      if (isFirebaseConfigured && auth?.currentUser) {
        const fbUser = auth.currentUser;
        const isAdmin = fbUser.email === 'onlineplrvendas@gmail.com' || fbUser.email?.includes('admin');
        setCurrentUser({
          uid: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Usuário',
          email: fbUser.email || '',
          role: isAdmin ? 'admin' : 'equipe',
          assignedCongregations: isAdmin ? ['Recreio', 'Curicica', 'Guaratiba'] : ['Recreio'],
          active: true,
        });
      } else {
        setCurrentUser(null);
      }
    }
  };

  const toggleDemoMode = () => {
    setDemoMode(!isDemoMode);
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isDemoMode,
        isLoading,
        authError,
        login,
        logout,
        changePassword,
        sendResetPassword,
        enterDemoMode,
        switchDemoUser,
        clearAuthError,
        toggleDemoMode,
        setDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
