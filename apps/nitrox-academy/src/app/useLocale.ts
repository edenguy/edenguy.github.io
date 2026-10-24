import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useProgress } from '@/progress/store';
import { applyLocaleToDocument, localeDir } from '@/i18n';
import type { Locale } from '@/content/localize';

/** Keeps i18next and <html lang/dir> in sync with the stored locale. */
export function useLocaleSync(): void {
  const locale = useProgress((s) => s.settings.locale);
  const { i18n } = useTranslation();
  useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
    applyLocaleToDocument(locale);
  }, [locale, i18n]);
}

export function useLocale(): { locale: Locale; dir: 'ltr' | 'rtl'; isRtl: boolean } {
  const locale = useProgress((s) => s.settings.locale);
  const dir = localeDir(locale);
  return { locale, dir, isRtl: dir === 'rtl' };
}
