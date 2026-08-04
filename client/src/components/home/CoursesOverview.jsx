import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import Reveal from '../common/Reveal';
import CourseCard from '../courses/CourseCard';
import EmptyState from '../common/EmptyState';
import api from '../../api/axios';

export default function CoursesOverview() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses')
      .then((res) => setCourses(res.data.courses.filter((c) => c.featured).slice(0, 4)))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="section">
      <Reveal as="div" className="section__header">
        <span className="badge">Our Programs</span>
        <h2>Popular Courses</h2>
        <p>A taste of what you can learn at KayTech Academy.</p>
      </Reveal>

      {loading ? (
        <p>Loading courses...</p>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="New courses coming soon"
          message="Check back shortly — we're lining up our next featured picks."
        />
      ) : (
        <div className="course-grid">
          {courses.map((course, i) => (
            <CourseCard course={course} index={i} key={course._id} />
          ))}
        </div>
      )}

      {!loading && (
        <div className="courses-overview__more">
          <Link to="/courses" className="btn btn--primary btn--lg">View More Courses</Link>
        </div>
      )}
    </section>
  );
}
