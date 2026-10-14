import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS, THEMES } from '../utils/constants';

export const ThemeContext = createContext(null);

// index.html sets data-theme before first paint; start from that.
function getInitialTheme() {
  return document.documentElement.getAttribute('data-theme') === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT;
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  // Colors are CSS variables keyed off [data-theme] (see styles/variables.css).
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // Storage unavailable; theme still applies for this session.
    }
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((current) => (current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK)),
    [],
  );

  const value = useMemo(
    () => ({ theme, isDark: theme === THEMES.DARK, setTheme, toggleTheme }),
    [theme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
