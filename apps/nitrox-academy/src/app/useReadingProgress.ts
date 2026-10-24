import { useEffect, useState } from 'react';

/** 0..1 fraction of the document the viewport has scrolled through. */
export function useReadingProgress(): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / max)));
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);
  return p;
}
