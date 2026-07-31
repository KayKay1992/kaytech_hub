import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Reveal from '../../components/common/Reveal';
import StatCards from '../../components/common/StatCards';
import api from '../../api/axios';

const greetingForHour = (hour) => (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="admin-dashboard"><p>Loading dashboard...</p></div>;
  }

  const firstName = user?.name?.split(' ')[0] || 'Admin';
  const greeting = greetingForHour(new Date().getHours());

  const STATS = stats ? [
    { label: 'Total Students', value: String(stats.totalStudents) },
    { label: 'Total Instructors', value: String(stats.totalInstructors) },
    { label: 'Published Courses', value: `${stats.publishedCourses}/${stats.totalCourses}` },
    { label: 'Total Cohorts', value: String(stats.totalCohorts) },
    { label: 'Active Enrollments', value: String(stats.activeEnrollments) },
    { label: 'Pending Approvals', value: String(stats.pendingApprovals) },
    { label: 'New Registrations', value: String(stats.newRegistrations) },
    { label: 'Total Revenue', value: `₦${stats.totalRevenue.toLocaleString()}` },
  ] : [];

  return (
    <div className="admin-dashboard">
      <Reveal as="div" className="dashboard-hero">
        <div className="dashboard-hero__glow dashboard-hero__glow--one" aria-hidden="true" />
        <div className="dashboard-hero__glow dashboard-hero__glow--two" aria-hidden="true" />

        <div className="dashboard-hero__content">
          <span className="badge badge--on-dark">{greeting}</span>
          <h1 className="dashboard-hero__title">Welcome back, {firstName}</h1>
          <p className="dashboard-hero__subtitle">
            {stats && (stats.newRegistrations > 0 || stats.pendingApprovals > 0)
              ? `You have ${stats.newRegistrations} new registration${stats.newRegistrations === 1 ? '' : 's'} and ${stats.pendingApprovals} approval${stats.pendingApprovals === 1 ? '' : 's'} waiting.`
              : "Everything's caught up across the Academy."}
          </p>

          <div className="dashboard-hero__pills">
            <span className="dashboard-hero__pill"><strong>{stats?.totalStudents ?? 0}</strong>&nbsp;Students</span>
            <span className="dashboard-hero__pill"><strong>{stats?.activeEnrollments ?? 0}</strong>&nbsp;Active Enrollments</span>
            <span className="dashboard-hero__pill"><strong>{stats?.totalCohorts ?? 0}</strong>&nbsp;Cohorts</span>
          </div>
        </div>
      </Reveal>

      {error && <p className="form-error" style={{ marginTop: 20 }}>{error}</p>}

      <div style={{ marginTop: 32 }}>
        <StatCards stats={STATS} />
      </div>

      <div className="course-layout" style={{ marginTop: 40 }}>
        <div className="course-layout__main">
          <Reveal as="div" className="course-section" delay={0.1}>
            <h2>Recent Enrollments</h2>
            {!stats || stats.recentEnrollments.length === 0 ? (
              <p>No enrollments yet — enroll a student from a cohort's page to see it here.</p>
            ) : (
              <table className="invite-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Cohort</th>
                    <th>Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentEnrollments.map((enr) => (
                    <tr key={enr._id}>
                      <td>{enr.student_id?.name || '—'}</td>
                      <td>{enr.cohort_id?.course_id?.title || '—'}</td>
                      <td>{enr.cohort_id?.name || '—'}</td>
                      <td>{new Date(enr.enrolled_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <Link to="/admin/academy/cohorts" className="btn btn--ghost" style={{ marginTop: 16 }}>Manage Cohorts</Link>
          </Reveal>
        </div>

        <div className="course-layout__aside">
          <Reveal as="div" className="course-section" delay={0.15}>
            <h2>Recent Registrations</h2>
            {!stats || stats.recentRegistrations.length === 0 ? (
              <p>No registrations yet.</p>
            ) : (
              stats.recentRegistrations.map((r) => (
                <div key={r._id} style={{ marginBottom: 14 }}>
                  <strong>{r.full_name}</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                    {r.course_id?.title || 'Course'} · {new Date(r.submitted_at).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
            <Link to="/admin/academy/registrations" className="btn btn--ghost" style={{ marginTop: 8 }}>View All</Link>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
