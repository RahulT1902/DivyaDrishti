import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LanguageContextType {
  isHindi: boolean;
  toggleLanguage: () => void;
  lang: 'en' | 'hi';
  /** Backend mode string used by the predictions API (same mapping as the web app). */
  mode: 'SIMPLE_ENGLISH' | 'PANDIT';
  /** Pick the string for the current language. */
  t: (en: string, hi: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  isHindi: false,
  toggleLanguage: () => {},
  lang: 'en',
  mode: 'SIMPLE_ENGLISH',
  t: (en) => en,
});

const STORAGE_KEY = 'divya:language';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [isHindi, setIsHindi] = useState(false);

  // Remember the choice across launches, like the web app does with localStorage.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(v => { if (v === 'hi') setIsHindi(true); })
      .catch(() => {});
  }, []);

  const toggleLanguage = () => {
    setIsHindi(prev => {
      AsyncStorage.setItem(STORAGE_KEY, prev ? 'en' : 'hi').catch(() => {});
      return !prev;
    });
  };

  return (
    <LanguageContext.Provider
      value={{
        isHindi,
        toggleLanguage,
        lang: isHindi ? 'hi' : 'en',
        mode: isHindi ? 'PANDIT' : 'SIMPLE_ENGLISH',
        t: (en, hi) => (isHindi ? hi : en),
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
