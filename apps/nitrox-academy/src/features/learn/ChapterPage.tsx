import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { getChapter } from '@/content';
import { pick } from '@/content/localize';
import { useLocale } from '@/app/useLocale';
import { useProgress } from '@/progress/store';
import { useChapterProgress } from '@/progress/selectors';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icon } from '@/components/ui/Icon';
import { LinkButton } from '@/components/ui/Button';
import { ChapterIcon } from '@/components/ChapterIcon';
import { Callout } from '@/components/ui/Callout';

export function ChapterPage() {
  const { chapterId } = useParams();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const chapter = getChapter(chapterId);
  const completed = useProgress((s) => s.lessonsCompleted);
  const progress = useChapterProgress(chapterId ?? '');
  if (!chapter) return <Navigate to="/learn" replace />;
  const available = chapter.status === 'available';
  const nextLesson = chapter.lessons.find((l) => !completed[l.id]);

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/learn" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <Icon name="chevron" size={16} className="rotate-180 rtl:rotate-0" /> {t('learn.title')}
      </Link>
      <header className="flex items-start gap-4">
        <span className="grid place-items-center w-14 h-14 rounded-2xl bg-accent-soft text-accent shrink-0">
          <ChapterIcon icon={chapter.icon} size={26} />
        </span>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{t('common.chapter', { n: chapter.number })}</div>
          <h1 className="text-2xl md:text-4xl text-ink">{pick(chapter.title, locale)}</h1>
          <p className="text-ink-2 mt-2">{pick(chapter.description, locale)}</p>
        </div>
      </header>

      {!available && <Callout variant="info">{t('learn.comingSoonBody')}</Callout>}

      {chapter.objectives.length > 0 && (
        <Card flat>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent mb-2">{t('common.objectives')}</div>
          <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-[15px] text-ink-2">
            {chapter.objectives.map((o, i) => (
              <li key={i} className="flex gap-2">
                <Icon name="check" size={16} className="text-accent mt-1 shrink-0" /> {pick(o, locale)}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {available && (
        <>
          {nextLesson && (
            <LinkButton to={`/learn/${chapter.id}/${nextLesson.id}`} size="lg">
              <Icon name="play" size={18} /> {progress.done === 0 ? t('common.start') : t('common.continue')}
            </LinkButton>
          )}
          <ol className="space-y-2.5">
            {chapter.lessons.map((l, i) => {
              const done = !!completed[l.id];
              return (
                <li key={l.id}>
                  <Link to={`/learn/${chapter.id}/${l.id}`} className="card p-4 flex items-center gap-4 hover:border-accent/50 transition-colors">
                    <span className={clsx('grid place-items-center w-9 h-9 rounded-full text-sm font-bold shrink-0', done ? 'bg-safe text-white' : 'bg-surface-3 text-ink-2')}>
                      {done ? <Icon name="check" size={18} /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink">{pick(l.title, locale)}</div>
                      <div className="text-sm text-ink-2 line-clamp-2">{pick(l.summary, locale)}</div>
                    </div>
                    <span className="text-xs text-muted shrink-0">{t('learn.readingTime', { count: l.estimatedMinutes })}</span>
                  </Link>
                </li>
              );
            })}
          </ol>

          <Card className={clsx('flex flex-wrap items-center gap-4', progress.allLessonsDone ? 'border-accent/50' : '')}>
            <span className={clsx('grid place-items-center w-12 h-12 rounded-2xl shrink-0', progress.passed ? 'bg-safe-soft text-safe' : 'bg-o2-soft text-o2')}>
              <Icon name="trophy" size={24} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-ink flex items-center gap-2">
                {t('learn.assessment')} {progress.passed && <Badge tone="safe">{t('learn.passed')}</Badge>}
              </div>
              <div className="text-sm text-ink-2">
                {t('learn.assessmentBlurb', { count: chapter.assessment.questionIds.length, pass: Math.round(chapter.assessment.passScore * 100) })}
                {progress.best !== null && (
                  <>
                    {' '}
                    · {t('learn.bestScore')}: <span className="readout font-semibold">{Math.round(progress.best * 100)}%</span>
                  </>
                )}
              </div>
              {!progress.allLessonsDone && <div className="text-xs text-muted mt-1">{t('learn.assessmentLocked')}</div>}
            </div>
            {progress.allLessonsDone ? (
              <LinkButton to={`/learn/${chapter.id}/assessment`} variant={progress.passed ? 'secondary' : 'primary'}>
                {progress.passed ? t('common.retake') : t('learn.startAssessment')}
              </LinkButton>
            ) : (
              <Icon name="lock" className="text-muted" />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
