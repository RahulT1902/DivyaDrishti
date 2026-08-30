import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'SIMPLE_ENGLISH' | 'PANDIT';

interface LanguageContextType {
  language: AppLanguage;
  isHindi: boolean;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'SIMPLE_ENGLISH',
  isHindi: false,
  setLanguage: () => {},
  toggleLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('SIMPLE_ENGLISH');

  // Load persisted preference on mount
  React.useEffect(() => {
    AsyncStorage.getItem('divya:language').then((saved) => {
      if (saved === 'PANDIT' || saved === 'SIMPLE_ENGLISH') {
        setLanguageState(saved as AppLanguage);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    AsyncStorage.setItem('divya:language', lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === 'SIMPLE_ENGLISH' ? 'PANDIT' : 'SIMPLE_ENGLISH';
      AsyncStorage.setItem('divya:language', next);
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        language,
        isHindi: language === 'PANDIT',
        setLanguage,
        toggleLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
