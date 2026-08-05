import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Sun/moon icon button — used in both the public Header and the dashboard
// Topbar. Persists via ThemeContext (localStorage), so it stays in sync
// wherever it's rendered.
export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={`theme-toggle${className ? ` ${className}` : ''}`}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}
