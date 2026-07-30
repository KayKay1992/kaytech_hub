import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import PageHeader from '../../../components/common/PageHeader';
import Reveal from '../../../components/common/Reveal';

export default function InstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/instructor/courses')
      .then((res) => setCourses(res.data.courses))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load your courses'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader eyebrow="Instructor Area" title="My Courses" description="Courses you're assigned to teach via a cohort." />

      <section className="section section--flush-top">
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : courses.length === 0 ? (
          <p>You're not assigned to any cohorts yet. An admin needs to assign you to a course cohort first.</p>
        ) : (
          <div className="card-grid">
            {courses.map((course, i) => (
              <Reveal as="div" className="card" key={course._id} index={i}>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <Link to={`/instructor/academy/courses/${course._id}`} className="btn btn--ghost">Manage Content</Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
