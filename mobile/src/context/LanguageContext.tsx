import React, { createContext, useContext, useState } from 'react';

interface LanguageContextType {
  isHindi: boolean;
  toggleLanguage: () => void;
  lang: 'en' | 'hi';
}

const LanguageContext = createContext<LanguageContextType>({
  isHindi: false,
  toggleLanguage: () => {},
  lang: 'en',
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [isHindi, setIsHindi] = useState(false);

  const toggleLanguage = () => {
    setIsHindi(prev => !prev);
  };

  return (
    <LanguageContext.Provider
      value={{
        isHindi,
        toggleLanguage,
        lang: isHindi ? 'hi' : 'en',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
