import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';

export default function CohortAttendance() {
  const { id } = useParams();
  const [cohort, setCohort] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [cohortRes, attendanceRes] = await Promise.all([
          api.get(`/admin/academy/cohorts/${id}`),
          api.get(`/admin/academy/cohorts/${id}/attendance`),
        ]);
        setCohort(cohortRes.data.cohort);
        setRecords(attendanceRes.data.records);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load attendance');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>Attendance{cohort ? `: ${cohort.name}` : ''}</h1>
            <p className="admin-dashboard__subtitle">
              <Link to="/admin/academy/cohorts">&larr; Back to Cohorts</Link>
            </p>
          </div>
        </div>
      </Reveal>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p>Loading attendance...</p>
        ) : records.length === 0 ? (
          <p style={{ padding: 18 }}>No attendance recorded for this cohort yet.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>{new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td>{r.student_id?.name || '—'}<br />{r.student_id?.email}</td>
                  <td>
                    <span className={`academy-status academy-status--${r.status === 'present' ? 'approved' : 'rejected'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
