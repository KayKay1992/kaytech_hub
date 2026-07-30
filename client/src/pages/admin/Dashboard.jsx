import Reveal from '../../components/common/Reveal';

// Placeholder numbers — replace with real aggregated data once the Academy
// (courses/enrollment) and payments features exist.
const STATS = [
  { label: 'Total Students', value: '0' },
  { label: 'Total Revenue', value: '₦0' },
  { label: 'Total Courses', value: '0' },
];

export default function Dashboard() {
  return (
    <div className="admin-dashboard">
      <h1>Dashboard</h1>
      <p className="admin-dashboard__subtitle">Placeholder analytics — will be wired to real data in later modules.</p>

      <div className="stat-grid">
        {STATS.map((stat, i) => (
          <Reveal as="div" className="stat-card" key={stat.label} index={i}>
            <span className="stat-card__value">{stat.value}</span>
            <span className="stat-card__label">{stat.label}</span>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
