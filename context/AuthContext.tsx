
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';

interface AuthContextType {
  user: User | null;
  login: (username: string, password?: string) => { success: boolean, message: string, requires2FA?: boolean };
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
  const [tempAdminUser, setTempAdminUser] = useState<User | null>(null); // For 2FA step

  const refreshUser = () => {
    const sessionUser = storage.getSession();
    if (sessionUser) {
      // Re-sync with the 'users' list to get latest point/exp updates
      const latestUser = storage.getUser(sessionUser.username);
      // If user was deleted remotely
      if (!latestUser) {
          logout();
          return;
      }
      setUser(latestUser);
      // Update session storage if data changed
      if (JSON.stringify(sessionUser) !== JSON.stringify(latestUser)) {
          // Do not call storage.setSession here to avoid infinite loop with listeners
          // Just update local state
          localStorage.setItem('k_community_session', JSON.stringify(latestUser));
      }
    } else {
        setUser(null);
    }
  };

  useEffect(() => {
    refreshUser();
    setIsLoading(false);

    // Subscribe to cross-tab updates
    const handleSync = (event: MessageEvent) => {
        if (event.data.type === 'SESSION_UPDATE' || event.data.type === 'USER_UPDATE') {
            refreshUser();
        }
    };
    storage.channel.onmessage = handleSync;

    return () => {
        storage.channel.onmessage = null;
    };
  }, []);

  const login = (username: string, password?: string) => {
    const targetUser = storage.getUser(username);

    if (!targetUser) {
        return { success: false, message: '존재하지 않는 사용자입니다.' };
    }

    // Verify Password
    if (targetUser.password && targetUser.password !== password) {
        return { success: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    // Admin 2FA Check
    if (targetUser.is_admin) {
        setTempAdminUser(targetUser);
        return { success: true, message: '2차 인증이 필요합니다.', requires2FA: true };
    }

    setUser(targetUser);
    storage.setSession(targetUser);
    return { success: true, message: '로그인 성공' };
  };

  const verify2FA = (code: string) => {
      if (tempAdminUser && tempAdminUser.second_password === code) {
          setUser(tempAdminUser);
          storage.setSession(tempAdminUser);
          setTempAdminUser(null);
          return true;
      }
      return false;
  };

  const register = async (username: string, password: string, secondPassword?: string) => {
      const existing = storage.getUser(username);
      if (existing) {
          return { success: false, message: '이미 존재하는 아이디입니다.' };
      }

      const isAdmin = username.toLowerCase() === 'admin';
      
      const newUser: User = {
          id: `user-${Date.now()}`,
          username: username,
          password: password,
          second_password: isAdmin ? secondPassword : undefined,
          is_admin: isAdmin,
          level: 1,
          email: `${username}@example.com`,
          avatar_url: '',
          exp: 0,
          points: 100, // Welcome points
          inventory: [],
          active_items: isAdmin ? { name_color: '#FF0000', name_style: 'bold', badge: '👑' } : {},
          blocked_users: []
      };

      storage.saveUser(newUser);
      // Auto login after register
      setUser(newUser);
      storage.setSession(newUser);
      
      return { success: true, message: '회원가입 성공' };
  };

  const logout = () => {
    setUser(null);
    storage.setSession(null);
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
