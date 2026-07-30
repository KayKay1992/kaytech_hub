import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import SAMPLE_COURSES from '../data/sampleCourses';

export default function Courses() {
  return (
    <>
      <PageHeader
        eyebrow="KayTech Academy"
        title="Courses"
        description="Practical, job-ready tech courses — every course bundles AI skills."
      />

      <section className="section section--flush-top">
        <div className="card-grid">
          {SAMPLE_COURSES.map((course, i) => (
            <Reveal as="div" className="card" key={course.slug} index={i}>
              <div className="card__image-placeholder" />
              <h3>{course.title}</h3>
              <p>{course.summary}</p>
              <div className="card__tags">
                <span className="badge">{course.level}</span>{' '}
                <span className="badge badge--ai">&lt;AI_SKILLS/&gt;</span>
              </div>
              <Link to={`/courses/${course.slug}`} className="btn btn--ghost">View Course</Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
