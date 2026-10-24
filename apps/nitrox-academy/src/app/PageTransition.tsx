import { motion, AnimatePresence } from 'motion/react';
import { useLocation, useOutlet } from 'react-router-dom';
import { useReducedMotion } from './useReducedMotion';

/**
 * Subtle fade-and-rise between routes; disabled when the OS asks for reduced motion.
 * The outlet element is captured with useOutlet() so the exiting wrapper keeps rendering the
 * OLD page while it fades: a live <Outlet /> inside AnimatePresence would re-render the new
 * page twice and run its effects twice.
 */
export function PageTransition() {
  const { pathname } = useLocation();
  const outlet = useOutlet();
  const reduced = useReducedMotion();
  if (reduced) return <>{outlet}</>;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  );
}
