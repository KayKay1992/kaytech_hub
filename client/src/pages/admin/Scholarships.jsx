import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Reveal from '../../components/common/Reveal';

export default function Scholarships() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadPrograms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/scholarships');
      setPrograms(res.data.programs);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load scholarship programs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const toggleStatus = async (program) => {
    setBusyId(program._id);
    setError('');
    try {
      const nextStatus = program.status === 'open' ? 'closed' : 'open';
      await api.patch(`/admin/scholarships/${program._id}`, { status: nextStatus });
      setPrograms((prev) => prev.map((p) => (p._id === program._id ? { ...p, status: nextStatus } : p)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>Scholarship Programs</h1>
            <p className="admin-dashboard__subtitle">Create, edit, and open/close scholarship programs.</p>
          </div>
          <Link to="/admin/scholarships/new" className="btn btn--primary">New Program</Link>
        </div>
      </Reveal>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p>Loading scholarship programs...</p>
        ) : programs.length === 0 ? (
          <p>No scholarship programs yet.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Course Track</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((program) => (
                <tr key={program._id}>
                  <td>{program.title}</td>
                  <td>{program.applies_to_all_courses ? 'All Courses' : (program.course_id?.title || '—')}</td>
                  <td>
                    <span className={`invite-status ${program.status === 'open' ? 'invite-status--unused' : 'invite-status--used'}`}>
                      {program.status === 'open' ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td>{new Date(program.created_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/scholarships/${program._id}/edit`} className="btn btn--ghost">Edit</Link>
                    <Link to={`/admin/scholarships/${program._id}/applications`} className="btn btn--ghost">Applications</Link>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={busyId === program._id}
                      onClick={() => toggleStatus(program)}
                    >
                      {program.status === 'open' ? 'Close' : 'Reopen'}
                    </button>
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
