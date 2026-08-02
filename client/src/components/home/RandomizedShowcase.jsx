import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import useIsMobile from '../../hooks/useIsMobile';

const AUTO_ADVANCE_MS = 5000;
const SWIPE_THRESHOLD = 60;

const shuffle = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Shared display logic for Success Stories / Testimonials: on desktop, a
// random subset (re-rolled every page visit) fills the standard 4-per-row
// grid; on mobile, the whole featured pool auto-rotates through in a random
// order as a swipeable one-card-at-a-time carousel.
export default function RandomizedShowcase({ items, renderCard, getKey, maxDesktop = 4 }) {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  const desktopItems = useMemo(() => shuffle(items).slice(0, maxDesktop), [items, maxDesktop]);
  const mobileOrder = useMemo(() => shuffle(items), [items]);

  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => setIndex(0), [mobileOrder]);

  useEffect(() => {
    if (!isMobile || mobileOrder.length <= 1 || prefersReducedMotion) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % mobileOrder.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timerRef.current);
  }, [isMobile, mobileOrder.length, prefersReducedMotion]);

  if (items.length === 0) return null;

  if (!isMobile) {
    return (
      <div className="course-grid">
        {desktopItems.map((item, i) => renderCard(item, i))}
      </div>
    );
  }

  const goTo = (next) => {
    clearInterval(timerRef.current);
    setIndex(next);
  };

  const handleDragEnd = (e, info) => {
    if (info.offset.x < -SWIPE_THRESHOLD) {
      goTo((index + 1) % mobileOrder.length);
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      goTo((index - 1 + mobileOrder.length) % mobileOrder.length);
    }
  };

  const current = mobileOrder[index];

  return (
    <div className="showcase-carousel">
      <AnimatePresence mode="wait">
        <motion.div
          key={getKey ? getKey(current) : index}
          className="showcase-carousel__slide"
          drag={mobileOrder.length > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          initial={prefersReducedMotion ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, x: -24 }}
          transition={{ duration: 0.4 }}
        >
          {renderCard(current, 0)}
        </motion.div>
      </AnimatePresence>

      {mobileOrder.length > 1 && (
        <div className="showcase-carousel__dots">
          {mobileOrder.map((item, i) => (
            <button
              key={getKey ? getKey(item) : i}
              type="button"
              className={`showcase-carousel__dot${i === index ? ' showcase-carousel__dot--active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
