import { Fragment, type ReactNode } from 'react';

/**
 * Minimal inline markup for lesson text, kept deliberately small:
 *   **bold**   _italic_   {{FO2}} → scientific token rendered LTR in monospace
 *   [[1.4]] → number rendered LTR with tabular figures
 * Line breaks ("\n\n") become paragraphs.
 */
const TOKEN = /(\*\*[^*]+\*\*|_[^_]+_|\{\{[^}]+\}\}|\[\[[^\]]+\]\])/g;

export function renderInline(text: string): ReactNode[] {
  const parts = text.split(TOKEN);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**')) return <strong key={i}>{renderInline(part.slice(2, -2))}</strong>;
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('{{')) return <Sci key={i}>{part.slice(2, -2)}</Sci>;
    if (part.startsWith('[[')) return <span key={i} className="num font-medium">{part.slice(2, -2)}</span>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function Sci({ children }: { children: ReactNode }) {
  return (
    <bdi className="sci" dir="ltr">
      {children}
    </bdi>
  );
}

export function Rich({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n\s*\n/);
  if (paragraphs.length === 1) return <p className={className}>{renderInline(text)}</p>;
  return (
    <div className={className}>
      {paragraphs.map((p, i) => (
        <p key={i} className={i > 0 ? 'mt-4' : undefined}>
          {renderInline(p)}
        </p>
      ))}
    </div>
  );
}

/** A formula line: always LTR, monospace, never wrapped mid-token. */
export function Formula({ expression, className }: { expression: string; className?: string }) {
  return (
    <div
      dir="ltr"
      className={
        'readout text-center text-lg md:text-xl font-medium text-ink tracking-wide py-3 px-4 rounded-xl bg-surface-3 border border-line overflow-x-auto whitespace-nowrap ' +
        (className ?? '')
      }
    >
      {expression}
    </div>
  );
}
