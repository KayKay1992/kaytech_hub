import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';
import ServiceCard from '../services/ServiceCard';
import api from '../../api/axios';

export default function ServicesPreview() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/services')
      .then((res) => setServices(res.data.services.slice(0, 4)))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && services.length === 0) return null;

  return (
    <section className="section">
      <Reveal as="div" className="section__header">
        <span className="badge">KayTech Hub</span>
        <h2>Our Services</h2>
        <p>Practical, no-fluff consulting for founders and teams who want to move faster.</p>
      </Reveal>

      {loading ? (
        <p>Loading services...</p>
      ) : (
        <>
          <div className="course-grid">
            {services.map((service, i) => (
              <ServiceCard service={service} index={i} key={service._id} />
            ))}
          </div>

          <div className="courses-overview__more">
            <Link to="/services" className="btn btn--ghost btn--lg">View More Services</Link>
          </div>
        </>
      )}
    </section>
  );
}
