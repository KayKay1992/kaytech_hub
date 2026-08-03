import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Reveal from '../components/common/Reveal';

export default function NotFound() {
  return (
    <section className="section not-found">
      <Reveal as="div" className="not-found__inner">
        <span className="not-found__icon">
          <Compass size={36} aria-hidden="true" />
        </span>
        <p className="not-found__code">404</p>
        <h1>Page not found</h1>
        <p className="prose">
          The page you're looking for doesn't exist, may have been moved, or the link might be broken.
        </p>
        <Link to="/" className="btn btn--primary">Back to Home</Link>
      </Reveal>
    </section>
  );
}
