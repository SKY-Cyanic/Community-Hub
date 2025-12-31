
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  isAiHubMode: boolean;
  toggleTheme: () => void;
  toggleAiHubMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('ai_hub_theme') === 'dark');
  const [isAiHubMode, setIsAiHubMode] = useState(() => localStorage.getItem('ai_hub_beta') === 'true');

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('ai_hub_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isAiHubMode) root.classList.add('ai-hub-active');
    else root.classList.remove('ai-hub-active');
    localStorage.setItem('ai_hub_beta', isAiHubMode ? 'true' : 'false');
  }, [isAiHubMode]);

  const toggleTheme = () => setIsDarkMode(prev => !prev);
  const toggleAiHubMode = () => setIsAiHubMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ isDarkMode, isAiHubMode, toggleTheme, toggleAiHubMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
