import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import type { Question } from '@/content/schema';
import { pick } from '@/content/localize';
import { useLocale } from '@/app/useLocale';
import { grade, type Answer } from '@/assessment/grade';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { renderInline } from '@/components/ui/Rich';
import { Badge } from '@/components/ui/Badge';
import { rovingRadioKeyDown } from '@/components/ui/useRovingRadio';

export interface QuestionOutcome {
  correct: boolean;
  answer: Answer;
}

/**
 * Renders any question type, grades it locally, and shows the explanation.
 * Parent decides what to do with the outcome (record attempt, advance, etc.).
 */
export function QuestionCard({
  question,
  onAnswered,
  index,
  total,
  embedded,
}: {
  question: Question;
  onAnswered: (outcome: QuestionOutcome) => void;
  index?: number;
  total?: number;
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [choice, setChoice] = useState<number | null>(null);
  const [numeric, setNumeric] = useState('');
  const [bool, setBool] = useState<boolean | null>(null);
  const [result, setResult] = useState<ReturnType<typeof grade> | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  // After grading, the Check button disappears; move focus to the result so keyboard and
  // screen-reader users land on the verdict and explanation instead of <body>.
  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  const answer: Answer | null =
    question.type === 'multiple-choice'
      ? choice === null
        ? null
        : { type: 'multiple-choice', optionIndex: choice }
      : question.type === 'numeric'
        ? numeric.trim() === ''
          ? null
          : { type: 'numeric', value: Number(numeric.replace(',', '.')) }
        : bool === null
          ? null
          : { type: 'true-false', value: bool };

  const submit = () => {
    if (!answer) return;
    const r = grade(question, answer);
    setResult(r);
    onAnswered({ correct: r.correct, answer });
  };

  const reset = () => {
    setChoice(null);
    setNumeric('');
    setBool(null);
    setResult(null);
    setShowSteps(false);
  };

  const difficultyDots = '●'.repeat(question.difficulty) + '○'.repeat(3 - question.difficulty);
  const optionLetter = (i: number) => (locale === 'he' ? 'אבגדהו'.charAt(i) : String.fromCharCode(65 + i));

  return (
    <div className={clsx(!embedded && 'card p-5 md:p-7')}>
      <div className="flex items-center justify-between gap-3 mb-3 text-xs text-muted">
        <span className="font-semibold uppercase tracking-[0.12em]">
          {index !== undefined && total !== undefined ? t('learn.question', { n: index + 1, total }) : t('common.knowledgeCheck')}
        </span>
        <span className="readout" title={t('quiz.difficulty')}>
          {difficultyDots}
        </span>
      </div>
      <p className="text-lg md:text-xl font-medium text-ink leading-snug mb-5">{renderInline(pick(question.prompt, locale))}</p>

      {question.type === 'multiple-choice' && (
        <div
          className="grid gap-2.5"
          role="radiogroup"
          aria-label={t('common.yourAnswer')}
          onKeyDown={result ? undefined : rovingRadioKeyDown(question.options.length, choice, setChoice)}
        >
          {question.options.map((opt, i) => {
            const selected = choice === i;
            const isCorrect = result && i === question.correctIndex;
            const isWrongPick = result && selected && !result.correct;
            return (
              <button
                key={i}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected || (choice === null && i === 0) ? 0 : -1}
                disabled={!!result}
                onClick={() => setChoice(i)}
                className={clsx(
                  'text-start rounded-2xl border px-4 py-3 transition-all flex items-start gap-3',
                  !result && (selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2 hover:border-line-strong'),
                  isCorrect && 'border-safe bg-safe-soft',
                  isWrongPick && 'border-danger bg-danger-soft',
                  result && !isCorrect && !isWrongPick && 'border-line bg-surface-2 opacity-60',
                )}
              >
                <span
                  className={clsx(
                    'shrink-0 mt-0.5 grid place-items-center w-6 h-6 rounded-full text-xs font-bold border',
                    isCorrect ? 'bg-safe text-white border-safe' : isWrongPick ? 'bg-danger text-white border-danger' : selected ? 'bg-accent text-accent-ink border-accent' : 'border-line-strong text-muted',
                  )}
                >
                  {isCorrect ? <Icon name="check" size={14} /> : isWrongPick ? <Icon name="x" size={14} /> : optionLetter(i)}
                </span>
                <span className="text-[15px] text-ink">{renderInline(pick(opt, locale))}</span>
              </button>
            );
          })}
        </div>
      )}

      {question.type === 'numeric' && (
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            dir="ltr"
            value={numeric}
            disabled={!!result}
            onChange={(e) => setNumeric(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={t('quiz.numericPlaceholder')}
            className={clsx(
              'readout text-lg rounded-2xl border bg-surface-2 px-4 py-3 w-44 outline-none focus:border-accent',
              result ? (result.correct ? 'border-safe' : 'border-danger') : 'border-line',
            )}
            aria-label={t('common.yourAnswer')}
          />
          {question.unit && <span className="text-sm text-muted">{t('quiz.unit', { unit: question.unit })}</span>}
        </div>
      )}

      {question.type === 'true-false' && (
        <div className="flex gap-3">
          {[true, false].map((v) => {
            const selected = bool === v;
            const isCorrect = result && v === question.answer;
            const isWrongPick = result && selected && !result.correct;
            return (
              <button
                key={String(v)}
                type="button"
                disabled={!!result}
                onClick={() => setBool(v)}
                className={clsx(
                  'flex-1 rounded-2xl border px-4 py-3 font-medium transition-all',
                  !result && (selected ? 'border-accent bg-accent-soft' : 'border-line bg-surface-2'),
                  isCorrect && 'border-safe bg-safe-soft',
                  isWrongPick && 'border-danger bg-danger-soft',
                )}
              >
                {v ? t('common.true') : t('common.false')}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {!result ? (
          <Button onClick={submit} disabled={!answer}>
            {t('common.check')}
          </Button>
        ) : (
          <Badge tone={result.correct ? 'safe' : 'danger'} className="text-sm px-3 py-1">
            <Icon name={result.correct ? 'check' : 'x'} size={14} /> {result.correct ? t('common.correct') : t('common.incorrect')}
          </Badge>
        )}
        {result && !result.correct && embedded && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <Icon name="refresh" size={16} /> {t('common.tryAgain')}
          </Button>
        )}
      </div>

      {result && (
        <div ref={resultRef} tabIndex={-1} className="mt-4 rounded-2xl border border-line bg-surface-2 p-4 space-y-3 outline-none focus-visible:ring-2 focus-visible:ring-accent">
          {question.type === 'numeric' && (
            <div className="text-sm text-ink-2">
              {t('common.correctAnswer')}: <span className="readout font-semibold text-ink">{question.answer}{question.unit ? ` ${question.unit}` : ''}</span>
              {question.tolerance > 0 && <span className="text-muted"> (±{question.tolerance})</span>}
            </div>
          )}
          {question.type === 'true-false' && !result.correct && (
            <div className="text-sm text-ink-2">
              {t('common.correctAnswer')}: <span className="font-semibold text-ink">{question.answer ? t('common.true') : t('common.false')}</span>
            </div>
          )}
          {question.type === 'multiple-choice' && result.misconceptionIndex !== undefined && (
            <div className="text-sm">
              <span className="font-semibold text-warn">{t('quiz.misconception')}: </span>
              <span className="text-ink-2">{renderInline(pick(question.misconceptions[result.misconceptionIndex]!.note, locale))}</span>
            </div>
          )}
          <div className="text-[15px] text-ink-2">
            <span className="font-semibold text-ink">{t('common.explanation')}: </span>
            {renderInline(pick(question.explanation, locale))}
          </div>
          {question.type === 'numeric' && question.steps.length > 0 && (
            <div>
              <button type="button" className="text-sm font-medium text-accent" onClick={() => setShowSteps((v) => !v)}>
                {showSteps ? t('common.hideSteps') : t('quiz.solution')}
              </button>
              {showSteps && (
                <ol className="mt-2 space-y-2 list-decimal ps-5 text-sm text-ink-2">
                  {question.steps.map((s, i) => (
                    <li key={i}>
                      {renderInline(pick(s.text, locale))}
                      {s.math && (
                        <div dir="ltr" className="readout text-ink mt-0.5">
                          {s.math}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
