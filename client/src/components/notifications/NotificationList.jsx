import { useEffect, useMemo, useState } from 'react';
import { Bell, MailOpen } from 'lucide-react';
import api from '../../api/axios';
import Reveal from '../common/Reveal';
import ListPageHeader from '../common/ListPageHeader';
import StatCards from '../common/StatCards';
import EmptyState from '../common/EmptyState';
import Avatar from '../common/Avatar';

// Shared by the Student and Instructor dashboards — same fetch, same
// read/unread and click-to-expand behavior for both.
export default function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    api.get('/notifications')
      .then((res) => setNotifications(res.data.notifications))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load notifications'))
      .finally(() => setLoading(false));
  }, []);

  const handleOpen = async (notification) => {
    const willExpand = expandedId !== notification._id;
    setExpandedId(willExpand ? notification._id : null);

    if (willExpand && !notification.is_read) {
      try {
        await api.post(`/notifications/${notification._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, is_read: true } : n))
        );
      } catch {
        // Non-critical — the message is still readable even if marking fails.
      }
    }
  };

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);
  const visible = useMemo(
    () => (tab === 'unread' ? notifications.filter((n) => !n.is_read) : notifications),
    [notifications, tab]
  );

  return (
    <section className="section section--flush-top">
      <ListPageHeader title="Notifications" subtitle="Messages from the KayTech Hub team." />

      <StatCards stats={[
        { label: 'Total', value: notifications.length },
        { label: 'Unread', value: unreadCount, accent: unreadCount > 0 },
      ]} />

      <div className="notification-tabs">
        <button type="button" className={tab === 'all' ? 'is-active' : ''} onClick={() => setTab('all')}>All</button>
        <button type="button" className={tab === 'unread' ? 'is-active' : ''} onClick={() => setTab('unread')}>
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Loading notifications...</p>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={tab === 'unread' ? MailOpen : Bell}
          title={tab === 'unread' ? 'All caught up' : 'No notifications yet'}
          message={tab === 'unread' ? "You've read everything — nice." : 'Messages from the KayTech Hub team will show up here.'}
        />
      ) : (
        <div className="notification-list">
          {visible.map((n, i) => (
            <Reveal
              as="div"
              className={`card notification-item${n.is_read ? '' : ' notification-item--unread'}`}
              key={n._id}
              index={i}
              onClick={() => handleOpen(n)}
            >
              <div className="notification-item__row">
                <Avatar name={n.sender_id?.name || 'KayTech Hub'} size={34} />
                {!n.is_read && <span className="notification-dot" aria-label="Unread" />}
                <h3 className="notification-item__title">{n.title}</h3>
                <span className="notification-item__date">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
              <p className="notification-item__sender">From {n.sender_id?.name || 'KayTech Hub'}</p>
              {expandedId === n._id && <p className="notification-item__body">{n.message}</p>}
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
