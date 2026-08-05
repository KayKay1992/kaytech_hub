import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import api from '../../api/axios';
import ListPageHeader from '../../components/common/ListPageHeader';
import StatCards from '../../components/common/StatCards';
import Toolbar from '../../components/admin/Toolbar';
import StatusPill from '../../components/admin/StatusPill';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import StarRating from '../../components/common/StarRating';

const STATUS_TONE = { pending: 'amber', approved: 'teal', rejected: 'danger' };
const STATUSES = ['pending', 'approved', 'rejected'];

export default function AdminCourseReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewing, setViewing] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/course-reviews');
      setReviews(res.data.reviews);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load course reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateReview = async (id, status) => {
    setBusyId(id);
    setError('');
    try {
      const res = await api.patch(`/admin/course-reviews/${id}`, { status });
      setReviews((prev) => prev.map((r) => (r._id === id ? res.data.review : r)));
      setViewing((prev) => (prev && prev._id === id ? res.data.review : prev));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update review');
    } finally {
      setBusyId(null);
    }
  };

  const stats = useMemo(() => ({
    total: reviews.length,
    pending: reviews.filter((r) => r.status === 'pending').length,
    approved: reviews.filter((r) => r.status === 'approved').length,
    rejected: reviews.filter((r) => r.status === 'rejected').length,
  }), [reviews]);

  const visibleReviews = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      return `${r.student_id?.name || ''} ${r.course_id?.title || ''}`.toLowerCase().includes(q);
    });
  }, [reviews, search, statusFilter]);

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Course Reviews"
        subtitle="Moderate student reviews before they appear on public course pages."
      />

      <StatCards stats={[
        { label: 'Total Reviews', value: stats.total },
        { label: 'Pending', value: stats.pending, accent: true },
        { label: 'Approved', value: stats.approved },
        { label: 'Rejected', value: stats.rejected },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by student or course...">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading course reviews...</p>
        ) : visibleReviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No course reviews found"
            message={search || statusFilter ? 'No reviews match your search or filter.' : 'Student-submitted course reviews will appear here.'}
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleReviews.map((r) => (
                <tr key={r._id}>
                  <td>{r.student_id?.name || '—'}</td>
                  <td>{r.course_id?.title || '—'}</td>
                  <td><StarRating value={r.rating} size={14} /></td>
                  <td><StatusPill tone={STATUS_TONE[r.status]}>{r.status}</StatusPill></td>
                  <td className="payments-date">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    <button type="button" className="btn btn--ghost" onClick={() => setViewing(r)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewing && (
        <Modal title={`${viewing.student_id?.name || 'Student'} — ${viewing.course_id?.title || 'Course'}`} onClose={() => setViewing(null)}>
          <p className="modal__meta">
            {viewing.student_id?.name} ({viewing.student_id?.email}) · {new Date(viewing.created_at).toLocaleString()}
          </p>
          <StarRating value={viewing.rating} size={20} />
          <p>{viewing.review_text}</p>

          <div className="admin-table__actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn--primary"
              disabled={busyId === viewing._id || viewing.status === 'approved'}
              onClick={() => updateReview(viewing._id, 'approved')}
            >
              Approve
            </button>
            <button
              type="button"
              className="btn btn--danger"
              disabled={busyId === viewing._id || viewing.status === 'rejected'}
              onClick={() => updateReview(viewing._id, 'rejected')}
            >
              Reject
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
