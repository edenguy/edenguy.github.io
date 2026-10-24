import type { LocalizedString } from './schema';

export type Locale = 'en' | 'he';

export function pick(text: LocalizedString | undefined, locale: Locale): string {
  if (!text) return '';
  return (locale === 'he' ? text.he : undefined) ?? text.en;
}
