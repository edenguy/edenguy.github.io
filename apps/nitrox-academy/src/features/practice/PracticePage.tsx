import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ALL_TOPICS, availableChapters, questionsForChapters, questionsForTopic } from '@/content';
import { pick } from '@/content/localize';
import { useLocale } from '@/app/useLocale';
import { useMastery } from '@/progress/selectors';
import { Card, SectionTitle } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Callout } from '@/components/ui/Callout';

const levelTone = { untested: 'neutral', weak: 'danger', developing: 'warn', solid: 'accent', mastered: 'safe' } as const;

export function PracticePage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const mastery = useMastery();
  const chapters = availableChapters();
  const pool = questionsForChapters(chapters.map((c) => c.id));

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow={t('nav.practice')} title={t('practice.title')} body={t('practice.subtitle')} />
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/practice/quiz?mode=quick" className="card p-5 hover:border-accent/50 transition-colors flex flex-col gap-2">
          <span className="grid place-items-center w-11 h-11 rounded-xl bg-accent-soft text-accent">
            <Icon name="sparkle" size={22} />
          </span>
          <div className="font-semibold text-lg text-ink">{t('practice.quick')}</div>
          <p className="text-sm text-ink-2">{t('practice.quickBlurb')}</p>
          <span className="text-xs text-muted mt-auto">{t('practice.questionsAvailable', { count: pool.length })}</span>
        </Link>
        {mastery.due.length === 0 ? (
          <Card className="flex flex-col gap-2 opacity-70" aria-disabled="true">
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-surface-3 text-muted">
              <Icon name="refresh" size={22} />
            </span>
            <div className="font-semibold text-lg text-ink">{t('practice.review')}</div>
            <p className="text-sm text-ink-2">{t('practice.reviewBlurb')}</p>
            <span className="text-xs text-muted mt-auto">{t('practice.nothingDue')}</span>
          </Card>
        ) : (
          <Link to="/practice/quiz?mode=review" className="card p-5 hover:border-o2/50 transition-colors flex flex-col gap-2">
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-o2-soft text-o2">
              <Icon name="refresh" size={22} />
            </span>
            <div className="font-semibold text-lg text-ink">{t('practice.review')}</div>
            <p className="text-sm text-ink-2">{t('practice.reviewBlurb')}</p>
            <span className="text-xs text-muted mt-auto">{t('dashboard.reviewDue', { count: mastery.due.length })}</span>
          </Link>
        )}
        <Card className="flex flex-col gap-2 opacity-80">
          <span className="grid place-items-center w-11 h-11 rounded-xl bg-surface-3 text-muted">
            <Icon name="clock" size={22} />
          </span>
          <div className="font-semibold text-lg text-ink flex items-center gap-2">
            {t('practice.mock')} <Badge>{t('common.comingSoon')}</Badge>
          </div>
          <p className="text-sm text-ink-2">{t('practice.mockBlurb')}</p>
        </Card>
      </div>

      <section>
        <h2 className="text-xl text-ink mb-3">{t('practice.byTopic')}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {ALL_TOPICS.filter((tp) => chapters.some((c) => c.id === tp.chapterId)).map((tp) => {
            const m = mastery.topics.find((x) => x.topic === tp.id);
            const count = questionsForTopic(tp.id).length;
            return (
              <Link key={tp.id} to={`/practice/quiz?mode=topic&topic=${encodeURIComponent(tp.id)}`} className="card-flat p-4 flex items-center gap-3 hover:border-accent/50 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ink">{pick(tp.title, locale)}</div>
                  <div className="text-xs text-muted">{t('practice.questionsAvailable', { count })}</div>
                </div>
                <Badge tone={levelTone[m?.level ?? 'untested']}>
                  {t(`mastery.${m?.level ?? 'untested'}`)}
                  {m?.score !== null && m?.score !== undefined ? ` · ${Math.round(m.score * 100)}%` : ''}
                </Badge>
              </Link>
            );
          })}
        </div>
      </section>
      <Callout variant="standard">{t('practice.disclaimer')}</Callout>
    </div>
  );
}
