import { useEffect } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLesson } from '@/content';
import { pick } from '@/content/localize';
import { useLocale } from '@/app/useLocale';
import { useProgress } from '@/progress/store';
import { Button, LinkButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { LessonBlocks } from './LessonBlocks';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { lessonSpeech } from '@/content/speakable';
import { clearScrollResume, useScrollResume } from '@/app/useScrollResume';
import { useReadingProgress } from '@/app/useReadingProgress';

export function LessonPage() {
  const { chapterId, lessonId } = useParams();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const { chapter, lesson, index } = getLesson(chapterId, lessonId);
  const completed = useProgress((s) => s.lessonsCompleted);
  const completeLesson = useProgress((s) => s.completeLesson);
  const visitLesson = useProgress((s) => s.visitLesson);
  const unlock = useProgress((s) => s.unlock);

  useEffect(() => {
    if (chapter && lesson) visitLesson(chapter.id, lesson.id);
  }, [chapter, lesson, visitLesson]);
  useScrollResume(lesson?.id);
  const reading = useReadingProgress();

  if (!chapter || !lesson) return <Navigate to={chapter ? `/learn/${chapter.id}` : '/learn'} replace />;
  const total = chapter.lessons.length;
  const next = chapter.lessons[index + 1];
  const prev = chapter.lessons[index - 1];
  const isDone = !!completed[lesson.id];

  const finish = () => {
    clearScrollResume(lesson.id);
    completeLesson(chapter.id, lesson.id);
    const allDone = chapter.lessons.every((l) => l.id === lesson.id || completed[l.id]);
    if (allDone && chapter.id === 'ch01') unlock('ch01-complete');
    if (allDone && chapter.id === 'ch02') unlock('ch02-complete');
    if (next) navigate(`/learn/${chapter.id}/${next.id}`);
    else navigate(`/learn/${chapter.id}`);
  };

  return (
    <div className="min-h-dvh">
      {/* Focus top bar */}
      <header className="sticky top-0 z-30 pt-safe bg-bg/85 backdrop-blur-xl border-b border-line">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to={`/learn/${chapter.id}`} className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink shrink-0" aria-label={t('learn.backToChapter')}>
            <Icon name="chevron" size={18} className="rotate-180 rtl:rotate-0" />
            <span className="hidden sm:inline">{t('common.chapter', { n: chapter.number })}</span>
          </Link>
          <div className="flex-1 min-w-0">
            {/* The counter is one isolated left-to-right run so "1 / 6" is never reordered. */}
            <div className="text-xs text-muted truncate">
              {t('common.lessonWord')}{' '}
              <bdi dir="ltr" className="num">
                {index + 1} / {total}
              </bdi>
            </div>
            <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden mt-1">
              <div className="h-full bg-accent rounded-full transition-[width] duration-500" style={{ width: `${((index + (isDone ? 1 : 0.15)) / total) * 100}%` }} />
            </div>
          </div>
          <SpeakButton text={lessonSpeech(lesson, locale)} className="shrink-0" label={t('speech.listen')} />
        </div>
        {/* Reading progress: how far through this lesson the learner has scrolled. */}
        <div className="h-0.5 bg-transparent" aria-hidden>
          <div className="h-full bg-accent/70 transition-[width] duration-150" style={{ width: `${reading * 100}%` }} />
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-4 py-8 md:py-12 pb-32">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-accent mb-2">{pick(chapter.title, locale)}</div>
          <h1 className="text-3xl md:text-5xl text-ink leading-[1.08]">{pick(lesson.title, locale)}</h1>
          <p className="mt-3 text-ink-2 md:text-lg">{pick(lesson.summary, locale)}</p>
          {isDone && (
            <Badge tone="safe" className="mt-3">
              <Icon name="check" size={14} /> {t('learn.lessonComplete')}
            </Badge>
          )}
        </div>

        <LessonBlocks lesson={lesson} chapterId={chapter.id} />

        <div className="mt-12 pt-6 border-t border-line flex flex-wrap items-center gap-3">
          {prev ? (
            <LinkButton to={`/learn/${chapter.id}/${prev.id}`} variant="ghost">
              <Icon name="chevron" size={18} className="rotate-180 rtl:rotate-0" /> {t('common.previous')}
            </LinkButton>
          ) : (
            <span />
          )}
          <div className="ms-auto flex items-center gap-3">
            <Button onClick={finish} size="lg">
              {next ? (isDone ? t('learn.nextLesson') : t('learn.markComplete')) : t('common.finish')}
              <Icon name="arrow" size={18} className="rtl:-scale-x-100" />
            </Button>
          </div>
        </div>
        {!next && <p className="mt-4 text-sm text-muted">{t('learn.finishedChapter')}</p>}
      </article>
    </div>
  );
}
