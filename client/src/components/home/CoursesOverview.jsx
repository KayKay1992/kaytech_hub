import Reveal from '../common/Reveal';

// Static placeholder cards for now — will be replaced with real course data
// once the Academy module (courses, cohorts) is built. Every course bundles
// AI skills, hence the Circuit Teal "<AI_SKILLS/>" tag on each one.
const SAMPLE_COURSES = [
  { title: 'Web Development Fundamentals', level: 'Beginner' },
  { title: 'Data Analysis with Python', level: 'Intermediate' },
  { title: 'Product Management Bootcamp', level: 'Beginner' },
];

export default function CoursesOverview() {
  return (
    <section className="section">
      <Reveal as="div" className="section__header">
        <span className="badge">Our Programs</span>
        <h2>Popular Courses</h2>
        <p>A taste of what you can learn at KayTech Academy.</p>
      </Reveal>

      <div className="card-grid">
        {SAMPLE_COURSES.map((course, i) => (
          <Reveal as="div" className="card" key={course.title} index={i}>
            <div className="card__image-placeholder" />
            <h3>{course.title}</h3>
            <div>
              <span className="badge">{course.level}</span>{' '}
              <span className="badge badge--ai">&lt;AI_SKILLS/&gt;</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
