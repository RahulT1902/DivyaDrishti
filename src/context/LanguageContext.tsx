"use client";

/**
 * LanguageContext — Global Language System
 *
 * Single source of truth for language state across the entire DivyaDrishti experience.
 * Phase 1: "en" (English) and "hi" (Hindi/Pandit mode).
 *
 * Design principle:
 *   Language is part of atmosphere — the switch is environmental, not widget-level.
 *   All pages consume this one context; nothing manages its own language state.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export type AppLanguage = "en" | "hi";

// Maps AppLanguage to the backend mode strings used by the predictions API
export const LANG_TO_MODE: Record<AppLanguage, "SIMPLE_ENGLISH" | "PANDIT"> = {
  en: "SIMPLE_ENGLISH",
  hi: "PANDIT",
};

interface LanguageContextValue {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  /** Shorthand: true when language === "hi" */
  isHindi: boolean;
  /** Backend-compatible mode string */
  mode: "SIMPLE_ENGLISH" | "PANDIT";
  /** Pick the correct string based on current language */
  t: (en: string, hi: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "divya:language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as AppLanguage | null;
      if (stored === "en" || stored === "hi") {
        setLanguageState(stored);
      }
    } catch {
      // localStorage unavailable — keep default
    }
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const isHindi = language === "hi";
  const mode = LANG_TO_MODE[language];

  /** Helper: pick the right string for the current language */
  const t = useCallback(
    (en: string, hi: string) => (isHindi ? hi : en),
    [isHindi]
  );

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, isHindi, mode, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

/** Hook — throws if used outside LanguageProvider */
export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
