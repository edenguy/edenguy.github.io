import type { KeyboardEvent } from 'react';

/**
 * Arrow-key navigation for a group of role="radio" buttons, as the ARIA radio-group pattern
 * requires. Call the returned handler from the group's onKeyDown.
 */
export function rovingRadioKeyDown(count: number, current: number | null, select: (i: number) => void) {
  return (e: KeyboardEvent<HTMLElement>) => {
    if (count === 0) return;
    // Direction of the group itself, so an LTR numeric scale inside a Hebrew page works.
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const next = e.key === 'ArrowDown' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
    const prev = e.key === 'ArrowUp' || e.key === (rtl ? 'ArrowRight' : 'ArrowLeft');
    if (!next && !prev) return;
    e.preventDefault();
    const radios = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')];
    // Movement starts from the focused option (the ARIA pattern), falling back to the
    // checked one, so the first arrow press from an unchecked first option lands on the second.
    const focused = radios.indexOf(document.activeElement as HTMLElement);
    const base = focused >= 0 ? focused : (current ?? (next ? -1 : 0));
    const i = next ? (base + 1) % count : (base - 1 + count) % count;
    select(i);
    radios[i]?.focus();
  };
}
