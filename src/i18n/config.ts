/**
 * i18n configuration — Thai (default) + English.
 * Initialized in main.tsx before App mount.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import thCommon from './locales/th/common.json';
import enCommon from './locales/en/common.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'th',
    supportedLngs: ['th', 'en'],
    defaultNS: 'common',
    ns: ['common'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'kampai_lang',
    },
    resources: {
      th: { common: thCommon },
      en: { common: enCommon },
    },
  });

export default i18n;
