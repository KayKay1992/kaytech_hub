import { useEffect, useState } from 'react';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';
import Modal from '../../../components/common/Modal';

export default function Approvals() {
  const [tab, setTab] = useState('modules');
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [rejecting, setRejecting] = useState(null); // { kind, id }
  const [rejectionReason, setRejectionReason] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [modulesRes, lessonsRes] = await Promise.all([
        api.get('/admin/academy/approvals/modules'),
        api.get('/admin/academy/approvals/lessons'),
      ]);
      setModules(modulesRes.data.modules);
      setLessons(lessonsRes.data.lessons);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load approval queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const approve = async (kind, id) => {
    setBusyId(id);
    setError('');
    try {
      await api.patch(`/admin/academy/approvals/${kind}/${id}`, { action: 'approve' });
      if (kind === 'modules') setModules((prev) => prev.filter((m) => m._id !== id));
      else setLessons((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve');
    } finally {
      setBusyId(null);
    }
  };

  const submitRejection = async () => {
    const { kind, id } = rejecting;
    setBusyId(id);
    setError('');
    try {
      await api.patch(`/admin/academy/approvals/${kind}/${id}`, { action: 'reject', rejection_reason: rejectionReason });
      if (kind === 'modules') setModules((prev) => prev.filter((m) => m._id !== id));
      else setLessons((prev) => prev.filter((l) => l._id !== id));
      setRejecting(null);
      setRejectionReason('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (kind, id) => {
    setBusyId(id);
    setError('');
    try {
      await api.delete(`/admin/academy/${kind}/${id}`);
      if (kind === 'modules') setModules((prev) => prev.filter((m) => m._id !== id));
      else setLessons((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  const renderActions = (kind, item) => {
    const isBusy = busyId === item._id;
    if (confirmingId === item._id) {
      return (
        <span className="confirm-delete">
          <span>Delete this {kind === 'modules' ? 'module' : 'lesson'}?</span>
          <button type="button" className="btn btn--danger" disabled={isBusy} onClick={() => handleDelete(kind, item._id)}>
            {isBusy ? 'Deleting...' : 'Confirm'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(null)}>Cancel</button>
        </span>
      );
    }
    return (
      <div className="admin-table__actions">
        <button type="button" className="btn btn--primary" disabled={isBusy} onClick={() => approve(kind, item._id)}>Approve</button>
        <button type="button" className="btn btn--ghost" disabled={isBusy} onClick={() => { setRejecting({ kind, id: item._id }); setRejectionReason(''); }}>Reject</button>
        <button type="button" className="btn btn--ghost" disabled={isBusy} onClick={() => setConfirmingId(item._id)}>Delete</button>
      </div>
    );
  };

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <h1>Approval Queue</h1>
        <p className="admin-dashboard__subtitle">Review Modules and Lessons instructors have submitted before students can see them.</p>
      </Reveal>

      <div className="notification-tabs">
        <button type="button" className={tab === 'modules' ? 'is-active' : ''} onClick={() => setTab('modules')}>
          Modules {modules.length > 0 && `(${modules.length})`}
        </button>
        <button type="button" className={tab === 'lessons' ? 'is-active' : ''} onClick={() => setTab('lessons')}>
          Lessons {lessons.length > 0 && `(${lessons.length})`}
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p>Loading...</p>
        ) : tab === 'modules' ? (
          modules.length === 0 ? <p>No pending modules.</p> : (
            <table className="invite-table">
              <thead>
                <tr>
                  <th>Module</th>
                  <th>Course</th>
                  <th>Submitted by</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m._id}>
                    <td>{m.title}</td>
                    <td>{m.course_id?.title || '—'}</td>
                    <td>{m.created_by?.name || '—'}</td>
                    <td>{new Date(m.created_at).toLocaleDateString()}</td>
                    <td>{renderActions('modules', m)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : (
          lessons.length === 0 ? <p>No pending lessons.</p> : (
            <table className="invite-table">
              <thead>
                <tr>
                  <th>Lesson</th>
                  <th>Module</th>
                  <th>Course</th>
                  <th>Submitted by</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((l) => (
                  <tr key={l._id}>
                    <td>{l.title}</td>
                    <td>{l.module_id?.title || '—'}</td>
                    <td>{l.module_id?.course_id?.title || '—'}</td>
                    <td>{l.created_by?.name || '—'}</td>
                    <td>{new Date(l.created_at).toLocaleDateString()}</td>
                    <td>{renderActions('lessons', l)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {rejecting && (
        <Modal title="Reject with feedback (optional)" onClose={() => setRejecting(null)}>
          <label>
            Reason for the instructor
            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Please add a coding exercise before resubmitting."
            />
          </label>
          <button type="button" className="btn btn--primary btn--full" disabled={busyId === rejecting.id} onClick={submitRejection}>
            {busyId === rejecting.id ? 'Rejecting...' : 'Reject'}
          </button>
        </Modal>
      )}
    </div>
  );
}
