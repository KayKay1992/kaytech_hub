import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Bell } from 'lucide-react';
import api from '../../api/axios';

// Bell icon with an unread-count badge, shown in the Student/Instructor
// dashboard topbar. Refetches whenever the route changes so the count
// updates after visiting (and reading) the Notifications page. The badge
// pops in on first appearance and pulses again whenever the count rises.
export default function NotificationBell({ basePath }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [justArrived, setJustArrived] = useState(false);
  const previousCount = useRef(0);
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    api.get('/notifications')
      .then((res) => {
        const count = res.data.notifications.filter((n) => !n.is_read).length;
        if (count > previousCount.current) {
          setJustArrived(true);
          setTimeout(() => setJustArrived(false), 700);
        }
        previousCount.current = count;
        setUnreadCount(count);
      })
      .catch(() => {});
  }, [location.pathname]);

  return (
    <Link
      to={`${basePath}/notifications`}
      className="notification-bell"
      aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
    >
      <Bell size={20} strokeWidth={2} />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            key="badge"
            className="notification-bell__badge"
            initial={prefersReducedMotion ? false : { scale: 0 }}
            animate={{ scale: justArrived && !prefersReducedMotion ? [1, 1.4, 1] : 1 }}
            exit={prefersReducedMotion ? undefined : { scale: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
