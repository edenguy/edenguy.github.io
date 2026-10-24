import { clsx } from 'clsx';
import type { HTMLAttributes } from 'react';

export function Card({ className, flat, ...rest }: HTMLAttributes<HTMLDivElement> & { flat?: boolean }) {
  return <div className={clsx(flat ? 'card-flat' : 'card', 'p-5 md:p-6', className)} {...rest} />;
}

export function SectionTitle({
  eyebrow,
  title,
  body,
  className,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  className?: string;
}) {
  return (
    <div className={clsx('mb-4', className)}>
      {eyebrow && <div className="text-xs font-semibold uppercase tracking-[0.14em] text-accent mb-1">{eyebrow}</div>}
      <h2 className="text-xl md:text-2xl text-ink">{title}</h2>
      {body && <p className="text-ink-2 mt-1 max-w-prose">{body}</p>}
    </div>
  );
}
