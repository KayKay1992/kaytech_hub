import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import SEO from '../components/common/SEO';
import Reveal from '../components/common/Reveal';
import StarRating from '../components/common/StarRating';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [cohorts, setCohorts] = useState([]);
  const [modules, setModules] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/courses/${id}`)
      .then((res) => {
        setCourse(res.data.course);
        setCohorts(res.data.cohorts);
        setModules(res.data.modules);
        setReviews(res.data.reviews);
      })
      .catch((err) => setError(err.response?.data?.message || 'Course not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <section className="section coming-soon"><p>Loading...</p></section>;
  }

  if (error || !course) {
    return (
      <section className="section coming-soon">
        <h1>Course not found</h1>
        <p>{error || "We couldn't find that course."}</p>
        <Link to="/courses" className="btn btn--primary">Back to Courses</Link>
      </section>
    );
  }

  const instructorNames = [...new Set(cohorts.map((c) => c.instructor_id?.name).filter(Boolean))];
  const requirementLines = (course.requirements || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const curriculumLines = (course.curriculum || '').split('\n').map((l) => l.trim()).filter(Boolean);

  // Prefer the real approved Module/Lesson curriculum once instructors have
  // built it out; fall back to the admin's plain-text curriculum overview.
  const curriculumItems = modules.length > 0
    ? modules
    : curriculumLines.map((title, i) => ({ _id: `line-${i}`, title, lessons: [] }));

  const nextCohort = cohorts[0];
  const nextCohortFull = Boolean(nextCohort?.max_students) && nextCohort.enrolled_count >= nextCohort.max_students;

  const metaDescription = course.description.length > 160
    ? `${course.description.slice(0, 157)}...`
    : course.description;

  return (
    <section className="section">
      <SEO title={course.title} description={metaDescription} image={course.image_url} />
      <Reveal as="div" className="course-hero">
        <div className="course-hero__image-wrap">
          {course.image_url ? (
            <img src={course.image_url} alt={course.title} className="course-hero__image" />
          ) : (
            <div className="course-hero__image course-hero__image--placeholder" />
          )}
          {course.category && <span className="course-card__badge">{course.category}</span>}
        </div>

        <div className="course-hero__body">
          <Link to="/courses" className="btn btn--ghost course-detail__back">&larr; All Courses</Link>

          <h1 className="course-hero__title">{course.title}</h1>
          <p className="course-hero__description">{course.description}</p>

          <div className="course-hero__stats">
            {course.review_count > 0 && (
              <div className="course-hero__stat">
                <span className="course-hero__stat-label">Rating</span>
                <span className="course-hero__stat-value course-hero__rating">
                  <StarRating value={course.average_rating} size={15} />
                  {course.average_rating.toFixed(1)} ({course.review_count} review{course.review_count !== 1 ? 's' : ''})
                </span>
              </div>
            )}
            {course.duration && (
              <div className="course-hero__stat">
                <span className="course-hero__stat-label">Duration</span>
                <span className="course-hero__stat-value">{course.duration}</span>
              </div>
            )}
            {requirementLines.length > 0 && (
              <div className="course-hero__stat">
                <span className="course-hero__stat-label">Requirements</span>
                <span className="course-hero__stat-value">{requirementLines[0]}</span>
              </div>
            )}
            {instructorNames.length > 0 && (
              <div className="course-hero__stat">
                <span className="course-hero__stat-label">Instructor{instructorNames.length > 1 ? 's' : ''}</span>
                <span className="course-hero__stat-value">{instructorNames.join(', ')}</span>
              </div>
            )}
          </div>

          <span className="badge badge--ai">&lt;AI_SKILLS/&gt;</span>
        </div>
      </Reveal>

      <div className="course-layout">
        <div className="course-layout__main">
          {curriculumItems.length > 0 && (
            <Reveal as="div" className="course-section" delay={0.1}>
              <h2>Course Curriculum</h2>
              <ol className="course-timeline">
                {curriculumItems.map((item, i) => (
                  <li className="course-timeline__item" key={item._id}>
                    <span className="course-timeline__marker">{i + 1}</span>
                    <div className="course-timeline__content">
                      <h4>{item.title}</h4>
                      {item.lessons.length > 0 && (
                        <ul className="course-timeline__lessons">
                          {item.lessons.map((lesson) => <li key={lesson._id}>{lesson.title}</li>)}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
          )}

          {requirementLines.length > 0 && (
            <Reveal as="div" className="course-section" delay={0.15}>
              <h2>Requirements</h2>
              {requirementLines.length > 1 ? (
                <ul className="course-requirements-list">
                  {requirementLines.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
              ) : (
                <p>{requirementLines[0]}</p>
              )}
            </Reveal>
          )}

          {instructorNames.length > 0 && (
            <Reveal as="div" className="course-section" delay={0.2}>
              <h2>About the Instructor{instructorNames.length > 1 ? 's' : ''}</h2>
              {instructorNames.map((name) => (
                <div className="course-instructor" key={name}>
                  <div className="card__avatar-placeholder" />
                  <div>
                    <h4>{name}</h4>
                    <p className="course-instructor__role">KayTech Academy Instructor</p>
                  </div>
                </div>
              ))}
            </Reveal>
          )}

          {reviews.length > 0 && (
            <Reveal as="div" className="course-section" delay={0.25}>
              <h2>Reviews</h2>
              <div className="review-list">
                {reviews.map((review) => (
                  <div className="review-card" key={review._id}>
                    <div className="review-card__header">
                      <span className="review-card__author">{review.student_id?.name || 'Student'}</span>
                      <span className="review-card__date">
                        {new Date(review.published_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <StarRating value={review.rating} size={14} />
                    <p className="review-card__text">{review.review_text}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          )}
        </div>

        <div className="course-layout__aside">
          <Reveal as="div" className="course-price-card" delay={0.1}>
            <span className="course-price-card__label">Course Fee</span>
            <span className="course-price-card__value">₦{Number(course.price).toLocaleString()}</span>

            {course.duration && (
              <div className="course-price-card__row">
                <span>Duration</span>
                <span>{course.duration}</span>
              </div>
            )}
            {nextCohort && (
              <div className="course-price-card__row">
                <span>Next cohort</span>
                <span>{new Date(nextCohort.start_date).toLocaleDateString()}</span>
              </div>
            )}

            {nextCohortFull ? (
              <Link
                to={`/courses/${course._id}/waitlist?cohort=${nextCohort._id}`}
                className="btn btn--primary btn--full course-price-card__cta"
              >
                Cohort Full — Join Waitlist
              </Link>
            ) : (
              <Link to={`/courses/${course._id}/register`} className="btn btn--primary btn--full course-price-card__cta">
                Register Now
              </Link>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
