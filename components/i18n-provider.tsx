'use client';

import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next from '@/lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language');
    const supportedLangs = ['en', 'hi', 'hinglish', 'es'];

    if (savedLang && supportedLangs.includes(savedLang)) {
      i18next.changeLanguage(savedLang).then(() => {
        document.documentElement.lang = savedLang;
        document.documentElement.dir = i18next.dir(savedLang);
      });
    } else {
      const browserLang = navigator.language.split('-')[0];
      const defaultLang = supportedLangs.includes(browserLang) ? browserLang : 'en';
      i18next.changeLanguage(defaultLang).then(() => {
        document.documentElement.lang = defaultLang;
        document.documentElement.dir = i18next.dir(defaultLang);
      });
      localStorage.setItem('app_language', defaultLang);
    }
    setIsInitialized(true);
  }, []);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
