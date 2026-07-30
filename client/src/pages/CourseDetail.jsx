import { useParams, Link } from 'react-router-dom';
import Reveal from '../components/common/Reveal';
import SAMPLE_COURSES from '../data/sampleCourses';

export default function CourseDetail() {
  const { slug } = useParams();
  const course = SAMPLE_COURSES.find((c) => c.slug === slug);

  if (!course) {
    return (
      <section className="section coming-soon">
        <h1>Course not found</h1>
        <p>We couldn't find that course.</p>
        <Link to="/courses" className="btn btn--primary">Back to Courses</Link>
      </section>
    );
  }

  return (
    <section className="section course-detail">
      <Reveal as="div">
        <Link to="/courses" className="btn btn--ghost course-detail__back">&larr; All Courses</Link>

        <div className="card__tags">
          <span className="badge">{course.level}</span>{' '}
          <span className="badge badge--ai">&lt;AI_SKILLS/&gt;</span>
        </div>

        <h1>{course.title}</h1>
        <p className="prose course-detail__summary">{course.summary}</p>
      </Reveal>

      <Reveal as="div" className="card course-detail__syllabus" delay={0.1}>
        <h3>What you'll learn</h3>
        <ul className="course-syllabus">
          {course.syllabus.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Reveal>

      <Reveal as="div" className="course-detail__cta" delay={0.2}>
        <Link to="/register" className="btn btn--primary btn--lg">Enroll — Coming Soon</Link>
      </Reveal>
    </section>
  );
}
