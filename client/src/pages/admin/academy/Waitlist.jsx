import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';
import Modal from '../../../components/common/Modal';
import StatusPill from '../../../components/admin/StatusPill';

const STATUS_TONE = { waiting: 'amber', notified: 'teal', converted: 'slate' };

export default function AdminWaitlist() {
  const [searchParams] = useSearchParams();
  const courseIdFilter = searchParams.get('course_id') || '';
  const cohortIdFilter = searchParams.get('cohort_id') || '';

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [converting, setConverting] = useState(null); // waitlist entry object
  const [cohortOptions, setCohortOptions] = useState([]);
  const [pickedCohortId, setPickedCohortId] = useState('');
  const [convertError, setConvertError] = useState('');
  const [convertSaving, setConvertSaving] = useState(false);

  const [notifying, setNotifying] = useState(false);
  const [notifyCohortId, setNotifyCohortId] = useState('');
  const [notifyOptions, setNotifyOptions] = useState([]);
  const [notifyError, setNotifyError] = useState('');
  const [notifySuccess, setNotifySuccess] = useState('');
  const [notifySaving, setNotifySaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (courseIdFilter) params.course_id = courseIdFilter;
      if (cohortIdFilter) params.cohort_id = cohortIdFilter;
      const res = await api.get('/admin/academy/waitlist', { params });
      setEntries(res.data.entries);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load waitlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseIdFilter, cohortIdFilter]);

  const openConvert = async (entry) => {
    setConverting(entry);
    setConvertError('');
    setPickedCohortId('');
    try {
      const res = await api.get('/admin/academy/cohorts', { params: { course_id: entry.course_id?._id } });
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
      await api.patch(`/admin/academy/waitlist/${converting._id}/convert`, { cohort_id: pickedCohortId });
      setEntries((prev) => prev.map((e) => (e._id === converting._id ? { ...e, status: 'converted' } : e)));
      setConverting(null);
    } catch (err) {
      setConvertError(err.response?.data?.message || 'Failed to convert waitlist entry');
    } finally {
      setConvertSaving(false);
    }
  };

  const openNotify = async () => {
    setNotifying(true);
    setNotifyError('');
    setNotifySuccess('');
    setNotifyCohortId('');
    try {
      const res = await api.get('/admin/academy/cohorts', { params: { course_id: courseIdFilter } });
      setNotifyOptions(res.data.cohorts);
    } catch {
      setNotifyOptions([]);
    }
  };

  const handleNotify = async (e) => {
    e.preventDefault();
    setNotifyError('');
    if (!notifyCohortId) {
      setNotifyError('Please select a cohort to announce.');
      return;
    }
    setNotifySaving(true);
    try {
      const res = await api.post(`/admin/academy/courses/${courseIdFilter}/waitlist/notify`, { cohort_id: notifyCohortId });
      setNotifySuccess(`Notified ${res.data.notified} waitlisted ${res.data.notified === 1 ? 'person' : 'people'}.`);
      load();
    } catch (err) {
      setNotifyError(err.response?.data?.message || 'Failed to notify waitlist');
    } finally {
      setNotifySaving(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>Cohort Waitlist</h1>
            <p className="admin-dashboard__subtitle">
              {courseIdFilter || cohortIdFilter
                ? 'Waitlist entries for this course.'
                : 'Everyone waiting for a full cohort to open a new run, across all courses.'}
              {(courseIdFilter || cohortIdFilter) && <> <Link to="/admin/academy/waitlist">(clear filter)</Link></>}
            </p>
          </div>
          {courseIdFilter && (
            <button type="button" className="btn btn--primary" onClick={openNotify}>Notify Waitlist</button>
          )}
        </div>
      </Reveal>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p>Loading waitlist...</p>
        ) : entries.length === 0 ? (
          <p>No waitlist entries yet.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Course</th>
                <th>Waitlisted From</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry._id}>
                  <td>{entry.name}</td>
                  <td>{entry.course_id?.title || '—'}</td>
                  <td>{entry.cohort_id?.name || '—'}</td>
                  <td>{entry.email}<br />{entry.phone}</td>
                  <td><StatusPill tone={STATUS_TONE[entry.status]}>{entry.status}</StatusPill></td>
                  <td className="payments-date">{new Date(entry.joined_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    {entry.status !== 'converted' && (
                      <button type="button" className="btn btn--ghost" onClick={() => openConvert(entry)}>Convert</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {converting && (
        <Modal title={`Convert: ${converting.name}`} onClose={() => setConverting(null)}>
          <p className="modal__meta">
            Requires a student account already signed up with {converting.email} via invite code.
          </p>
          <form className="auth-form" onSubmit={handleConvert}>
            {convertError && <p className="form-error">{convertError}</p>}

            <label>
              Cohort to enroll them in
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

      {notifying && (
        <Modal title="Notify Waitlist" onClose={() => setNotifying(false)}>
          <p className="modal__meta">
            Emails everyone still waiting on this course's waitlist that a new cohort has opened.
          </p>
          <form className="auth-form" onSubmit={handleNotify}>
            {notifyError && <p className="form-error">{notifyError}</p>}
            {notifySuccess && <p className="form-success">{notifySuccess}</p>}

            <label>
              New cohort to announce
              <select value={notifyCohortId} onChange={(e) => setNotifyCohortId(e.target.value)} required>
                <option value="">Select a cohort...</option>
                {notifyOptions.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} ({new Date(c.start_date).toLocaleDateString()})</option>
                ))}
              </select>
            </label>

            <button type="submit" className="btn btn--primary btn--full" disabled={notifySaving}>
              {notifySaving ? 'Sending...' : 'Send Notification Emails'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
