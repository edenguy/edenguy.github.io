import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getChapter, getQuestion, getTopic } from '@/content';
import { pick } from '@/content/localize';
import { useLocale } from '@/app/useLocale';
import { useProgress } from '@/progress/store';
import { Button, LinkButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Badge } from '@/components/ui/Badge';
import { QuestionCard } from './QuestionCard';
import { Callout } from '@/components/ui/Callout';

export function AssessmentPage() {
  const { chapterId } = useParams();
  const chapter = getChapter(chapterId);
  if (!chapter) return <Navigate to="/learn" replace />;
  // A chapter without questions yet (roadmap) has nothing to run; send the learner to its page.
  if (chapter.status !== 'available' || chapter.assessment.questionIds.length === 0) return <Navigate to={`/learn/${chapter.id}`} replace />;
  return <AssessmentRunner key={chapter.id} chapterId={chapter.id} />;
}

function AssessmentRunner({ chapterId }: { chapterId: string }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const chapter = getChapter(chapterId)!;
  const questions = useMemo(() => chapter.assessment.questionIds.map((id) => getQuestion(id)!).filter(Boolean), [chapter]);
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const recordAssessment = useProgress((s) => s.recordAssessment);
  const [i, setI] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [answered, setAnswered] = useState(false);
  const [done, setDone] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const q = questions[i]!;
  const correctCount = results.filter(Boolean).length;
  const passed = correctCount / questions.length >= chapter.assessment.passScore;

  const onAnswered = (correct: boolean) => {
    setAnswered(true);
    setResults((r) => [...r, correct]);
    recordAttempt({ questionId: q.id, topic: q.topic, correct, at: Date.now(), context: 'chapter-assessment' });
  };
  const next = () => {
    if (i + 1 >= questions.length) {
      recordAssessment({ chapterId, score: correctCount, total: questions.length, passed, at: Date.now() });
      setDone(true);
      return;
    }
    setI(i + 1);
    setAnswered(false);
  };
  const restart = () => {
    setI(0);
    setResults([]);
    setAnswered(false);
    setDone(false);
    setRunKey((k) => k + 1);
  };

  const weakTopics = useMemo(() => {
    const missed = new Set(questions.filter((_, idx) => results[idx] === false).map((qq) => qq.topic));
    return [...missed];
  }, [questions, results]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 pt-safe bg-bg/85 backdrop-blur-xl border-b border-line">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to={`/learn/${chapterId}`} className="inline-flex items-center gap-1 text-sm text-ink-2 hover:text-ink">
            <Icon name="x" size={18} /> <span className="hidden sm:inline">{t('learn.exit')}</span>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted truncate">{t('learn.assessment')} · {pick(chapter.title, locale)}</div>
            <div className="flex gap-1 mt-1">
              {questions.map((_, idx) => (
                <span
                  key={idx}
                  className={
                    'h-1.5 flex-1 rounded-full ' +
                    (results[idx] === undefined ? (idx === i && !done ? 'bg-accent/50' : 'bg-surface-3') : results[idx] ? 'bg-safe' : 'bg-danger')
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 pb-32">
        {!done ? (
          <>
            <QuestionCard key={`${runKey}-${q.id}`} question={q} index={i} total={questions.length} onAnswered={({ correct }) => onAnswered(correct)} />
            <div className="mt-5 flex justify-end">
              <Button onClick={next} disabled={!answered} size="lg">
                {i + 1 >= questions.length ? t('common.finish') : t('common.next')} <Icon name="arrow" size={18} className="rtl:-scale-x-100" />
              </Button>
            </div>
          </>
        ) : (
          <div className="card p-6 md:p-10 text-center space-y-6">
            <ProgressRing value={correctCount / questions.length} size={150} stroke={12} color={passed ? 'var(--safe)' : 'var(--warn)'} className="mx-auto">
              <div>
                <div className="readout text-4xl font-bold text-ink">{Math.round((correctCount / questions.length) * 100)}%</div>
                <div className="text-xs text-muted">
                  {correctCount}/{questions.length}
                </div>
              </div>
            </ProgressRing>
            <div>
              <Badge tone={passed ? 'safe' : 'warn'} className="text-sm px-3 py-1 mb-3">
                {passed ? t('learn.passed') : t('learn.notPassed')}
              </Badge>
              <h1 className="text-2xl md:text-3xl text-ink">{t('learn.resultsTitle')}</h1>
              <p className="text-ink-2 mt-2 max-w-prose mx-auto">{passed ? t('learn.resultsPass') : t('learn.resultsFail')}</p>
            </div>
            {weakTopics.length > 0 && (
              <div className="text-start rounded-2xl border border-line bg-surface-2 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted mb-2">{t('learn.topicsToReview')}</div>
                <div className="flex flex-wrap gap-2">
                  {weakTopics.map((tp) => (
                    <Badge key={tp} tone="warn">
                      {pick(getTopic(tp)?.title, locale) || tp}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <Callout variant="standard">{t('practice.disclaimer')}</Callout>
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="secondary" onClick={restart}>
                <Icon name="refresh" size={18} /> {t('common.retake')}
              </Button>
              <LinkButton to={`/learn/${chapterId}`}>{t('learn.backToChapter')}</LinkButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
