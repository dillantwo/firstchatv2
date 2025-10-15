'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  // 初始化主题（从 localStorage 读取或默认为 light）
  useEffect(() => {
    setMounted(true);
    try {
      const savedTheme = localStorage.getItem('chat-theme');
      if (savedTheme) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.warn('localStorage not available:', error);
    }
  }, []);

  // 当主题改变时，更新 localStorage 和 document 类名
  useEffect(() => {
    if (!mounted) return;
    
    try {
      localStorage.setItem('chat-theme', theme);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
    
    // 更新 document 根元素的类名
    if (typeof document !== 'undefined') {
      if (theme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      }
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
