
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { auth } from '../firebase';
import { api } from '../services/api';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  login: (username: string, password?: string) => Promise<{ success: boolean, message: string, requires2FA?: boolean }>;
  verify2FA: (code: string) => boolean;
  register: (username: string, password: string, secondPassword?: string) => Promise<{ success: boolean, message: string }>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tempAdminUser, setTempAdminUser] = useState<User | null>(null);

  const refreshUser = async () => {
    if (auth.currentUser) {
        const userData = await api.getUser(auth.currentUser.uid);
        if (userData) setUser(userData);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch extended profile from Firestore
        const userData = await api.getUser(firebaseUser.uid);
        if (userData) {
             // Admin 2FA Check on Auto-Login/Initial Load not typically done for UX, 
             // but we can restrict 'admin' pages if needed. 
             // For now, we just load the user.
             setUser(userData);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (emailOrUsername: string, password?: string) => {
    if (!password) return { success: false, message: '비밀번호를 입력해주세요.' };
    
    // Note: For this demo, we assume username is passed, but Firebase needs email.
    // We'll construct a fake email if it's just a username for demo continuity,
    // OR user must input email. 
    // To keep it simple and compatible with previous UI: username@k-hub.com
    const email = emailOrUsername.includes('@') ? emailOrUsername : `${emailOrUsername}@k-hub.com`;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        const userData = await api.getUser(uid);

        if (!userData) {
            return { success: false, message: '사용자 정보를 불러올 수 없습니다.' };
        }

        // Admin 2FA Logic
        if (userData.is_admin) {
            setTempAdminUser(userData);
            // Temporarily sign out or hold state until 2FA
            // But for UX, we keep firebase auth active but don't set global 'user' context fully 
            // or we set a partial state. 
            // Here we returned requires2FA flag.
            return { success: true, message: '2차 인증이 필요합니다.', requires2FA: true };
        }

        setUser(userData);
        return { success: true, message: '로그인 성공' };
    } catch (error: any) {
        return { success: false, message: '로그인 실패: ' + error.message };
    }
  };

  const verify2FA = (code: string) => {
      if (tempAdminUser && tempAdminUser.second_password === code) {
          setUser(tempAdminUser);
          setTempAdminUser(null);
          return true;
      }
      return false;
  };

  const register = async (username: string, password: string, secondPassword?: string) => {
      const email = `${username}@k-hub.com`;
      const isAdmin = username.toLowerCase() === 'admin';

      try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const uid = userCredential.user.uid;

          const newUser: User = {
              id: uid,
              username: username,
              // Do not store main password in Firestore! Firebase Auth handles it.
              second_password: isAdmin ? secondPassword : undefined,
              is_admin: isAdmin,
              level: 1,
              email: email,
              avatar_url: '',
              exp: 0,
              points: 100,
              inventory: [],
              active_items: isAdmin ? { name_color: '#FF0000', name_style: 'bold', badge: '👑' } : {},
              blocked_users: []
          };

          await api.createUser(newUser);
          setUser(newUser);
          return { success: true, message: '회원가입 성공' };
      } catch (error: any) {
          return { success: false, message: '회원가입 실패: ' + error.message };
      }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setTempAdminUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, verify2FA, register, logout, isLoading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
