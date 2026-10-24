import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import he from './locales/he.json';
import type { Locale } from '@/content/localize';

export const LOCALES: { code: Locale; label: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'he', label: 'עברית', dir: 'rtl' },
];

export function localeDir(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'he' ? 'rtl' : 'ltr';
}

/** Hebrew is the product's default language; English is an explicit opt-in. */
export const DEFAULT_LOCALE: Locale = 'he';

export function readStoredLocale(): Locale {
  try {
    const l = localStorage.getItem('nitrox:locale');
    if (l === 'he' || l === 'en') return l;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

export function applyLocaleToDocument(locale: Locale): void {
  document.documentElement.lang = locale;
  document.documentElement.dir = localeDir(locale);
  try {
    localStorage.setItem('nitrox:locale', locale);
  } catch {
    /* ignore */
  }
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, he: { translation: he } },
  lng: readStoredLocale(),
  // English carries the full string set, so it is the fallback for any missing key.
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export default i18n;
