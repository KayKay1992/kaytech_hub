import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Reveal from '../../components/common/Reveal';

// Placeholder landing page for instructors — real content (assigned
// cohorts, students, grading) arrives with the Academy module.
const STATS = [
  { label: 'Assigned Cohorts', value: '0' },
  { label: 'Total Students', value: '0' },
  { label: 'Pending Grading', value: '0' },
];

export default function InstructorDashboard() {
  const { user } = useAuth();

  return (
    <>
      <PageHeader eyebrow="Instructor Area" title={`Welcome, ${user?.name}`} />

      <section className="section section--flush-top">
        <p className="admin-dashboard__subtitle">
          Your assigned cohorts, students, and grading tools will show up here once the Academy module is built.
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
