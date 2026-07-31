import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Reveal from '../../components/common/Reveal';
import api from '../../api/axios';

// Animated completion ring — starts at 0 and eases in to the real value on
// mount, same "draw itself in" feel as the rest of the site's scroll
// reveals. Respects prefers-reduced-motion via the CSS transition being
// disabled globally for .dashboard-ring__fill.
function ProgressRing({ percent, size = 132, strokeWidth = 10 }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(percent), 150);
    return () => clearTimeout(timer);
  }, [percent]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="dashboard-ring">
      <circle className="dashboard-ring__track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
      <circle
        className="dashboard-ring__fill"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="dashboard-ring__label">{percent}%</text>
    </svg>
  );
}

const greetingForHour = (hour) => (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/student/courses'),
      api.get('/notifications'),
    ])
      .then(([coursesRes, notificationsRes]) => {
        setEnrollments(coursesRes.data.enrollments);
        setNotifications(notificationsRes.data.notifications);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <section className="section coming-soon"><p>Loading your dashboard...</p></section>;
  }

  const activeEnrollments = enrollments.filter((e) => e.status === 'active');
  const avgProgress = activeEnrollments.length > 0
    ? Math.round(activeEnrollments.reduce((sum, e) => sum + e.progress_percent, 0) / activeEnrollments.length)
    : 0;
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const firstName = user?.name?.split(' ')[0] || 'there';
  const greeting = greetingForHour(new Date().getHours());

  return (
    <section className="section">
      <Reveal as="div" className="dashboard-hero">
        <div className="dashboard-hero__glow dashboard-hero__glow--one" aria-hidden="true" />
        <div className="dashboard-hero__glow dashboard-hero__glow--two" aria-hidden="true" />

        <div className="dashboard-hero__content">
          <span className="badge badge--on-dark">{greeting}</span>
          <h1 className="dashboard-hero__title">Welcome back, {firstName}</h1>
          <p className="dashboard-hero__subtitle">
            {activeEnrollments.length > 0
              ? `You're making progress across ${activeEnrollments.length} active cohort${activeEnrollments.length === 1 ? '' : 's'} — keep it up.`
              : "You're not enrolled in a cohort yet — once admin enrolls you, it'll show up here."}
          </p>

          <div className="dashboard-hero__pills">
            <span className="dashboard-hero__pill"><strong>{enrollments.length}</strong>&nbsp;Enrolled Cohort{enrollments.length === 1 ? '' : 's'}</span>
            <span className="dashboard-hero__pill"><strong>{unreadCount}</strong>&nbsp;Unread Announcement{unreadCount === 1 ? '' : 's'}</span>
          </div>
        </div>

        <div className="dashboard-hero__ring-wrap">
          <ProgressRing percent={avgProgress} />
          <span className="dashboard-hero__ring-caption">Avg. Progress</span>
        </div>
      </Reveal>

      <div style={{ marginTop: 40 }}>
        <Reveal as="h2" delay={0.1}>Continue Learning</Reveal>

        {enrollments.length === 0 ? (
          <Reveal as="div" className="course-section dashboard-empty-state" delay={0.15}>
            <span className="dashboard-empty-state__icon" aria-hidden="true">🎓</span>
            <p>You're not enrolled in any cohort yet — an admin needs to enroll you once you've signed up.</p>
          </Reveal>
        ) : (
          <div className="course-grid">
            {enrollments.map((enr, i) => {
              const course = enr.cohort_id?.course_id;
              const instructor = enr.cohort_id?.instructor_id;
              return (
                <Reveal as="div" className="course-card" key={enr._id} index={i} delay={0.15}>
                  <div className="course-card__image-wrap">
                    {course?.image_url ? (
                      <img src={course.image_url} alt={course.title} className="course-card__image" />
                    ) : (
                      <div className="course-card__image course-card__image--placeholder" />
                    )}
                    <span className="course-card__badge">{enr.cohort_id?.name}</span>
                  </div>

                  <div className="course-card__body">
                    <h3 className="course-card__title">{course?.title || 'Course'}</h3>
                    <p className="course-card__description">
                      {instructor?.name ? `Instructor: ${instructor.name}` : 'Instructor to be confirmed'}
                    </p>

                    <div className="progress-label">
                      <span>{enr.completed_count}/{enr.total_lessons} lessons</span>
                      <span>{enr.progress_percent}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar__fill" style={{ width: `${enr.progress_percent}%` }} />
                    </div>

                    <div className="course-card__footer">
                      <span className={`invite-status ${enr.status === 'active' ? 'invite-status--unused' : 'invite-status--used'}`}>
                        {enr.status}
                      </span>
                      <Link to={`/student/courses/${enr.cohort_id?._id}`} className="btn btn--primary course-card__cta">
                        Continue <span aria-hidden="true">&rarr;</span>
                      </Link>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      <div className="course-layout" style={{ marginTop: 40 }}>
        <div className="course-layout__main">
          <Reveal as="div" className="course-section" delay={0.2}>
            <h2>Assignments Due</h2>
            <div className="dashboard-empty-state dashboard-empty-state--inline">
              <span className="dashboard-empty-state__icon" aria-hidden="true">✅</span>
              <p>All caught up — assignments will show up here once your instructor publishes one.</p>
            </div>
          </Reveal>
        </div>

        <div className="course-layout__aside">
          <Reveal as="div" className="course-section" delay={0.1}>
            <h2>Announcements</h2>
            {notifications.length === 0 ? (
              <p>No announcements yet.</p>
            ) : (
              <div className="notification-list dashboard-announcements">
                {notifications.slice(0, 4).map((n, i) => (
                  <Reveal
                    as="div"
                    className={`card notification-item${n.is_read ? '' : ' notification-item--unread'}`}
                    key={n._id}
                    index={i}
                    delay={0.15}
                  >
                    <div className="notification-item__row">
                      {!n.is_read && <span className="notification-dot" aria-label="Unread" />}
                      <h3 className="notification-item__title">{n.title}</h3>
                      <span className="notification-item__date">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
            <Link to="/student/notifications" className="btn btn--ghost" style={{ marginTop: 16 }}>View All</Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
