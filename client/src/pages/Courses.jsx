import { useEffect, useState } from 'react';
import api from '../api/axios';
import PageHeader from '../components/common/PageHeader';
import CourseCard from '../components/courses/CourseCard';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/courses')
      .then((res) => setCourses(res.data.courses))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="KayTech Academy"
        title="Courses"
        description="Practical, job-ready tech courses — every course bundles AI skills."
        backTo="/"
        backLabel="Back to Home"
      />

      <section className="section section--flush-top">
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p>Loading courses...</p>
        ) : courses.length === 0 ? (
          <p>No courses published yet — check back soon.</p>
        ) : (
          <div className="course-grid">
            {courses.map((course, i) => (
              <CourseCard course={course} index={i} key={course._id} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
