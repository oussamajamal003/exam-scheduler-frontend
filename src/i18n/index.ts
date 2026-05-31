import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  NAMESPACES,
  getDirForLanguage,
} from './config';

import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import frCommon from './locales/fr/common.json';
import frNav from './locales/fr/nav.json';
import arCommon from './locales/ar/common.json';
import arNav from './locales/ar/nav.json';

export const resources = {
  en: { common: enCommon, nav: enNav, appText: {} },
  fr: { common: frCommon, nav: frNav },
  ar: { common: arCommon, nav: arNav },
} as const;

/** Apply text direction + lang attribute to the document for the active language. */
export const applyDocumentDirection = (language: string): void => {
  if (typeof document === 'undefined') return;
  const dir = getDirForLanguage(language);
  const root = document.documentElement;
  root.setAttribute('dir', dir);
  root.setAttribute('lang', language);
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: ['en', 'fr', 'ar'],
    ns: NAMESPACES as unknown as string[],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    react: { useSuspense: false },
  });

// Keep document direction in sync on boot and on every language change.
applyDocumentDirection(i18n.resolvedLanguage ?? i18n.language ?? DEFAULT_LANGUAGE);
i18n.on('languageChanged', (lng) => {
  applyDocumentDirection(lng);
});

export default i18n;
