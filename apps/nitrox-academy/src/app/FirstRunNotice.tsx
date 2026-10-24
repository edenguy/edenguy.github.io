import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useProgress } from '@/progress/store';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

/**
 * Shown once, before anything else, until the learner acknowledges that the site is a free
 * study tool and that diving decisions are their own responsibility. The acknowledgement is
 * stored with their progress (and travels with a backup).
 */
export function FirstRunNotice() {
  const { t } = useTranslation();
  const acknowledgedAt = useProgress((s) => s.acknowledgedAt);
  const acknowledge = useProgress((s) => s.acknowledge);
  if (acknowledgedAt) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-end md:place-items-center bg-bg/70 backdrop-blur-sm p-0 md:p-6" role="dialog" aria-modal="true" aria-labelledby="legal-title">
      <div className="card w-full md:max-w-lg max-h-[92dvh] overflow-y-auto rounded-b-none md:rounded-b-[var(--radius)] p-6 md:p-8 space-y-4 pb-safe">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <h1 id="legal-title" className="text-xl md:text-2xl text-ink">
            {t('legal.title')}
          </h1>
        </div>
        <p className="text-ink-2 text-[15px]">{t('legal.intro')}</p>
        <ul className="space-y-2.5">
          {(['p1', 'p2', 'p3', 'p4'] as const).map((k) => (
            <li key={k} className="flex gap-3 text-[15px] text-ink">
              <Icon name={k === 'p4' ? 'shield' : 'check'} size={18} className={k === 'p4' ? 'text-danger shrink-0 mt-0.5' : 'text-accent shrink-0 mt-0.5'} />
              <span className={k === 'p4' ? 'font-medium' : undefined}>{t(`legal.${k}`)}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
          <Button size="lg" onClick={acknowledge}>
            <Icon name="check" size={18} /> {t('legal.accept')}
          </Button>
          <Link to="/about" className="text-sm font-medium text-accent text-center sm:ms-auto">
            {t('legal.readMore')}
          </Link>
        </div>
      </div>
    </div>
  );
}
