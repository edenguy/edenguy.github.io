import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { CHAPTERS } from '@/content';
import { pick } from '@/content/localize';
import { useLocale } from '@/app/useLocale';
import { useProgress } from '@/progress/store';
import { SectionTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ChapterIcon } from '@/components/ChapterIcon';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Icon } from '@/components/ui/Icon';

export function CurriculumPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const completed = useProgress((s) => s.lessonsCompleted);
  const assessments = useProgress((s) => s.assessments);
  return (
    <div className="space-y-6">
      <SectionTitle eyebrow={t('nav.learn')} title={t('learn.title')} body={t('learn.subtitle')} />
      <ol className="relative space-y-3">
        {CHAPTERS.map((c) => {
          const available = c.status === 'available';
          const done = c.lessons.filter((l) => completed[l.id]).length;
          const passed = assessments.some((a) => a.chapterId === c.id && a.passed);
          const frac = c.lessons.length ? done / c.lessons.length : 0;
          return (
            <li key={c.id}>
              <Link to={`/learn/${c.id}`} className={clsx('card p-4 md:p-5 flex items-center gap-4 hover:border-accent/50 transition-colors', !available && 'opacity-75')}>
                {available ? (
                  <ProgressRing value={frac} size={56} stroke={6} color={passed ? 'var(--safe)' : 'var(--accent)'}>
                    <ChapterIcon icon={c.icon} size={20} className={passed ? 'text-safe' : 'text-accent'} />
                  </ProgressRing>
                ) : (
                  <span className="grid place-items-center w-14 h-14 rounded-full bg-surface-3 text-muted">
                    <Icon name="lock" size={20} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{t('common.chapter', { n: c.number })}</div>
                  <div className="font-semibold text-lg text-ink leading-snug">{pick(c.title, locale)}</div>
                  <div className="text-sm text-ink-2 truncate">{pick(c.tagline, locale)}</div>
                  <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-muted">
                    {available ? (
                      <>
                        <span>{t('common.lessons', { count: c.lessons.length })}</span>
                        <span>·</span>
                        <span>{t('learn.progressLabel', { done, total: c.lessons.length })}</span>
                        {passed && <Badge tone="safe">{t('learn.passed')}</Badge>}
                      </>
                    ) : (
                      <Badge>{t('common.comingSoon')}</Badge>
                    )}
                  </div>
                </div>
                <Icon name="chevron" className="text-muted rtl:-scale-x-100 shrink-0" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
