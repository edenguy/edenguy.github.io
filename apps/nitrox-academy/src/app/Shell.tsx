import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { useEffect } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Logo } from '@/components/Logo';
import { useProgress, type ThemePreference } from '@/progress/store';
import { useThemeSync } from './useTheme';
import { useLocaleSync } from './useLocale';
import { PwaUpdater } from './PwaUpdater';
import { HydrationGate } from './HydrationGate';
import { AchievementToast } from './AchievementToast';
import { PageTransition } from './PageTransition';
import { FirstRunNotice } from './FirstRunNotice';

const NAV: { to: string; key: string; icon: IconName; end?: boolean }[] = [
  { to: '/', key: 'nav.home', icon: 'home', end: true },
  { to: '/learn', key: 'nav.learn', icon: 'book' },
  { to: '/lab', key: 'nav.lab', icon: 'flask' },
  { to: '/practice', key: 'nav.practice', icon: 'target' },
  { to: '/settings', key: 'nav.settings', icon: 'settings' },
];

export function AppProviders({ children }: { children: React.ReactNode }) {
  useThemeSync();
  useLocaleSync();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return (
    <ErrorBoundary>
      <div className="ocean-bg" aria-hidden />
      <HydrationGate>
        {children}
        <AchievementToast />
        <FirstRunNotice />
      </HydrationGate>
      <PwaUpdater />
    </ErrorBoundary>
  );
}

/**
 * Theme cycles system → light → dark → system. "system" is the default and follows the
 * device, including a device that switches to dark at sunset, because the OS media query
 * is watched live (see useThemeSync).
 */
const THEME_CYCLE: Record<ThemePreference, ThemePreference> = { system: 'light', light: 'dark', dark: 'system' };
const THEME_ICON: Record<ThemePreference, IconName> = { system: 'sparkle', light: 'sun', dark: 'moon' };

function QuickToggles({ compact }: { compact?: boolean }) {
  const { t } = useTranslation();
  const locale = useProgress((s) => s.settings.locale);
  const theme = useProgress((s) => s.settings.theme);
  const setLocale = useProgress((s) => s.setLocale);
  const setTheme = useProgress((s) => s.setTheme);
  const themeLabel = t(theme === 'system' ? 'settings.themeSystem' : theme === 'light' ? 'settings.themeLight' : 'settings.themeDark');
  return (
    <div className={clsx('flex items-center gap-1', compact ? '' : 'justify-between')}>
      <button
        type="button"
        onClick={() => setLocale(locale === 'he' ? 'en' : 'he')}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-ink-2 hover:bg-surface-2 hover:text-ink"
        aria-label={t('settings.language')}
      >
        <Icon name="globe" size={18} /> {locale === 'he' ? 'EN' : 'עב'}
      </button>
      <button
        type="button"
        onClick={() => setTheme(THEME_CYCLE[theme])}
        className="inline-flex items-center rounded-full p-2 text-ink-2 hover:bg-surface-2 hover:text-ink"
        aria-label={`${t('settings.theme')}: ${themeLabel}`}
        title={`${t('settings.theme')}: ${themeLabel}`}
      >
        <Icon name={THEME_ICON[theme]} size={18} />
      </button>
    </div>
  );
}

export function Shell() {
  const { t } = useTranslation();
  return (
    <div className="min-h-dvh md:grid md:grid-cols-[240px_1fr]">
      {/* Under a hash router "#content" would be parsed as a route, so focus is moved by hand. */}
      <a
        href="#content"
        onClick={(e) => {
          e.preventDefault();
          const el = document.getElementById('content');
          if (el) {
            el.setAttribute('tabindex', '-1');
            el.focus({ preventScroll: false });
          }
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-50 bg-accent text-accent-ink px-3 py-2 rounded-lg"
      >
        {t('app.skipToContent')}
      </a>
      {/* Sidebar (desktop). The wrapper paints the full column height so the rail does not
          end mid-page on a long document. */}
      <div className="hidden md:block border-e border-line bg-surface/60 backdrop-blur-xl">
      <aside className="flex flex-col sticky top-0 h-dvh px-4 py-6">
        <NavLink to="/" className="flex items-center gap-3 px-2 mb-8">
          <Logo size={36} />
          <div>
            <div className="font-display font-semibold text-ink leading-tight">{t('app.name')}</div>
            <div className="text-[11px] text-muted leading-tight">{t('app.unofficial')}</div>
          </div>
        </NavLink>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors',
                  isActive ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                )
              }
            >
              <Icon name={n.icon} size={20} /> {t(n.key)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3">
          <QuickToggles />
          <NavLink to="/about" className="block text-xs text-muted hover:text-ink px-2">
            {t('nav.about')}
          </NavLink>
        </div>
      </aside>
      </div>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 pt-safe bg-bg/80 backdrop-blur-xl border-b border-line">
        <div className="flex items-center justify-between px-4 h-14">
          <NavLink to="/" className="flex items-center gap-2">
            <Logo size={30} />
            <span className="font-display font-semibold text-ink">{t('app.name')}</span>
          </NavLink>
          <QuickToggles compact />
        </div>
      </header>

      <main id="content" className="min-w-0 px-4 md:px-8 lg:px-12 py-5 md:py-8 pb-28 md:pb-12 max-w-6xl w-full mx-auto">
        <PageTransition />
      </main>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/85 backdrop-blur-xl border-t border-line pb-safe">
        <div className="grid grid-cols-5">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                clsx('flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', isActive ? 'text-accent' : 'text-muted')
              }
            >
              <Icon name={n.icon} size={22} /> {t(n.key)}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

/** Distraction-free layout for lessons and assessments. */
export function FocusShell() {
  return (
    <div className="min-h-dvh">
      <Outlet />
    </div>
  );
}
