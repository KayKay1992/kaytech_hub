import { useEffect, useState } from 'react';
import api from '../../api/axios';
import PageHeader from '../common/PageHeader';
import Reveal from '../common/Reveal';

// Shared by the Student and Instructor dashboards — same fetch, same
// read/unread and click-to-expand behavior for both.
export default function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

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

  return (
    <>
      <PageHeader eyebrow="Notifications" title="Notifications" description="Messages from the KayTech Hub team." />

      <section className="section section--flush-top">
        {error && <p className="form-error">{error}</p>}

        {loading ? (
          <p>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          <div className="notification-list">
            {notifications.map((n, i) => (
              <Reveal
                as="div"
                className={`card notification-item${n.is_read ? '' : ' notification-item--unread'}`}
                key={n._id}
                index={i}
                onClick={() => handleOpen(n)}
              >
                <div className="notification-item__row">
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
    </>
  );
}
