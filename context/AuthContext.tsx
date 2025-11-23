
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';

interface AuthContextType {
  user: User | null;
  login: (username: string) => void;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => void; // Function to re-fetch user from storage
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = () => {
    const sessionUser = storage.getSession();
    if (sessionUser) {
      setUser(sessionUser);
    }
  };

  useEffect(() => {
    refreshUser();
    setIsLoading(false);
  }, []);

  const login = (username: string) => {
    // Mock login logic
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: username,
      level: 1,
      email: `${username}@example.com`,
      avatar_url: '',
      exp: 0,
      points: 100, // Give welcome points
      inventory: [],
      active_items: {},
      blocked_users: []
    };
    setUser(newUser);
    storage.setSession(newUser);
  };

  const logout = () => {
    setUser(null);
    storage.setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refreshUser }}>
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
