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

  const [converting, setConverting] = useState(null); // registration object
  const [cohortOptions, setCohortOptions] = useState([]);
  const [pickedCohortId, setPickedCohortId] = useState('');
  const [convertError, setConvertError] = useState('');
  const [convertSaving, setConvertSaving] = useState(false);

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

  const openConvert = async (registration) => {
    setConverting(registration);
    setConvertError('');
    setPickedCohortId(registration.cohort_id?._id || '');
    try {
      const res = await api.get('/admin/academy/cohorts', { params: { course_id: registration.course_id?._id } });
      setCohortOptions(res.data.cohorts);
    } catch {
      setCohortOptions([]);
    }
  };

  const handleConvert = async (e) => {
    e.preventDefault();
    setConvertError('');
    if (!pickedCohortId) {
      setConvertError('Please select a cohort.');
      return;
    }
    setConvertSaving(true);
    try {
      await api.patch(`/admin/academy/registrations/${converting._id}/convert`, { cohort_id: pickedCohortId });
      setRegistrations((prev) => prev.map((r) => (r._id === converting._id ? { ...r, status: 'converted' } : r)));
      setConverting(null);
    } catch (err) {
      setConvertError(err.response?.data?.message || 'Failed to convert registration');
    } finally {
      setConvertSaving(false);
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
                const isConverted = r.status === 'converted';
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
                      {isConverted ? (
                        <span className="invite-status invite-status--unused">converted</span>
                      ) : (
                        <select value={r.status} disabled={isBusy} onChange={(e) => updateField(r._id, 'status', e.target.value)}>
                          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                    </td>
                    <td>{new Date(r.submitted_at).toLocaleDateString()}</td>
                    <td className="admin-table__actions">
                      <button type="button" className="btn btn--ghost" onClick={() => setViewing(r)}>View</button>
                      {!isConverted && (
                        <button type="button" className="btn btn--ghost" onClick={() => openConvert(r)}>Convert</button>
                      )}
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

      {converting && (
        <Modal title={`Convert: ${converting.full_name}`} onClose={() => setConverting(null)}>
          <p className="modal__meta">
            Requires a student account already signed up with {converting.email} via invite code.
          </p>
          <form className="auth-form" onSubmit={handleConvert}>
            {convertError && <p className="form-error">{convertError}</p>}

            <label>
              Cohort
              <select value={pickedCohortId} onChange={(e) => setPickedCohortId(e.target.value)} required>
                <option value="">Select a cohort...</option>
                {cohortOptions.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} ({new Date(c.start_date).toLocaleDateString()})</option>
                ))}
              </select>
            </label>

            <button type="submit" className="btn btn--primary btn--full" disabled={convertSaving}>
              {convertSaving ? 'Converting...' : 'Create Enrollment'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
