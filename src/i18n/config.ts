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
    // Critical: react-i18next 17 defaults useSuspense=true which makes
    // useTranslation() throw a Promise (Suspense) until init resolves.
    // Without a Suspense boundary at the right level the whole tree
    // unmounts → blank screen. Disable suspense; useTranslation returns
    // the key as fallback while init is pending (matches our inline-resources
    // pattern where init completes almost instantly anyway).
    react: { useSuspense: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'kampai_lang',
    },
    resources: {
      th: { common: thCommon },
      en: { common: enCommon },
    },
  })
  .catch((e) => console.error('[i18n] init failed (non-fatal):', e));

export default i18n;
