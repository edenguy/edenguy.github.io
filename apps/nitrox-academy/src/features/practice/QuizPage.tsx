import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QUESTIONS, availableChapters, getQuestion, questionsForChapters, questionsForTopic, seededShuffle } from '@/content';
import { useProgress } from '@/progress/store';
import { dueForReview } from '@/assessment/mastery';
import { QuestionCard } from '@/features/learn/QuestionCard';
import { Button, LinkButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Callout } from '@/components/ui/Callout';

export function QuizPage() {
  const [params] = useSearchParams();
  const mode = params.get('mode') ?? 'quick';
  const topic = params.get('topic') ?? '';
  // Remount the runner when the quiz identity changes so index and results never leak across.
  return <QuizRunner key={`${mode}:${topic}`} mode={mode} topic={topic} />;
}

function QuizRunner({ mode, topic }: { mode: string; topic: string }) {
  const { t } = useTranslation();
  const attempts = useProgress((s) => s.attempts);
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const [seed] = useState(() => Date.now());

  const questions = useMemo(() => {
    if (mode === 'review') {
      return dueForReview(attempts)
        .map((d) => getQuestion(d.questionId))
        .filter((q): q is NonNullable<typeof q> => !!q)
        .slice(0, 10);
    }
    if (mode === 'topic') return seededShuffle(questionsForTopic(topic), seed).slice(0, 10);
    const pool = questionsForChapters(availableChapters().map((c) => c.id));
    return seededShuffle(pool.length ? pool : QUESTIONS, seed).slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, topic, seed]);

  const [i, setI] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [answered, setAnswered] = useState(false);
  const done = questions.length === 0 || i >= questions.length;
  const q = questions[i];
  const correct = results.filter(Boolean).length;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 pt-safe bg-bg/85 backdrop-blur-xl border-b border-line">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/practice" className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
            <Icon name="x" size={18} /> <span className="hidden sm:inline">{t('learn.exit')}</span>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted truncate">{t(mode === 'review' ? 'practice.review' : mode === 'topic' ? 'practice.byTopic' : 'practice.quick')}</div>
            <div className="flex gap-1 mt-1">
              {questions.map((_, idx) => (
                <span key={idx} className={'h-1.5 flex-1 rounded-full ' + (results[idx] === undefined ? (idx === i ? 'bg-accent/50' : 'bg-surface-3') : results[idx] ? 'bg-safe' : 'bg-danger')} />
              ))}
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
        {!done && q ? (
          <>
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              total={questions.length}
              onAnswered={({ correct: c }) => {
                setAnswered(true);
                setResults((r) => [...r, c]);
                recordAttempt({ questionId: q.id, topic: q.topic, correct: c, at: Date.now(), context: mode === 'review' ? 'review' : 'practice' });
              }}
            />
            <div className="mt-5 flex justify-end">
              <Button
                size="lg"
                disabled={!answered}
                onClick={() => {
                  setI(i + 1);
                  setAnswered(false);
                }}
              >
                {i + 1 >= questions.length ? t('common.finish') : t('common.next')} <Icon name="arrow" size={18} className="rtl:-scale-x-100" />
              </Button>
            </div>
          </>
        ) : (
          <div className="card p-6 md:p-10 text-center space-y-6">
            {questions.length > 0 ? (
              <>
                <ProgressRing value={correct / questions.length} size={150} stroke={12} color="var(--accent)" className="mx-auto">
                  <div>
                    <div className="readout text-4xl font-bold text-ink">{Math.round((correct / questions.length) * 100)}%</div>
                    <div className="text-xs text-muted">{t('practice.accuracy')}</div>
                  </div>
                </ProgressRing>
                <h1 className="text-2xl text-ink">{t('practice.summaryTitle')}</h1>
              </>
            ) : (
              <p className="text-ink-2">{t('practice.nothingDue')}</p>
            )}
            <Callout variant="standard">{t('practice.disclaimer')}</Callout>
            <LinkButton to="/practice">{t('common.back')}</LinkButton>
          </div>
        )}
      </div>
    </div>
  );
}
