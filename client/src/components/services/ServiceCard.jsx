import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';

const CATEGORY_LABELS = {
  'web-development': 'Web Development',
  consultation: 'Consultation',
  branding: 'Branding',
  marketing: 'Marketing',
  'ai-integration': 'AI Integration',
};

// Mirrors CourseCard's layout (image on top, content below). "Read More"
// leads to the Service Detail page — the card itself stays a short teaser.
export default function ServiceCard({ service, index = 0 }) {
  return (
    <Reveal as="div" className="course-card" index={index}>
      <div className="course-card__image-wrap">
        {service.image_url ? (
          <img src={service.image_url} alt={service.title} className="course-card__image" />
        ) : (
          <div className="course-card__image course-card__image--placeholder" />
        )}
        <span className="course-card__badge">{CATEGORY_LABELS[service.category] || service.category}</span>
        {service.category === 'ai-integration' && (
          <span className="badge badge--ai course-card__ai-tag">&lt;AI_SKILLS/&gt;</span>
        )}
      </div>

      <div className="course-card__body">
        <h3 className="course-card__title">{service.title}</h3>
        <p className="course-card__description">{service.description}</p>

        <div className="course-card__footer">
          {service.starting_price ? (
            <div className="course-card__price">
              <span className="course-card__price-label">Starting at</span>
              <span className="course-card__price-value">₦{Number(service.starting_price).toLocaleString()}</span>
            </div>
          ) : <span />}
          <Link to={`/services/${service._id}`} className="btn btn--primary course-card__cta">
            Read More <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
