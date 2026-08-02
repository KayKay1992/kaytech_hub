import { useEffect, useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import api from '../../api/axios';
import ListPageHeader from '../../components/common/ListPageHeader';
import StatCards from '../../components/common/StatCards';
import Toolbar from '../../components/admin/Toolbar';
import StatusPill from '../../components/admin/StatusPill';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

const STATUS_TONE = { pending: 'amber', approved: 'teal', rejected: 'danger' };
const STATUSES = ['pending', 'approved', 'rejected'];

export default function AdminSuccessStories() {
  const [stories, setStories] = useState([]);
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
      const res = await api.get('/admin/success-stories');
      setStories(res.data.stories);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load success stories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateStory = async (id, patch) => {
    setBusyId(id);
    setError('');
    try {
      const res = await api.patch(`/admin/success-stories/${id}`, patch);
      setStories((prev) => prev.map((s) => (s._id === id ? res.data.story : s)));
      setViewing((prev) => (prev && prev._id === id ? res.data.story : prev));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update success story');
    } finally {
      setBusyId(null);
    }
  };

  const stats = useMemo(() => ({
    total: stories.length,
    pending: stories.filter((s) => s.status === 'pending').length,
    approved: stories.filter((s) => s.status === 'approved').length,
    featured: stories.filter((s) => s.featured).length,
  }), [stories]);

  const visibleStories = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stories.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (!q) return true;
      return `${s.headline} ${s.student_id?.name || ''}`.toLowerCase().includes(q);
    });
  }, [stories, search, statusFilter]);

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Success Stories"
        subtitle="Moderate stories students share about their outcomes after completing a cohort."
      />

      <StatCards stats={[
        { label: 'Total Submissions', value: stats.total },
        { label: 'Pending', value: stats.pending, accent: true },
        { label: 'Approved', value: stats.approved },
        { label: 'Featured', value: stats.featured },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by student or headline...">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading success stories...</p>
        ) : visibleStories.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No success stories found"
            message={search || statusFilter ? 'No stories match your search or filter.' : 'Student-submitted success stories will appear here.'}
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Headline</th>
                <th>Course</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleStories.map((s) => (
                <tr key={s._id}>
                  <td>{s.student_id?.name || '—'}</td>
                  <td>{s.headline}</td>
                  <td>{s.course_id?.title || '—'}</td>
                  <td><StatusPill tone={STATUS_TONE[s.status]}>{s.status}</StatusPill></td>
                  <td>{s.featured ? <StatusPill tone="teal">Featured</StatusPill> : '—'}</td>
                  <td className="payments-date">{new Date(s.submitted_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    <button type="button" className="btn btn--ghost" onClick={() => setViewing(s)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewing && (
        <Modal title={viewing.headline} onClose={() => setViewing(null)}>
          <p className="modal__meta">
            {viewing.student_id?.name} ({viewing.student_id?.email}) · {new Date(viewing.submitted_at).toLocaleString()}
          </p>
          {viewing.course_id?.title && <p><strong>Course:</strong> {viewing.course_id.title}</p>}
          {viewing.photo_url && <img src={viewing.photo_url} alt="" className="admin-image-preview" />}
          <p>{viewing.story}</p>

          <label>
            Status
            <select
              value={viewing.status}
              disabled={busyId === viewing._id}
              onChange={(e) => updateStory(viewing._id, { status: e.target.value })}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <label style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={viewing.featured}
              disabled={busyId === viewing._id || viewing.status !== 'approved'}
              onChange={(e) => updateStory(viewing._id, { featured: e.target.checked })}
            />
            Feature on Home page {viewing.status !== 'approved' && '(approve first)'}
          </label>
        </Modal>
      )}
    </div>
  );
}
