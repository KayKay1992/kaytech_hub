import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Reveal from '../../components/common/Reveal';
import ProgressRing from '../../components/common/ProgressRing';
import StatCards from '../../components/common/StatCards';
import api from '../../api/axios';

const greetingForHour = (hour) => (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
const money = (n) => `₦${Number(n || 0).toLocaleString()}`;

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [cohorts, setCohorts] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/instructor/cohorts'),
      api.get('/instructor/payouts'),
      api.get('/notifications'),
      api.get('/instructor/dashboard/stats'),
    ])
      .then(([cohortsRes, payoutsRes, notificationsRes, statsRes]) => {
        setCohorts(cohortsRes.data.cohorts);
        setPayouts(payoutsRes.data.payouts);
        setNotifications(notificationsRes.data.notifications);
        setStats(statsRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <section className="section coming-soon"><p>Loading your dashboard...</p></section>;
  }

  const payoutByCohortId = new Map(payouts.map((p) => [String(p.cohort_id?._id || p.cohort_id), p]));
  const totalStudents = payouts.reduce((sum, p) => sum + (p.students_count || 0), 0);
  const unpaidTotal = payouts.reduce((sum, p) => sum + (p.unpaid_amount || 0), 0);
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const gradedPercent = stats && stats.totalSubmissions > 0
    ? Math.round((stats.gradedSubmissions / stats.totalSubmissions) * 100)
    : 100;
  const pendingGrading = stats?.pendingGrading ?? 0;
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
            {cohorts.length > 0
              ? `You're teaching ${cohorts.length} cohort${cohorts.length === 1 ? '' : 's'}${
                  pendingGrading > 0
                    ? ` — ${pendingGrading} submission${pendingGrading === 1 ? '' : 's'} waiting for a grade.`
                    : ', and you\'re all caught up on grading.'
                }`
              : "You're not assigned to a cohort yet — once admin assigns you one, it'll show up here."}
          </p>

          <div className="dashboard-hero__pills">
            <span className="dashboard-hero__pill"><strong>{cohorts.length}</strong>&nbsp;Assigned Cohort{cohorts.length === 1 ? '' : 's'}</span>
            <span className="dashboard-hero__pill"><strong>{unreadCount}</strong>&nbsp;Unread Announcement{unreadCount === 1 ? '' : 's'}</span>
          </div>
        </div>

        <div className="dashboard-hero__ring-wrap">
          <ProgressRing percent={gradedPercent} />
          <span className="dashboard-hero__ring-caption">Graded</span>
        </div>
      </Reveal>

      <div style={{ marginTop: 32 }}>
        <StatCards stats={[
          { label: 'Assigned Cohorts', value: cohorts.length },
          { label: 'Total Students', value: totalStudents },
          { label: 'Pending Grading', value: pendingGrading, accent: pendingGrading > 0 },
          { label: 'Unpaid Payout', value: money(unpaidTotal) },
        ]} />
      </div>

      <div style={{ marginTop: 40 }}>
        <Reveal as="h2" delay={0.1}>Your Cohorts</Reveal>

        {cohorts.length === 0 ? (
          <Reveal as="div" className="course-section dashboard-empty-state" delay={0.15}>
            <span className="dashboard-empty-state__icon" aria-hidden="true">🎓</span>
            <p>You haven't been assigned to a cohort yet — check back once admin assigns you one.</p>
          </Reveal>
        ) : (
          <div className="course-grid">
            {cohorts.map((cohort, i) => {
              const payout = payoutByCohortId.get(String(cohort._id));
              return (
                <Reveal as="div" className="course-card" key={cohort._id} index={i} delay={0.15}>
                  <div className="course-card__image-wrap">
                    {cohort.course_id?.image_url ? (
                      <img src={cohort.course_id.image_url} alt={cohort.course_id.title} className="course-card__image" />
                    ) : (
                      <div className="course-card__image course-card__image--placeholder" />
                    )}
                    <span className="course-card__badge">{cohort.name}</span>
                  </div>

                  <div className="course-card__body">
                    <h3 className="course-card__title">{cohort.course_id?.title || 'Course'}</h3>
                    <p className="course-card__description">
                      {payout ? `${payout.students_count} student${payout.students_count === 1 ? '' : 's'} enrolled` : 'Loading roster...'}
                    </p>

                    <div className="course-card__footer">
                      <span className={`invite-status ${cohort.status === 'active' ? 'invite-status--unused' : 'invite-status--used'}`}>
                        {cohort.status}
                      </span>
                      <Link to={`/instructor/academy/courses/${cohort.course_id?._id}`} className="btn btn--primary course-card__cta">
                        Manage <span aria-hidden="true">&rarr;</span>
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
            <h2>Needs Grading</h2>
            {!stats || stats.recentUngraded.length === 0 ? (
              <div className="dashboard-empty-state dashboard-empty-state--inline">
                <span className="dashboard-empty-state__icon" aria-hidden="true">✅</span>
                <p>All caught up — nothing waiting for a grade right now.</p>
              </div>
            ) : (
              <table className="invite-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Assignment</th>
                    <th>Cohort</th>
                    <th>Submitted</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUngraded.map((s) => (
                    <tr key={s._id}>
                      <td>{s.student_name}</td>
                      <td>{s.assignment_title}</td>
                      <td>{s.cohort_name}</td>
                      <td className="payments-date">{new Date(s.submitted_at).toLocaleDateString()}</td>
                      <td>
                        <Link to={`/instructor/academy/assignments/${s.assignment_id}/submissions`} className="btn btn--ghost">Grade</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
            <Link to="/instructor/notifications" className="btn btn--ghost" style={{ marginTop: 16 }}>View All</Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
