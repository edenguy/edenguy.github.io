import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { useProgress, type AchievementId } from '@/progress/store';
import { Icon } from '@/components/ui/Icon';
import { useReducedMotion } from './useReducedMotion';

/**
 * Watches the achievements map and celebrates each newly unlocked one once.
 * Achievements that were already unlocked when the app loaded are not re-announced.
 */
export function AchievementToast() {
  const { t } = useTranslation();
  const achievements = useProgress((s) => s.achievements);
  const hydrated = useProgress((s) => s.hydrated);
  const reduced = useReducedMotion();
  const seen = useRef<Set<string> | null>(null);
  const [queue, setQueue] = useState<AchievementId[]>([]);

  useEffect(() => {
    if (!hydrated) return;
    const ids = Object.keys(achievements) as AchievementId[];
    if (seen.current === null) {
      seen.current = new Set(ids);
      return;
    }
    const fresh = ids.filter((id) => !seen.current!.has(id));
    if (fresh.length) {
      fresh.forEach((id) => seen.current!.add(id));
      setQueue((q) => [...q, ...fresh]);
    }
  }, [achievements, hydrated]);

  const current = queue[0];
  useEffect(() => {
    if (!current) return;
    const id = window.setTimeout(() => setQueue((q) => q.slice(1)), 4200);
    return () => window.clearTimeout(id);
  }, [current]);

  return (
    <div className="fixed top-3 inset-x-3 md:top-6 md:inset-x-auto md:end-6 z-50 pointer-events-none flex justify-center md:justify-end" aria-live="polite">
      <AnimatePresence>
        {current && (
          <motion.div
            key={current}
            initial={reduced ? false : { opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="pointer-events-auto card px-4 py-3 flex items-center gap-3 max-w-sm border-o2/50 shadow-[0_12px_40px_-12px_var(--o2)]"
            role="status"
          >
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-o2-soft text-o2 shrink-0">
              <Icon name="trophy" size={22} />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-o2">{t('dashboard.achievements')}</div>
              <div className="font-semibold text-ink leading-tight">{t(`achievements.${current}.title`)}</div>
              <div className="text-sm text-ink-2">{t(`achievements.${current}.body`)}</div>
            </div>
            <button type="button" onClick={() => setQueue((q) => q.slice(1))} className="ms-auto text-muted hover:text-ink" aria-label={t('common.close')}>
              <Icon name="x" size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
