import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import PageHeader from '../../components/common/PageHeader';
import Reveal from '../../components/common/Reveal';

export default function StudentCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/student/courses')
      .then((res) => setEnrollments(res.data.enrollments))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load your courses'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader eyebrow="Student Area" title="My Courses" description="Courses you're enrolled in, with lessons and progress." />

      <section className="section section--flush-top">
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p>Loading your courses...</p>
        ) : enrollments.length === 0 ? (
          <p>You're not enrolled in any cohort yet — an admin needs to enroll you once you've signed up.</p>
        ) : (
          <div className="course-grid">
            {enrollments.map((enr, i) => {
              const course = enr.cohort_id?.course_id;
              const instructor = enr.cohort_id?.instructor_id;
              return (
                <Reveal as="div" className="course-card" key={enr._id} index={i}>
                  <div className="course-card__image-wrap">
                    {course?.image_url ? (
                      <img src={course.image_url} alt={course.title} className="course-card__image" />
                    ) : (
                      <div className="course-card__image course-card__image--placeholder" />
                    )}
                    <span className="course-card__badge">{enr.cohort_id?.name}</span>
                  </div>

                  <div className="course-card__body">
                    <h3 className="course-card__title">{course?.title || 'Course'}</h3>
                    <p className="course-card__description">
                      {instructor?.name ? `Instructor: ${instructor.name}` : 'Instructor to be confirmed'}
                    </p>

                    <div className="progress-label">
                      <span>{enr.completed_count}/{enr.total_lessons} lessons complete</span>
                      <span>{enr.progress_percent}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar__fill" style={{ width: `${enr.progress_percent}%` }} />
                    </div>

                    <div className="course-card__footer">
                      <span className={`invite-status ${enr.status === 'active' ? 'invite-status--unused' : 'invite-status--used'}`}>
                        {enr.status}
                      </span>
                      <Link to={`/student/courses/${enr.cohort_id?._id}`} className="btn btn--primary course-card__cta">
                        View Lessons <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
