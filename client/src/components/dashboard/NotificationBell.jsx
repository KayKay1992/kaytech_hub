import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../api/axios';

// Bell icon with an unread-count badge, shown in the Student/Instructor
// dashboard topbar. Refetches whenever the route changes so the count
// updates after visiting (and reading) the Notifications page.
export default function NotificationBell({ basePath }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    api.get('/notifications')
      .then((res) => setUnreadCount(res.data.notifications.filter((n) => !n.is_read).length))
      .catch(() => {});
  }, [location.pathname]);

  return (
    <Link
      to={`${basePath}/notifications`}
      className="notification-bell"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && <span className="notification-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
    </Link>
  );
}
