import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import api from '../api/axios';
import SEO from '../components/common/SEO';
import Reveal from '../components/common/Reveal';

const CATEGORY_LABELS = {
  'web-development': 'Web Development',
  consultation: 'Consultation',
  branding: 'Branding',
  marketing: 'Marketing',
  'ai-integration': 'AI Integration',
};

export default function ServiceDetail() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/services/${id}`)
      .then((res) => setService(res.data.service))
      .catch((err) => setError(err.response?.data?.message || 'Service not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <section className="section coming-soon"><p>Loading...</p></section>;
  }

  if (error || !service) {
    return (
      <section className="section coming-soon">
        <h1>Service not found</h1>
        <p>{error || "We couldn't find that service."}</p>
        <Link to="/services" className="btn btn--primary">Back to Services</Link>
      </section>
    );
  }

  const metaDescription = service.description.length > 160
    ? `${service.description.slice(0, 157)}...`
    : service.description;

  return (
    <section className="section">
      <SEO title={service.title} description={metaDescription} image={service.image_url} />
      <Reveal as="div" className="course-hero">
        <div className="course-hero__image-wrap">
          {service.image_url ? (
            <img src={service.image_url} alt={service.title} className="course-hero__image" />
          ) : (
            <div className="course-hero__image course-hero__image--placeholder" />
          )}
          <span className="course-card__badge">{CATEGORY_LABELS[service.category] || service.category}</span>
        </div>

        <div className="course-hero__body">
          <Link to="/services" className="btn btn--ghost course-detail__back">&larr; All Services</Link>

          <h1 className="course-hero__title">{service.title}</h1>
          <p className="course-hero__description">{service.description}</p>

          {service.category === 'ai-integration' && (
            <span className="badge badge--ai">&lt;AI_SKILLS/&gt;</span>
          )}
        </div>
      </Reveal>

      <div className="course-layout">
        <div className="course-layout__main">
          {service.detailed_description && (
            <Reveal as="div" className="course-section" delay={0.1}>
              <h2>About This Service</h2>
              <p>{service.detailed_description}</p>
            </Reveal>
          )}

          {service.features.length > 0 && (
            <Reveal as="div" className="course-section" delay={0.15}>
              <h2>What's Included</h2>
              <ul className="service-features-list">
                {service.features.map((feature, i) => (
                  <li key={i}>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}

          {service.process_steps.length > 0 && (
            <Reveal as="div" className="course-section" delay={0.2}>
              <h2>How It Works</h2>
              <ol className="course-timeline">
                {service.process_steps.map((step, i) => (
                  <li className="course-timeline__item" key={i}>
                    <span className="course-timeline__marker">{i + 1}</span>
                    <div className="course-timeline__content">
                      <h4>{step.title}</h4>
                      {step.description && <p>{step.description}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          )}

          {service.gallery_images.length > 0 && (
            <Reveal as="div" className="course-section" delay={0.25}>
              <h2>Gallery</h2>
              <div className="service-gallery">
                {service.gallery_images.map((url, i) => (
                  <img src={url} alt={`${service.title} example ${i + 1}`} className="service-gallery__image" key={url} />
                ))}
              </div>
            </Reveal>
          )}
        </div>

        <div className="course-layout__aside">
          <Reveal as="div" className="course-price-card" delay={0.1}>
            {service.starting_price ? (
              <>
                <span className="course-price-card__label">Starting at</span>
                <span className="course-price-card__value">₦{Number(service.starting_price).toLocaleString()}</span>
              </>
            ) : (
              <span className="course-price-card__label">Custom pricing — get in touch for a quote</span>
            )}

            <Link to={`/services/${service._id}/request`} className="btn btn--primary btn--full course-price-card__cta">
              Request This Service
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
