import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';
import api from '../../api/axios';

// Homepage promo card for the Scholarship module — dark Ink Navy panel
// (same circuit-grid language as the Hero and every application FormPanel)
// with a live count of open programs pulled from the API, so the claim
// stays honest instead of a hardcoded "scholarships available" line.
export default function ScholarshipBanner() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    api.get('/scholarships')
      .then((res) => setCount(res.data.programs.length))
      .catch(() => setCount(null));
  }, []);

  return (
    <Reveal as="section" className="scholarship-promo">
      <div className="scholarship-promo__glow scholarship-promo__glow--one" aria-hidden="true" />
      <div className="scholarship-promo__glow scholarship-promo__glow--two" aria-hidden="true" />

      <div className="scholarship-promo__content">
        <span className="badge badge--on-dark">Scholarships</span>
        <h2 className="scholarship-promo__title">Let merit open the door, not your budget</h2>
        <p className="scholarship-promo__description">
          We fund places on select courses for applicants who qualify — apply once, and our team reviews it by hand.
        </p>

        <div className="scholarship-promo__stat">
          <span className="scholarship-promo__stat-dot" aria-hidden="true" />
          {count === null ? (
            <span>Funded places available for select courses</span>
          ) : count > 0 ? (
            <span><strong>{count}</strong> scholarship program{count === 1 ? '' : 's'} open right now</span>
          ) : (
            <span>New scholarship programs launching soon</span>
          )}
        </div>

        <Link to="/scholarships" className="btn btn--primary btn--lg scholarship-promo__cta">
          View Scholarships <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>

      <div className="scholarship-promo__badge-wrap" aria-hidden="true">
        <span className="scholarship-promo__ring" />
        <span className="scholarship-promo__badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3 2 8l10 5 10-5-10-5Z" />
            <path d="M6 10.5V16c0 1.5 2.5 3 6 3s6-1.5 6-3v-5.5" />
            <path d="M22 8v6" />
          </svg>
        </span>
      </div>
    </Reveal>
  );
}
