import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Scroll-triggered fade + slide-up. Wrap a section, or a group of children
// with `stagger` + `index` to reveal a grid one item after another.
// Respects prefers-reduced-motion (fades in place, no movement, no delay).
// Any other props (onSubmit, onClick, style, etc.) pass straight through.
export default function Reveal({ children, index = 0, stagger = 0.1, delay = 0, as = 'div', className, ...rest }) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef(null);
  // If the element is already inside the viewport the instant it mounts
  // (e.g. a page's own header content — no hero above it to scroll past),
  // whileInView's very first intersection check can be missed and the
  // element is left stuck at opacity 0 until something scrolls. Detect
  // that case synchronously before paint and just show it immediately.
  const [skipAnimation, setSkipAnimation] = useState(false);

  useLayoutEffect(() => {
    if (prefersReducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setSkipAnimation(true);
    }
  }, [prefersReducedMotion]);

  if (prefersReducedMotion || skipAnimation) {
    const Static = as;
    return <Static ref={ref} className={className} {...rest}>{children}</Static>;
  }

  const Component = motion[as] || motion.div;

  return (
    <Component
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: delay + index * stagger, ease: 'easeOut' }}
      {...rest}
    >
      {children}
    </Component>
  );
}
