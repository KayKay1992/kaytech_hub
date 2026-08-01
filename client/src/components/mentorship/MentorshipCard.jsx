import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';

// Mirrors CourseCard's layout (image on top, content below).
export default function MentorshipCard({ program, index = 0 }) {
  return (
    <Reveal as="div" className="course-card" index={index}>
      <div className="course-card__image-wrap">
        {program.image_url ? (
          <img src={program.image_url} alt={program.title} className="course-card__image" />
        ) : (
          <div className="course-card__image course-card__image--placeholder" />
        )}
        {program.duration && <span className="course-card__badge">{program.duration}</span>}
      </div>

      <div className="course-card__body">
        <h3 className="course-card__title">{program.title}</h3>
        <p className="course-card__description">{program.description}</p>

        <div className="course-card__footer">
          <div className="course-card__price">
            <span className="course-card__price-label">Program Fee</span>
            <span className="course-card__price-value">₦{Number(program.price).toLocaleString()}</span>
          </div>
          <Link to={`/mentorship/${program._id}`} className="btn btn--primary course-card__cta">
            View Program <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
