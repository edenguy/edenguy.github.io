import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useProgress } from '@/progress/store';
import { Logo } from '@/components/Logo';
import { Icon } from '@/components/ui/Icon';

/**
 * Holds the first paint until persisted progress has loaded from IndexedDB, so a returning
 * learner never sees a flash of "0%", and no action can run before hydration and overwrite
 * stored progress with an empty snapshot.
 *
 * Routes are never rendered un-hydrated. If storage throws (blocked private mode, quota),
 * the store marks hydration as failed and the app renders with a warning that nothing will
 * be saved. If storage is merely slow, the launch screen says so after a few seconds.
 */
export function HydrationGate({ children }: { children: ReactNode }) {
  const hydrated = useProgress((s) => s.hydrated);
  const storageError = useProgress((s) => s.storageError);
  const { t } = useTranslation();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (hydrated) return;
    const id = window.setTimeout(() => setSlow(true), 4000);
    return () => window.clearTimeout(id);
  }, [hydrated]);

  if (!hydrated) {
    return (
      <div className="min-h-dvh grid place-items-center px-6" aria-busy="true" aria-live="polite">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="relative">
            <span className="absolute inset-0 rounded-[18px] bg-accent/30 anim-pulse-ring" aria-hidden />
            <Logo size={64} />
          </div>
          <div className="font-display font-semibold text-ink">{t('app.name')}</div>
          {slow && <p className="text-sm text-muted max-w-xs">{t('storage.slow')}</p>}
        </div>
      </div>
    );
  }
  return (
    <>
      {storageError && (
        <div role="alert" className="sticky top-0 z-40 bg-warn-soft border-b border-warn/40 text-ink text-sm px-4 py-2 flex items-center gap-2">
          <Icon name="alert" size={16} className="text-warn shrink-0" /> {t('storage.unavailable')}
        </div>
      )}
      {children}
    </>
  );
}
