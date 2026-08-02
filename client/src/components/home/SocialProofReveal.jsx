import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Like Reveal, but with a touch more flourish (slight scale-in alongside the
// fade + slide-up) for social-proof content — Success Story and Testimonial
// cards — that deserves a bit of extra polish. Respects prefers-reduced-motion.
export default function SocialProofReveal({ children, index = 0, stagger = 0.12, className, ...rest }) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef(null);
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
    return <div ref={ref} className={className} {...rest}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, delay: index * stagger, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
