import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';
import Modal from '../../../components/common/Modal';

const STATUS_OPTIONS = ['new', 'contacted', 'confirmed', 'declined'];
const PAYMENT_OPTIONS = ['pending', 'paid'];

export default function AdminRegistrations() {
  const [searchParams] = useSearchParams();
  const courseIdFilter = searchParams.get('course_id') || '';

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [viewing, setViewing] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (courseIdFilter) params.course_id = courseIdFilter;
      const res = await api.get('/admin/academy/registrations', { params });
      setRegistrations(res.data.registrations);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseIdFilter]);

  const updateField = async (id, field, value) => {
    setBusyId(id);
    setError('');
    try {
      await api.patch(`/admin/academy/registrations/${id}`, { [field]: value });
      setRegistrations((prev) => prev.map((r) => (r._id === id ? { ...r, [field]: value } : r)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update registration');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>Course Registrations</h1>
            <p className="admin-dashboard__subtitle">
              {courseIdFilter ? 'Registrations for this course.' : 'Interest registrations across all courses.'}
              {courseIdFilter && <> <Link to="/admin/academy/registrations">(clear filter)</Link></>}
            </p>
          </div>
        </div>
      </Reveal>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p>Loading registrations...</p>
        ) : registrations.length === 0 ? (
          <p>No registrations yet.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Course</th>
                <th>Cohort</th>
                <th>Contact</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r) => {
                const isBusy = busyId === r._id;
                return (
                  <tr key={r._id}>
                    <td>{r.full_name}</td>
                    <td>{r.course_id?.title || '—'}</td>
                    <td>{r.cohort_id?.name || '—'}</td>
                    <td>{r.email}<br />{r.phone}</td>
                    <td>
                      <select value={r.payment_status} disabled={isBusy} onChange={(e) => updateField(r._id, 'payment_status', e.target.value)}>
                        {PAYMENT_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={r.status} disabled={isBusy} onChange={(e) => updateField(r._id, 'status', e.target.value)}>
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>{new Date(r.submitted_at).toLocaleDateString()}</td>
                    <td>
                      <button type="button" className="btn btn--ghost" onClick={() => setViewing(r)}>View</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {viewing && (
        <Modal title={viewing.full_name} onClose={() => setViewing(null)}>
          <p className="modal__meta">{viewing.email} · {viewing.phone} · {new Date(viewing.submitted_at).toLocaleString()}</p>
          <p><strong>Course:</strong> {viewing.course_id?.title || '—'}{viewing.cohort_id?.name && ` · ${viewing.cohort_id.name}`}</p>
          <p><strong>Occupation/status:</strong> {viewing.occupation_status}</p>
          <p><strong>Experience level:</strong> {viewing.experience_level}</p>
          <p><strong>Reason for joining:</strong> {viewing.reason}</p>
          {viewing.how_heard && <p><strong>How they heard about us:</strong> {viewing.how_heard}</p>}
        </Modal>
      )}
    </div>
  );
}
