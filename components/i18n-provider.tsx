'use client';

import React, { useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next from '@/lib/i18n';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const savedLang = localStorage.getItem('app_language');
      const supportedLangs = ['en', 'hi', 'hinglish', 'es'];
      
      let langToUse = 'en';
      if (savedLang && supportedLangs.includes(savedLang)) {
        langToUse = savedLang;
      } else {
        const browserLang = navigator.language.split('-')[0];
        langToUse = supportedLangs.includes(browserLang) ? browserLang : 'en';
        localStorage.setItem('app_language', langToUse);
      }

      await i18next.changeLanguage(langToUse);
      document.documentElement.lang = langToUse;
      document.documentElement.dir = i18next.dir(langToUse);
      setIsInitialized(true);
    };

    init();
  }, []);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
}
