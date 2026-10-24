import { useEffect } from 'react';
import { useProgress, type ThemePreference } from '@/progress/store';

export type ResolvedTheme = 'light' | 'dark';

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'light' || pref === 'dark') return pref;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function apply(theme: ResolvedTheme) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]:not([media])');
  const color = theme === 'dark' ? '#050b16' : '#eef4fa';
  if (meta) meta.setAttribute('content', color);
  else {
    const m = document.createElement('meta');
    m.name = 'theme-color';
    m.content = color;
    document.head.appendChild(m);
  }
}

/** Keeps <html data-theme> in sync with the preference and the OS. */
export function useThemeSync(): void {
  const pref = useProgress((s) => s.settings.theme);
  useEffect(() => {
    apply(resolveTheme(pref));
    try {
      if (pref === 'system') localStorage.removeItem('nitrox:theme');
      else localStorage.setItem('nitrox:theme', pref);
    } catch {
      /* ignore */
    }
    if (pref !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => apply(resolveTheme('system'));
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);
}
