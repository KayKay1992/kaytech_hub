import { NavLink } from 'react-router-dom';

// Shared sidebar used by Admin, Student, and Instructor dashboards — each
// passes its own nav groups + brand label, but the responsive behavior
// (drawer on mobile, static on desktop) lives entirely in DashboardLayout.
export default function DashboardSidebar({ navGroups, brandLabel, open, onClose }) {
  return (
    <aside className={`dashboard-sidebar${open ? ' is-open' : ''}`}>
      <div className="dashboard-sidebar__header">
        <span className="dashboard-sidebar__logo">{brandLabel}</span>
        <button
          type="button"
          className="dashboard-sidebar__close"
          aria-label="Close menu"
          onClick={onClose}
        >
          &times;
        </button>
      </div>

      {navGroups.map((group) => (
        <div className="dashboard-sidebar__group" key={group.label}>
          <span className="dashboard-sidebar__group-label">{group.label}</span>
          {group.items.map((item) =>
            item.disabled ? (
              <span className="dashboard-sidebar__link dashboard-sidebar__link--disabled" key={item.to} title="Coming soon">
                {item.label}
              </span>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) => `dashboard-sidebar__link${isActive ? ' is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            )
          )}
        </div>
      ))}
    </aside>
  );
}
