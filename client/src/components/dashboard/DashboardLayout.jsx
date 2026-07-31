import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardTopbar from './DashboardTopbar';
import { useAuth } from '../../context/AuthContext';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const COLLAPSE_KEY = 'kaytech_sidebar_collapsed';

// Shared responsive shell for every role-gated dashboard (Admin, Student,
// Instructor). Desktop: sidebar is fixed full-height, collapsible to an
// icon-only rail (remembered across visits). Mobile: sidebar is a slide-in
// drawer, opened via the hamburger button in the topbar, closed via the
// same button, an overlay click, or the sidebar's own close (X) button.
//
// `notificationsBasePath` (e.g. "/student") is optional — pass it to show
// the unread-notifications bell in the topbar. Admin doesn't pass it.
export default function DashboardLayout({ navGroups, brandLabel, notificationsBasePath }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === '1');

  const closeSidebar = () => setSidebarOpen(false);

  // While the mobile drawer is open, lock background scroll so the page
  // doesn't feel "stuck" — the full-screen overlay otherwise swallows
  // scroll gestures without actually scrolling anything.
  useBodyScrollLock(sidebarOpen);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={`dashboard-layout${collapsed ? ' is-collapsed' : ''}`}>
      <DashboardSidebar
        navGroups={navGroups}
        brandLabel={brandLabel}
        open={sidebarOpen}
        onClose={closeSidebar}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((v) => !v)}
        user={user}
        onLogout={handleLogout}
      />
      {sidebarOpen && <div className="mobile-drawer-overlay" onClick={closeSidebar} />}

      <div className="dashboard-layout__main">
        <DashboardTopbar
          navGroups={navGroups}
          notificationsBasePath={notificationsBasePath}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          user={user}
          onLogout={handleLogout}
        />

        <div className="dashboard-layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
