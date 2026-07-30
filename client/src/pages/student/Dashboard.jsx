import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Reveal from '../../components/common/Reveal';

// Placeholder landing page for students — real content (enrolled courses,
// assignments, certificates) arrives with the Academy module.
const STATS = [
  { label: 'Enrolled Courses', value: '0' },
  { label: 'Certificates Earned', value: '0' },
  { label: 'Upcoming Classes', value: '0' },
];

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader eyebrow="Student Area" title={`Welcome, ${user?.name}`} />

      <section className="section section--flush-top">
        <p className="admin-dashboard__subtitle">
          Your enrolled courses, assignments, and certificates will show up here once the Academy module is built.
        </p>
        <div className="stat-grid">
          {STATS.map((stat, i) => (
            <Reveal as="div" className="stat-card" key={stat.label} index={i}>
              <span className="stat-card__value">{stat.value}</span>
              <span className="stat-card__label">{stat.label}</span>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
