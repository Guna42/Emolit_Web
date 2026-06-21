import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';

const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`theme-toggle-btn ${isDark ? 'theme-toggle-dark' : 'theme-toggle-light'} ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      <div className="theme-toggle-thumb">
        {isDark ? <Moon size={12} /> : <Sun size={12} />}
      </div>
    </button>
  );
};

export default ThemeToggle;
