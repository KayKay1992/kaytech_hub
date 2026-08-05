import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

// Keep in sync with the anti-flash inline script in index.html.
const STORAGE_KEY = 'kaytech_theme';

const getSystemPreference = () =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export function ThemeProvider({ children }) {
  // index.html's inline script already set data-theme on <html> before
  // React mounted (avoids a flash of the wrong theme) — read it back as
  // the initial state instead of recomputing.
  const [theme, setTheme] = useState(() => {
    const attr = document.documentElement.getAttribute('data-theme');
    return attr === 'dark' || attr === 'light' ? attr : getSystemPreference();
  });

  // Only follow live OS scheme changes when the user hasn't made an
  // explicit choice — once they toggle, that choice sticks.
  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setTheme(e.matches ? 'dark' : 'light');
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
