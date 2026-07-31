import { NavLink } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { getInitials } from '../../utils/initials';

const PILL_SPRING = { type: 'spring', stiffness: 500, damping: 34, mass: 0.6 };
const PILL_INSTANT = { duration: 0 };

// Shared sidebar used by Admin, Student, and Instructor dashboards — each
// passes its own nav groups + brand label. Signature detail: the active
// item's pill background is one shared `layoutId` element, so Framer Motion
// animates it sliding to the new spot instead of it just appearing there.
export default function DashboardSidebar({ navGroups, brandLabel, open, onClose, collapsed, onToggleCollapsed, user, onLogout }) {
  const prefersReducedMotion = useReducedMotion();

  const listVariants = {
    hidden: {},
    show: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.03, delayChildren: prefersReducedMotion ? 0 : 0.05 } },
  };
  const itemVariants = {
    hidden: { opacity: prefersReducedMotion ? 1 : 0, x: prefersReducedMotion ? 0 : -10 },
    show: { opacity: 1, x: 0, transition: { duration: 0.28, ease: 'easeOut' } },
  };

  return (
    <aside className={`dashboard-sidebar${open ? ' is-open' : ''}${collapsed ? ' is-collapsed' : ''}`}>
      <div className="dashboard-sidebar__header">
        <div className="dashboard-sidebar__brand">
          <span className="dashboard-sidebar__mark">K</span>
          <span className="dashboard-sidebar__wordmark">{brandLabel}</span>
        </div>
        <button type="button" className="dashboard-sidebar__close" aria-label="Close menu" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <button
        type="button"
        className="dashboard-sidebar__collapse-toggle"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        {!collapsed && <span>Collapse</span>}
      </button>

      <motion.nav className="dashboard-sidebar__nav" variants={listVariants} initial="hidden" animate="show">
        {navGroups.map((group) => (
          <div className="dashboard-sidebar__group" key={group.label}>
            <motion.span className="dashboard-sidebar__group-label" variants={itemVariants}>
              {group.label}
            </motion.span>

            {group.items.map((item) => {
              const Icon = item.icon;

              if (item.disabled) {
                return (
                  <motion.span
                    key={item.to}
                    className="sidebar-link sidebar-link--disabled"
                    variants={itemVariants}
                    title="Coming soon"
                  >
                    {Icon && <Icon size={18} className="sidebar-link__icon" aria-hidden="true" />}
                    <span className="sidebar-link__label">{item.label}</span>
                  </motion.span>
                );
              }

              return (
                <motion.div key={item.to} variants={itemVariants}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onClose}
                    className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="sidebar-active-pill"
                            className="sidebar-link__pill"
                            transition={prefersReducedMotion ? PILL_INSTANT : PILL_SPRING}
                          />
                        )}
                        {Icon && <Icon size={18} className="sidebar-link__icon" aria-hidden="true" />}
                        <span className="sidebar-link__label">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </motion.div>
              );
            })}
          </div>
        ))}
      </motion.nav>

      <div className="dashboard-sidebar__profile">
        <span className="dashboard-sidebar__avatar">{getInitials(user?.name)}</span>
        <div className="dashboard-sidebar__profile-info">
          <strong>{user?.name}</strong>
          <span className="badge badge--on-dark">{user?.role}</span>
        </div>
        <button type="button" className="dashboard-sidebar__logout" onClick={onLogout} aria-label="Log out" title="Log out">
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
