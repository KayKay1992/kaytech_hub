import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';
import RandomizedShowcase from './RandomizedShowcase';
import TestimonialCard from './TestimonialCard';
import api from '../../api/axios';

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/testimonials')
      .then((res) => setTestimonials(res.data.testimonials))
      .catch(() => setTestimonials([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section section--muted">
      <Reveal as="div" className="section__header">
        <span className="badge">Testimonials</span>
        <h2>What People Say</h2>
      </Reveal>

      {loading ? (
        <p>Loading testimonials...</p>
      ) : testimonials.length === 0 ? (
        <p>Testimonials will appear here as they're submitted and approved.</p>
      ) : (
        <RandomizedShowcase
          items={testimonials}
          getKey={(t) => t._id}
          renderCard={(t, i) => <TestimonialCard testimonial={t} index={i} key={t._id} />}
        />
      )}

      <div className="courses-overview__more">
        <Link to="/testimonials/submit" className="btn btn--ghost btn--lg">Share Your Experience</Link>
      </div>
    </section>
  );
}
