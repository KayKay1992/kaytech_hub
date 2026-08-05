import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';
import StarRating from '../common/StarRating';

// Shared course card — plain image up top (category badge pinned to its
// top-right corner), then title/description/AI tag/price+CTA in the card
// body. Used on the public Courses listing and the homepage "Popular
// Courses" section.
export default function CourseCard({ course, index = 0 }) {
  return (
    <Reveal as="div" className="course-card" index={index}>
      <div className="course-card__image-wrap">
        {course.image_url ? (
          <img src={course.image_url} alt={course.title} className="course-card__image" />
        ) : (
          <div className="course-card__image course-card__image--placeholder" />
        )}
        {course.category && <span className="course-card__badge">{course.category}</span>}
      </div>

      <div className="course-card__body">
        <h3 className="course-card__title">{course.title}</h3>
        {course.review_count > 0 && (
          <div className="course-card__rating">
            <StarRating value={course.average_rating} size={14} />
            <span className="course-card__rating-value">{course.average_rating.toFixed(1)}</span>
            <span>({course.review_count})</span>
          </div>
        )}
        <p className="course-card__description">{course.description}</p>
        <span className="badge badge--ai course-card__ai-tag">&lt;AI_SKILLS/&gt;</span>

        <div className="course-card__footer">
          <div className="course-card__price">
            <span className="course-card__price-label">Course Fee</span>
            <span className="course-card__price-value">₦{Number(course.price).toLocaleString()}</span>
          </div>
          <Link to={`/courses/${course._id}`} className="btn btn--primary course-card__cta">
            View Course <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
