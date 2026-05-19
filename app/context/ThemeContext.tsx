"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getItemSync, setItemSync } from "@/utils/storage";

type Theme = "light" | "dark";
const THEME_KEY = "bohri_theme";

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const v = getItemSync(THEME_KEY);
    return v === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, _setTheme] = useState<Theme>("light");

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = getStoredTheme();
    _setTheme(stored);
    applyTheme(stored);
  }, []);

  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // Update meta theme-color for PWA
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", t === "dark" ? "#0f172a" : "#F59E0B");
    }
  };

  const setTheme = useCallback((t: Theme) => {
    _setTheme(t);
    applyTheme(t);
    try { setItemSync(THEME_KEY, t); } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === "dark", toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
