import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  setDark: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
  setDark: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const emolit = localStorage.getItem('emolit-theme');
      if (emolit === 'dark') return true;
      if (emolit === 'light') return false;
      const lp = localStorage.getItem('lp-theme');
      if (lp === 'dark') return true;
      if (lp === 'light') return false;
      return false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark');
    } else {
      root.setAttribute('data-theme', 'light');
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('emolit-theme', isDark ? 'dark' : 'light');
    } catch {}
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const setDark = useCallback((value: boolean) => {
    setIsDark(value);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
};
