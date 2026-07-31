import Reveal from './Reveal';

// The exact stat card used on the Admin Dashboard (Total Students, Total
// Revenue, etc.) — extracted so every dashboard page (Admin, Instructor,
// Student) reuses the same component instead of a similar-but-different
// one. `stats` is [{ label, value, accent? }]. No icons: the original card
// doesn't have any, so neither does this.
export default function StatCards({ stats }) {
  return (
    <div className="stat-grid admin-stat-grid">
      {stats.map((stat, i) => (
        <Reveal as="div" className={`stat-card${stat.accent ? ' stat-card--accent' : ''}`} key={stat.label} index={i}>
          <span className="stat-card__value">{stat.value}</span>
          <span className="stat-card__label">{stat.label}</span>
        </Reveal>
      ))}
    </div>
  );
}
