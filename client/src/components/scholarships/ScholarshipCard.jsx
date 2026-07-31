import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';

// Mirrors CourseCard's layout (image on top, content below) but keeps status
// as plain text in the body instead of a badge overlaid on the image.
export default function ScholarshipCard({ program, index = 0 }) {
  return (
    <Reveal as="div" className="course-card" index={index}>
      <div className="course-card__image-wrap">
        {program.image_url ? (
          <img src={program.image_url} alt={program.title} className="course-card__image" />
        ) : (
          <div className="course-card__image course-card__image--placeholder" />
        )}
      </div>

      <div className="course-card__body">
        <h3 className="course-card__title">{program.title}</h3>
        <p className="course-card__description">{program.description}</p>
        <span className="invite-status invite-status--unused">
          {program.status === 'open' ? 'Open' : 'Closed'}
        </span>

        <div className="course-card__footer">
          <Link to={`/scholarships/${program._id}`} className="btn btn--primary course-card__cta">
            View Program <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
