'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { SupportedLanguage, TranslationDictionary } from '@sai/shared-types';
import { dictionaries, en } from '@/locales';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  isTamil: boolean;
  dict: TranslationDictionary;
  t: (path: string, fallback?: string) => string;
  formatDateLocalized: (date: string | Date | null | undefined) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  isTamil: false,
  dict: en,
  t: (path: string, fallback?: string) => fallback || path,
  formatDateLocalized: () => '',
});

const STORAGE_KEY = 'sai_vault_language_pref';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  // Load persisted language preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (stored === 'en' || stored === 'ta') {
        setLanguageState(stored);
        document.documentElement.lang = stored;
      }
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ta' : 'en');
  };

  const dict = useMemo(() => dictionaries[language] || en, [language]);
  const isTamil = language === 'ta';

  // Nested property resolver: e.g. t('nav.dashboard') => 'முகப்புப்பலகை'
  const t = (path: string, fallback?: string): string => {
    try {
      const parts = path.split('.');
      let current: any = dict;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          // Fallback to English dictionary
          let enCurrent: any = en;
          for (const enPart of parts) {
            if (enCurrent && typeof enCurrent === 'object' && enPart in enCurrent) {
              enCurrent = enCurrent[enPart];
            } else {
              return fallback || path;
            }
          }
          return typeof enCurrent === 'string' ? enCurrent : (fallback || path);
        }
      }
      return typeof current === 'string' ? current : (fallback || path);
    } catch {
      return fallback || path;
    }
  };

  const formatDateLocalized = (date: string | Date | null | undefined): string => {
    if (!date) return '—';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '—';
      return new Intl.DateTimeFormat(isTamil ? 'ta-IN' : 'en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return '—';
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        isTamil,
        dict,
        t,
        formatDateLocalized,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
