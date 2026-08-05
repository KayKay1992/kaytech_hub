import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';

const STATUS_CLASSES = {
  upcoming: 'invite-status--unused',
  active: 'invite-status--unused',
  completed: 'invite-status--used',
};

export default function AdminCohorts() {
  const [searchParams] = useSearchParams();
  const courseIdFilter = searchParams.get('course_id') || '';

  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCohorts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (courseIdFilter) params.course_id = courseIdFilter;
      const res = await api.get('/admin/academy/cohorts', { params });
      setCohorts(res.data.cohorts);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load cohorts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCohorts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseIdFilter]);

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>Cohorts</h1>
            <p className="admin-dashboard__subtitle">
              {courseIdFilter ? 'Cohorts for this course.' : 'Every cohort across all courses.'}
              {courseIdFilter && <> <Link to="/admin/academy/cohorts">(clear filter)</Link></>}
            </p>
          </div>
          <Link to={`/admin/academy/cohorts/new${courseIdFilter ? `?course_id=${courseIdFilter}` : ''}`} className="btn btn--primary">
            New Cohort
          </Link>
        </div>
      </Reveal>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p>Loading cohorts...</p>
        ) : cohorts.length === 0 ? (
          <p>No cohorts yet.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Course</th>
                <th>Instructor</th>
                <th>Dates</th>
                <th>Students</th>
                <th>Payout %</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((cohort) => {
                const isFull = Boolean(cohort.max_students) && cohort.enrolled_count >= cohort.max_students;
                return (
                  <tr key={cohort._id}>
                    <td>{cohort.name}</td>
                    <td>{cohort.course_id?.title || '—'}</td>
                    <td>{cohort.instructor_id?.name || '—'}</td>
                    <td>{new Date(cohort.start_date).toLocaleDateString()} – {new Date(cohort.end_date).toLocaleDateString()}</td>
                    <td>
                      {cohort.enrolled_count}{cohort.max_students ? ` / ${cohort.max_students}` : ''}
                      {isFull && <span className="invite-status invite-status--expired" style={{ marginLeft: 8 }}>full</span>}
                    </td>
                    <td>{cohort.instructor_payout_percent}%</td>
                    <td><span className={`invite-status ${STATUS_CLASSES[cohort.status] || ''}`}>{cohort.status}</span></td>
                    <td className="admin-table__actions">
                      <Link to={`/admin/academy/cohorts/${cohort._id}/edit`} className="btn btn--ghost">Edit</Link>
                      <Link to={`/admin/academy/cohorts/${cohort._id}/enrollments`} className="btn btn--ghost">Enrollments</Link>
                      <Link to={`/admin/academy/cohorts/${cohort._id}/attendance`} className="btn btn--ghost">Attendance</Link>
                      <Link to={`/admin/academy/waitlist?course_id=${cohort.course_id?._id}`} className="btn btn--ghost">Waitlist</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
