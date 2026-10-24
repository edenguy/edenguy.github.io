import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import type { Block, Lesson } from '@/content/schema';
import { pick } from '@/content/localize';
import { useLocale } from '@/app/useLocale';
import { getQuestion } from '@/content';
import { useProgress } from '@/progress/store';
import { Rich, Formula, renderInline, Sci } from '@/components/ui/Rich';
import { Callout } from '@/components/ui/Callout';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Interactive } from '@/simulations';
import { QuestionCard } from './QuestionCard';
import { SpeakButton } from '@/components/ui/SpeakButton';
import { blockSpeech } from '@/content/speakable';
import { rovingRadioKeyDown } from '@/components/ui/useRovingRadio';

export function LessonBlocks({ lesson, chapterId }: { lesson: Lesson; chapterId: string }) {
  return (
    <div className="space-y-7 md:space-y-9">
      {lesson.blocks.map((block, i) => (
        <BlockView key={block.id ?? `${lesson.id}-${i}`} block={block} blockKey={block.id ?? `${lesson.id}-${i}`} lessonId={lesson.id} chapterId={chapterId} />
      ))}
    </div>
  );
}

function Label({ children, tone = 'accent' }: { children: React.ReactNode; tone?: 'accent' | 'o2' | 'n2' }) {
  const c = { accent: 'text-accent', o2: 'text-o2', n2: 'text-n2' }[tone];
  return <div className={clsx('text-xs font-semibold uppercase tracking-[0.14em] mb-2', c)}>{children}</div>;
}

function BlockView({ block, blockKey, lessonId, chapterId }: { block: Block; blockKey: string; lessonId: string; chapterId: string }) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  switch (block.type) {
    case 'text':
      return (
        <div className="group/para relative">
          <Rich text={pick(block.body, locale)} className="lesson-prose" />
          <div className="mt-2 opacity-0 group-hover/para:opacity-100 focus-within:opacity-100 transition-opacity">
            <SpeakButton text={blockSpeech(block, locale)} />
          </div>
        </div>
      );
    case 'heading':
      return <h2 className="text-2xl md:text-3xl text-ink pt-2">{renderInline(pick(block.text, locale))}</h2>;
    case 'callout':
      return (
        <Callout variant={block.variant} title={block.title ? pick(block.title, locale) : undefined}>
          <Rich text={pick(block.body, locale)} />
        </Callout>
      );
    case 'interactive':
      return (
        <figure className="card p-4 md:p-6 -mx-1 md:mx-0">
          <Interactive component={block.component} props={block.props} />
          <figcaption className="mt-4 text-sm text-muted space-y-1">
            {block.caption && <div>{renderInline(pick(block.caption, locale))}</div>}
            <div className="text-xs flex items-center gap-1.5">
              <Icon name="shield" size={13} className="text-danger shrink-0" /> {t('lab.scope')}
            </div>
          </figcaption>
        </figure>
      );
    case 'formula':
      return (
        <div>
          <Label>{t('common.formula')}</Label>
          <Formula expression={block.expression} />
          {block.legend.length > 0 && (
            <dl className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              {block.legend.map((l) => (
                <div key={l.symbol} className="flex gap-2">
                  <dt>
                    <Sci>{l.symbol}</Sci>
                  </dt>
                  <dd className="text-ink-2">{renderInline(pick(l.meaning, locale))}</dd>
                </div>
              ))}
            </dl>
          )}
          {block.note && <p className="mt-2 text-sm text-muted">{renderInline(pick(block.note, locale))}</p>}
        </div>
      );
    case 'example':
      return (
        <div className="rounded-2xl border border-line bg-surface-2 p-5">
          <Label tone="o2">{t('common.example')}</Label>
          <div className="font-semibold text-ink mb-3">{renderInline(pick(block.title, locale))}</div>
          <ol className="space-y-3">
            {block.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="shrink-0 grid place-items-center w-6 h-6 rounded-full bg-surface-3 text-xs font-bold text-ink-2">{i + 1}</span>
                <div className="min-w-0">
                  <div className="text-ink-2">{renderInline(pick(s.text, locale))}</div>
                  {s.math && (
                    <div dir="ltr" className="readout text-ink font-medium mt-0.5">
                      {s.math}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 pt-3 border-t border-line text-ink font-medium">
            <span className="text-muted text-xs uppercase tracking-wider me-2">{t('common.result')}</span>
            {renderInline(pick(block.result, locale))}
          </div>
        </div>
      );
    case 'predict':
      return <PredictBlock block={block} blockKey={blockKey} />;
    case 'question': {
      const q = getQuestion(block.questionId);
      if (!q) return <Callout variant="warning">Missing question: {block.questionId}</Callout>;
      return <EmbeddedQuestion questionId={block.questionId} lessonId={lessonId} chapterId={chapterId} />;
    }
    case 'deeper':
      return <DeeperBlock title={pick(block.title, locale)} body={pick(block.body, locale)} />;
    case 'keypoints':
      return (
        <div className="rounded-2xl border border-accent/40 bg-accent-soft p-5">
          <Label>{t('common.keyPoints')}</Label>
          <ul className="space-y-2">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-3 text-ink">
                <Icon name="check" size={18} className="text-accent shrink-0 mt-1" />
                <span>{renderInline(pick(item, locale))}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case 'terms':
      return (
        <div>
          <Label>{t('common.glossary')}</Label>
          <dl className="grid sm:grid-cols-2 gap-3">
            {block.items.map((it) => (
              <div key={it.term} className="rounded-xl border border-line bg-surface-2 p-3">
                <dt>
                  <Sci>{it.term}</Sci>
                </dt>
                <dd className="text-sm text-ink-2 mt-1">{renderInline(pick(it.definition, locale))}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case 'compare':
      return (
        <div className="overflow-x-auto -mx-1">
          {block.title && <div className="font-semibold text-ink mb-2">{renderInline(pick(block.title, locale))}</div>}
          <table className="w-full text-sm border-separate border-spacing-0 rounded-2xl overflow-hidden border border-line">
            <thead>
              <tr className="bg-surface-3">
                <th className="text-start p-3 font-semibold text-ink-2"></th>
                {block.columns.map((c, i) => (
                  <th key={i} className="text-start p-3 font-semibold text-ink">
                    {renderInline(pick(c, locale))}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i} className={i % 2 ? 'bg-surface-2' : 'bg-surface'}>
                  <th className="text-start p-3 font-medium text-ink-2 align-top">{renderInline(pick(r.label, locale))}</th>
                  {r.cells.map((c, j) => (
                    <td key={j} className="p-3 text-ink-2 align-top">
                      {renderInline(pick(c, locale))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

function PredictBlock({ block, blockKey }: { block: Extract<Block, { type: 'predict' }>; blockKey: string }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const saved = useProgress((s) => s.predictions[blockKey]);
  const record = useProgress((s) => s.recordPrediction);
  const [localChoice, setLocalChoice] = useState<number | null>(null);
  // A recorded prediction wins over local state, so a restore while the lesson is open still
  // shows the choice that was actually made. It stays revealed once recorded.
  const choice = saved?.choice ?? localChoice;
  const setChoice = setLocalChoice;
  const isRevealed = saved !== undefined;

  const reveal = () => {
    if (choice === null) return;
    record(blockKey, { choice, correct: choice === block.correctIndex, at: Date.now() });
  };

  return (
    <div className="rounded-2xl border border-n2/40 bg-n2-soft p-5">
      <Label tone="n2">{t('common.predict')}</Label>
      <p className="text-lg font-medium text-ink mb-4">{renderInline(pick(block.prompt, locale))}</p>
      <div
        className="grid gap-2 sm:grid-cols-2"
        role="radiogroup"
        aria-label={t('common.predict')}
        onKeyDown={isRevealed ? undefined : rovingRadioKeyDown(block.options.length, choice, setChoice)}
      >
        {block.options.map((o, i) => {
          const sel = choice === i;
          const correct = isRevealed && i === block.correctIndex;
          const wrong = isRevealed && sel && i !== block.correctIndex;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={sel}
              tabIndex={sel || (choice === null && i === 0) ? 0 : -1}
              disabled={isRevealed}
              onClick={() => setChoice(i)}
              className={clsx(
                'rounded-xl border px-4 py-2.5 text-start text-[15px] transition-colors',
                !isRevealed && (sel ? 'border-n2 bg-surface' : 'border-line bg-surface/60 hover:bg-surface'),
                correct && 'border-safe bg-safe-soft',
                wrong && 'border-danger bg-danger-soft',
                isRevealed && !correct && !wrong && 'opacity-60 border-line bg-surface/60',
              )}
            >
              {renderInline(pick(o, locale))}
            </button>
          );
        })}
      </div>
      {!isRevealed ? (
        <Button className="mt-4" onClick={reveal} disabled={choice === null}>
          {t('common.reveal')} <Icon name="arrow" size={16} className="rtl:-scale-x-100" />
        </Button>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Badge tone={choice === block.correctIndex ? 'safe' : 'warn'}>{choice === block.correctIndex ? t('common.correct') : t('common.incorrect')}</Badge>
          </div>
          <Rich text={pick(block.reveal, locale)} className="text-ink-2" />
          {block.interactive && (
            <div className="card p-4 md:p-5">
              <Interactive component={block.interactive.component} props={block.interactive.props} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmbeddedQuestion({ questionId, lessonId, chapterId }: { questionId: string; lessonId: string; chapterId: string }) {
  const q = getQuestion(questionId)!;
  const recordAttempt = useProgress((s) => s.recordAttempt);
  return (
    <div className="card p-5 md:p-6">
      <QuestionCard
        key={`${lessonId}-${chapterId}-${questionId}`}
        question={q}
        embedded
        onAnswered={({ correct }) => recordAttempt({ questionId, topic: q.topic, correct, at: Date.now(), context: 'lesson' })}
      />
    </div>
  );
}

function DeeperBlock({ title, body }: { title: string; body: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-dashed border-line-strong">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 px-5 py-3.5 text-start" aria-expanded={open}>
        <Icon name="sparkle" size={18} className="text-accent" />
        <span className="font-medium text-ink flex-1">{title}</span>
        <span className="text-xs text-muted uppercase tracking-wider">{t('common.learnMore')}</span>
        <Icon name="chevron" size={18} className={clsx('text-muted transition-transform', open ? 'rotate-90' : 'rtl:rotate-180')} />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <Rich text={body} className="lesson-prose" />
        </div>
      )}
    </div>
  );
}
