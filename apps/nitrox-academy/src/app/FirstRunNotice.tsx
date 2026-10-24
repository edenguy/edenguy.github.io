import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useProgress } from '@/progress/store';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

type Step = 'story' | 'legal';

/**
 * Shown once, before anything else: first the origin story (why the site exists), then the
 * legal acknowledgement. The learner must reach the end and acknowledge that the site is a
 * free study tool and that diving decisions are their own responsibility before either step
 * can be dismissed. The acknowledgement is stored with their progress (and travels with a
 * backup).
 */
export function FirstRunNotice() {
  const { t } = useTranslation();
  const acknowledgedAt = useProgress((s) => s.acknowledgedAt);
  const acknowledge = useProgress((s) => s.acknowledge);
  const [step, setStep] = useState<Step>('story');
  if (acknowledgedAt) return null;

  return (
    <div className="fixed inset-0 z-[60] grid place-items-end md:place-items-center bg-bg/70 backdrop-blur-sm p-0 md:p-6" role="dialog" aria-modal="true" aria-labelledby="firstrun-title">
      <div className="card w-full md:max-w-lg max-h-[92dvh] overflow-y-auto rounded-b-none md:rounded-b-[var(--radius)] p-6 md:p-8 space-y-4 pb-safe">
        <div className="flex items-center gap-3">
          <Logo size={40} />
          <h1 id="firstrun-title" className="text-xl md:text-2xl text-ink">
            {step === 'story' ? t('dashboard.storyTitle') : t('legal.title')}
          </h1>
        </div>

        {step === 'story' ? (
          <>
            <div className="space-y-2.5 text-ink-2 text-[15px]">
              {(t('dashboard.storyBody', { returnObjects: true }) as string[]).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <p className="text-sm text-muted">{t('dashboard.credit')}</p>
            <div className="flex items-center justify-center gap-1.5 pt-1" aria-hidden>
              <span className="h-1.5 w-5 rounded-full bg-accent" />
              <span className="h-1.5 w-5 rounded-full bg-surface-3" />
            </div>
            <div className="flex pt-2">
              <Button size="lg" className="w-full sm:w-auto sm:ms-auto" onClick={() => setStep('legal')}>
                {t('common.continue')} <Icon name="arrow" size={18} className="rtl:-scale-x-100" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-ink-2 text-[15px]">{t('legal.intro')}</p>
            <ul className="space-y-2.5">
              {(['p1', 'p2', 'p3', 'p4'] as const).map((k) => (
                <li key={k} className="flex gap-3 text-[15px] text-ink">
                  <Icon name={k === 'p4' ? 'shield' : 'check'} size={18} className={k === 'p4' ? 'text-danger shrink-0 mt-0.5' : 'text-accent shrink-0 mt-0.5'} />
                  <span className={k === 'p4' ? 'font-medium' : undefined}>{t(`legal.${k}`)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-center gap-1.5 pt-1" aria-hidden>
              <span className="h-1.5 w-5 rounded-full bg-surface-3" />
              <span className="h-1.5 w-5 rounded-full bg-accent" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
              <Button variant="secondary" onClick={() => setStep('story')}>
                <Icon name="arrow" size={18} className="rotate-180 rtl:rotate-0" /> {t('common.back')}
              </Button>
              <Button size="lg" onClick={acknowledge}>
                <Icon name="check" size={18} /> {t('legal.accept')}
              </Button>
              <Link to="/about" className="text-sm font-medium text-accent text-center sm:ms-auto">
                {t('legal.readMore')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
