import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from '../locales/en/common.json';
import hiCommon from '../locales/hi/common.json';
import esCommon from '../locales/es/common.json';
import hinglishCommon from '../locales/hinglish/common.json';

i18next
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      hi: { common: hiCommon },
      es: { common: esCommon },
      hinglish: { common: hinglishCommon },
    },
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;
