import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'o2';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-150 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink shadow-[0_8px_24px_-8px_var(--glow)] hover:brightness-110',
  secondary: 'bg-surface-2 border border-line text-ink hover:bg-surface-3',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  danger: 'bg-danger-soft text-danger border border-danger/30 hover:bg-danger/20',
  o2: 'bg-o2 text-white hover:brightness-110',
};
const sizes: Record<Size, string> = {
  sm: 'text-sm px-3.5 py-1.5',
  md: 'text-[15px] px-5 py-2.5',
  lg: 'text-base px-6 py-3.5',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return clsx(base, variants[variant], sizes[size], className);
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" className={buttonClass(variant, size, className)} {...rest} />;
}

export function LinkButton({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
}: {
  to: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}
