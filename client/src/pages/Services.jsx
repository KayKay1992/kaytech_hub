import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import SEO from '../components/common/SEO';
import PageHeader from '../components/common/PageHeader';
import ServiceCard from '../components/services/ServiceCard';
import Reveal from '../components/common/Reveal';

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/services')
      .then((res) => setServices(res.data.services))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load services'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEO
        title="Services"
        description="Practical, no-fluff business consulting from KayTech Hub — web development, branding, marketing, and AI integration for founders and teams."
      />
      <PageHeader
        eyebrow="KayTech Hub"
        title="Services"
        description="Business consulting built for founders and teams who want practical, no-fluff guidance."
      />

      <section className="section section--flush-top">
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p>Loading services...</p>
        ) : services.length === 0 ? (
          <p>No services listed right now — check back soon.</p>
        ) : (
          <div className="course-grid">
            {services.map((service, i) => (
              <ServiceCard service={service} index={i} key={service._id} />
            ))}
          </div>
        )}
      </section>

      <Reveal as="section" className="section section--flush-top">
        <div className="card corporate-training-cta">
          <div>
            <span className="badge">For Companies</span>
            <h3>Need training for your whole team?</h3>
            <p>Staff training, AI training, or software training tailored to your company — tell us what you need and we'll follow up with a proposal.</p>
          </div>
          <Link to="/corporate-training" className="btn btn--primary">Request Corporate Training</Link>
        </div>
      </Reveal>
    </>
  );
}
