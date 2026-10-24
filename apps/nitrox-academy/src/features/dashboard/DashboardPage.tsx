import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import { CHAPTERS } from '@/content';
import { pick } from '@/content/localize';
import { useLocale } from '@/app/useLocale';
import { useProgress, type AchievementId } from '@/progress/store';
import { useCourseProgress, useMastery, useNextLesson } from '@/progress/selectors';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Card } from '@/components/ui/Card';
import { LinkButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';
import { ChapterIcon } from '@/components/ChapterIcon';
import { MoleculeField } from '@/simulations/MoleculeField';
import { getTopic } from '@/content';

export function DashboardPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const progress = useCourseProgress();
  const mastery = useMastery();
  const next = useNextLesson();
  const achievements = useProgress((s) => s.achievements);
  const completed = useProgress((s) => s.lessonsCompleted);
  const started = progress.done > 0 || mastery.topics.some((m) => m.attempts > 0);
  const unlocked = (Object.entries(achievements) as [AchievementId, number][]).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero */}
      <section className="card relative overflow-hidden p-6 md:p-10">
        <div className="absolute -end-10 -top-10 opacity-60 pointer-events-none hidden sm:block" aria-hidden>
          <MoleculeField fo2={0.32} size={260} />
        </div>
        <div className="relative max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent mb-3">{started ? t('dashboard.greeting') : t('dashboard.greetingNew')}</div>
          <h1 className="text-3xl md:text-5xl text-ink leading-[1.05]">
            {t('dashboard.heroTitle')}
            <br />
            <span className="text-accent">{t('dashboard.heroTitle2')}</span>
          </h1>
          <p className="mt-4 text-ink-2 md:text-lg max-w-prose">{t('dashboard.heroBody')}</p>
          <div className="mt-6 flex flex-wrap gap-3 items-center">
            {next ? (
              <LinkButton to={`/learn/${next.chapter.id}/${next.lesson.id}`} size="lg">
                <Icon name="play" size={18} /> {started ? t('dashboard.continueLearning') : t('dashboard.startLearning')}
              </LinkButton>
            ) : (
              <LinkButton to="/practice" size="lg">
                <Icon name="target" size={18} /> {t('dashboard.practice')}
              </LinkButton>
            )}
            <LinkButton to="/lab" variant="secondary" size="lg">
              <Icon name="flask" size={18} /> {t('nav.lab')}
            </LinkButton>
          </div>
          {next && (
            <div className="mt-4 text-sm text-muted">
              {t('dashboard.upNext')}: <span className="text-ink-2 font-medium">{t('common.chapter', { n: next.chapter.number })} · {pick(next.lesson.title, locale)}</span>
            </div>
          )}
        </div>
      </section>

      <Callout variant="insight" title={t('dashboard.storyTitle')}>
        {t('dashboard.storyBody')}
      </Callout>

      {/* Stats row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-start gap-4">
          <ProgressRing value={progress.fraction} size={72} stroke={8} className="shrink-0">
            <span className="readout text-base font-bold text-ink">{Math.round(progress.fraction * 100)}%</span>
          </ProgressRing>
          <div className="min-w-0">
            <div className="font-semibold text-ink">{t('dashboard.progress')}</div>
            <div className="text-sm text-muted">{t('dashboard.lessonsDone', { done: progress.done, total: progress.total })}</div>
          </div>
        </Card>
        <Card className="flex items-start gap-4">
          <ProgressRing value={mastery.overall ?? 0} size={72} stroke={8} color="var(--o2)" className="shrink-0">
            <span className="readout text-base font-bold text-ink">{mastery.overall === null ? '—' : `${Math.round(mastery.overall * 100)}%`}</span>
          </ProgressRing>
          <div className="min-w-0">
            <div className="font-semibold text-ink">{t('dashboard.mastery')}</div>
            <div className="text-sm text-muted">{mastery.overall === null ? t('dashboard.masteryEmpty') : `${mastery.topics.filter((m) => m.level === 'mastered').length}/${mastery.topics.length} ${t('mastery.mastered').toLowerCase()}`}</div>
          </div>
        </Card>
        <Card>
          <div className="font-semibold text-ink mb-2 flex items-center gap-2">
            <Icon name="alert" size={18} className="text-warn" /> {t('dashboard.weakAreas')}
          </div>
          {mastery.weak.length === 0 ? (
            <p className="text-sm text-muted">{t('dashboard.weakAreasEmpty')}</p>
          ) : (
            <ul className="space-y-1.5">
              {mastery.weak.slice(0, 3).map((m) => (
                <li key={m.topic} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-ink-2 truncate">{pick(getTopic(m.topic)?.title, locale) ?? m.topic}</span>
                  <Badge tone={m.level === 'weak' ? 'danger' : 'warn'}>{Math.round((m.score ?? 0) * 100)}%</Badge>
                </li>
              ))}
            </ul>
          )}
          {mastery.due.length > 0 && (
            <Link to="/practice" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
              {t('dashboard.reviewDue', { count: mastery.due.length })} <Icon name="arrow" size={16} className="rtl:-scale-x-100" />
            </Link>
          )}
        </Card>
        <Card>
          <div className="font-semibold text-ink mb-2 flex items-center gap-2">
            <Icon name="trophy" size={18} className="text-o2" /> {t('dashboard.achievements')}
          </div>
          {unlocked.length === 0 ? (
            <p className="text-sm text-muted">{t('dashboard.achievementsEmpty')}</p>
          ) : (
            <ul className="space-y-1.5">
              {unlocked.map(([id]) => (
                <li key={id} className="text-sm">
                  <span className="font-medium text-ink">{t(`achievements.${id}.title`)}</span>
                  <span className="text-muted"> · {t(`achievements.${id}.body`)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      {/* Lab + practice */}
      <section className="grid gap-4 md:grid-cols-2">
        <Link to="/lab" className="card group p-6 flex items-center gap-5 hover:border-accent/50 transition-colors">
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-accent-soft text-accent shrink-0">
            <Icon name="flask" size={28} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-lg text-ink">{t('dashboard.openLab')}</div>
            <p className="text-sm text-ink-2">{t('dashboard.labBlurb')}</p>
          </div>
          <Icon name="chevron" className="ms-auto text-muted group-hover:text-accent rtl:-scale-x-100" />
        </Link>
        <Link to="/practice" className="card group p-6 flex items-center gap-5 hover:border-o2/50 transition-colors">
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-o2-soft text-o2 shrink-0">
            <Icon name="target" size={28} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-lg text-ink">{t('dashboard.practice')}</div>
            <p className="text-sm text-ink-2">{t('dashboard.practiceBlurb')}</p>
          </div>
          <Icon name="chevron" className="ms-auto text-muted group-hover:text-o2 rtl:-scale-x-100" />
        </Link>
      </section>

      {/* Chapters */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xl text-ink">{t('dashboard.chaptersTitle')}</h2>
          <Link to="/learn" className="text-sm font-medium text-accent">
            {t('learn.title')}
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {CHAPTERS.map((c) => {
            const done = c.lessons.filter((l) => completed[l.id]).length;
            const available = c.status === 'available';
            return (
              <Link
                key={c.id}
                to={`/learn/${c.id}`}
                className={clsx('card-flat p-4 flex flex-col gap-2 transition-colors hover:border-accent/50', !available && 'opacity-70')}
              >
                <div className="flex items-center justify-between">
                  <span className={clsx('grid place-items-center w-9 h-9 rounded-xl', available ? 'bg-accent-soft text-accent' : 'bg-surface-3 text-muted')}>
                    <ChapterIcon icon={c.icon} size={20} />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t('common.chapter', { n: c.number })}</span>
                </div>
                <div className="font-semibold text-ink leading-snug">{pick(c.title, locale)}</div>
                {available ? (
                  <div className="mt-auto h-1.5 rounded-full bg-surface-3 overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${c.lessons.length ? (done / c.lessons.length) * 100 : 0}%` }} />
                  </div>
                ) : (
                  <Badge className="mt-auto self-start">{t('common.comingSoon')}</Badge>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="text-xs text-muted max-w-3xl space-y-1">
        <p>{t('dashboard.disclaimer')}</p>
        <p>{t('legal.footer')}</p>
        <p>
          <a href="https://edenguy.github.io" rel="author" className="hover:text-ink">
            {t('dashboard.credit')}
          </a>{' '}
          · <Link to="/about" className="hover:text-ink">{t('nav.about')}</Link>
        </p>
      </footer>
    </div>
  );
}
