import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Terminal from './Terminal';

export default function Hero() {
  const prefersReducedMotion = useReducedMotion();
  const Content = prefersReducedMotion ? 'div' : motion.div;
  const contentProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: 'easeOut' },
      };

  return (
    <div className="hero-wrap">
      <section className="hero">
        <Content className="hero__content" {...contentProps}>
          <span className="badge badge--on-dark">KayTech Hub — Port Harcourt</span>
          <h1>
            Learn skills that <span className="text-amber">ship</span>, not just certificates.
          </h1>
          <p>
            Practical tech courses, business mentorship, and a co-working space
            built for ambitious students and professionals — with AI skills
            built into every course.
          </p>
          <div className="hero__actions">
            <Link to="/courses" className="btn btn--primary btn--lg">Explore Courses</Link>
            <Link to="/about" className="btn btn--ghost-on-dark btn--lg">Learn More</Link>
          </div>
        </Content>

        <Terminal />
      </section>
    </div>
  );
}
