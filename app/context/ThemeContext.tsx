"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getItemSync, setItemSync } from "@/utils/storage";

type ThemeMode = "light" | "dark" | "auto";
type ResolvedTheme = "light" | "dark";
const THEME_KEY = "bohri_theme";

interface ThemeContextType {
  mode: ThemeMode;
  theme: ResolvedTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (t: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "auto";
  try {
    const v = getItemSync(THEME_KEY);
    if (v === "dark" || v === "light" || v === "auto") return v;
    return "auto";
  } catch {
    return "auto";
  }
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "auto") return getSystemTheme();
  return mode;
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, _setMode] = useState<ThemeMode>("auto");
  const [resolved, setResolved] = useState<ResolvedTheme>("light");

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = getStoredTheme();
    _setMode(stored);
    const r = resolveTheme(stored);
    setResolved(r);
    applyTheme(r);
  }, []);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (mode !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const r: ResolvedTheme = e.matches ? "dark" : "light";
      setResolved(r);
      applyTheme(r);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const applyTheme = (t: ResolvedTheme) => {
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

  const setTheme = useCallback((t: ThemeMode) => {
    _setMode(t);
    const r = resolveTheme(t);
    setResolved(r);
    applyTheme(r);
    try { setItemSync(THEME_KEY, t); } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    // Cycle: light → dark → auto → light
    const next: ThemeMode = mode === "light" ? "dark" : mode === "dark" ? "auto" : "light";
    setTheme(next);
  }, [mode, setTheme]);

  return (
    <ThemeContext.Provider value={{ mode, theme: resolved, isDark: resolved === "dark", toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
