/**
 * Centralized i18n configuration.
 *
 * To add a new language in the future:
 *  1. Add its code + metadata to `SUPPORTED_LANGUAGES` below.
 *  2. Create a folder under `src/i18n/locales/<code>/` with the namespace JSON files.
 *  3. Register the resources in `src/i18n/index.ts`.
 *  4. If the language is right-to-left, add its code to `RTL_LANGUAGES`.
 */

export type LanguageCode = 'en' | 'fr' | 'ar';

export type LanguageMeta = {
  code: LanguageCode;
  /** Native display name shown in the switcher. */
  label: string;
  /** Emoji flag used in the switcher. */
  flag: string;
  /** Text direction for the language. */
  dir: 'ltr' | 'rtl';
};

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'en', label: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', label: 'العربية', flag: '🇱🇧', dir: 'rtl' },
];

export const RTL_LANGUAGES: LanguageCode[] = ['ar'];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

/** localStorage key used to persist the selected language across sessions. */
export const LANGUAGE_STORAGE_KEY = 'sis-language';

/** Namespaces registered with i18next. One file per dashboard / module. */
export const NAMESPACES = ['common', 'nav', 'appText'] as const;
export type Namespace = (typeof NAMESPACES)[number];

export const isRtlLanguage = (code: string): boolean =>
  RTL_LANGUAGES.includes(code as LanguageCode);

export const getDirForLanguage = (code: string): 'ltr' | 'rtl' =>
  isRtlLanguage(code) ? 'rtl' : 'ltr';
