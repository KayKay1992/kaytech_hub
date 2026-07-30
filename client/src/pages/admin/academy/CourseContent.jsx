import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/axios';
import StatusBadge from '../../../components/academy/StatusBadge';

export default function AdminCourseContent() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/admin/academy/courses/${id}/content`);
      setCourse(res.data.course);
      setModules(res.data.modules);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const review = async (kind, itemId, action) => {
    setBusyId(itemId);
    setError('');
    try {
      await api.patch(`/admin/academy/approvals/${kind}/${itemId}`, { action });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (kind, itemId) => {
    setBusyId(itemId);
    setError('');
    try {
      await api.delete(`/admin/academy/${kind}/${itemId}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  const renderModerationActions = (kind, item) => {
    const isBusy = busyId === item._id;
    if (confirmingId === item._id) {
      return (
        <span className="confirm-delete">
          <span>Delete?</span>
          <button type="button" className="btn btn--danger" disabled={isBusy} onClick={() => handleDelete(kind, item._id)}>
            {isBusy ? '...' : 'Confirm'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(null)}>Cancel</button>
        </span>
      );
    }
    return (
      <span className="admin-table__actions">
        {item.status === 'pending' && (
          <>
            <button type="button" className="btn btn--primary" disabled={isBusy} onClick={() => review(kind, item._id, 'approve')}>Approve</button>
            <button type="button" className="btn btn--ghost" disabled={isBusy} onClick={() => review(kind, item._id, 'reject')}>Reject</button>
          </>
        )}
        <button type="button" className="btn btn--ghost" disabled={isBusy} onClick={() => setConfirmingId(item._id)}>Delete</button>
      </span>
    );
  };

  if (loading) return <div className="admin-dashboard"><p>Loading...</p></div>;

  return (
    <div className="admin-dashboard">
      <h1>{course?.title || 'Course Content'}</h1>
      <p className="admin-dashboard__subtitle">
        <Link to="/admin/academy/courses">&larr; Back to Courses</Link>
      </p>

      {error && <p className="form-error">{error}</p>}

      {modules.length === 0 ? (
        <p>No modules submitted for this course yet.</p>
      ) : (
        modules.map((mod) => (
          <div className="academy-module" key={mod._id}>
            <div className="academy-module__header">
              <h3>{mod.title}</h3>
              <StatusBadge status={mod.status} />
              {renderModerationActions('modules', mod)}
            </div>
            {mod.rejection_reason && <p className="academy-rejection-note">Rejection note: {mod.rejection_reason}</p>}

            {mod.lessons.length === 0 ? (
              <p className="academy-lesson-list__empty">No lessons in this module yet.</p>
            ) : (
              <ul className="academy-lesson-list">
                {mod.lessons.map((lesson) => (
                  <li className="academy-lesson" key={lesson._id}>
                    <div className="academy-lesson__row">
                      <span>{lesson.title}</span>
                      <StatusBadge status={lesson.status} />
                      {renderModerationActions('lessons', lesson)}
                    </div>
                    {lesson.rejection_reason && <p className="academy-rejection-note">Rejection note: {lesson.rejection_reason}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}
    </div>
  );
}
