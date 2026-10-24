import { useEffect } from 'react';

const KEY = (id: string) => `nitrox:scroll:${id}`;

/**
 * Remembers how far a learner scrolled in a lesson and returns them to that point when they
 * come back, so "continue" really continues. Positions live in localStorage because they are
 * a per-device convenience, not progress.
 */
export function useScrollResume(id: string | undefined, enabled = true): void {
  useEffect(() => {
    if (!id || !enabled) return;
    let raf = 0;
    try {
      const saved = Number(localStorage.getItem(KEY(id)));
      if (saved > 120) {
        // Wait for layout (fonts, simulations) before jumping.
        raf = window.requestAnimationFrame(() => window.scrollTo({ top: saved, behavior: 'instant' as ScrollBehavior }));
      }
    } catch {
      /* ignore */
    }
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        ticking = false;
        try {
          localStorage.setItem(KEY(id), String(Math.round(window.scrollY)));
        } catch {
          /* ignore */
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [id, enabled]);
}

export function clearScrollResume(id: string): void {
  try {
    localStorage.removeItem(KEY(id));
  } catch {
    /* ignore */
  }
}
