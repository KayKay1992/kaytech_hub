import { useEffect, useMemo, useState } from 'react';
import { MessageSquareQuote } from 'lucide-react';
import api from '../../api/axios';
import ListPageHeader from '../../components/common/ListPageHeader';
import StatCards from '../../components/common/StatCards';
import Toolbar from '../../components/admin/Toolbar';
import StatusPill from '../../components/admin/StatusPill';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

const STATUS_TONE = { pending: 'amber', approved: 'teal', rejected: 'danger' };
const STATUSES = ['pending', 'approved', 'rejected'];

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
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
      const res = await api.get('/admin/testimonials');
      setTestimonials(res.data.testimonials);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateTestimonial = async (id, patch) => {
    setBusyId(id);
    setError('');
    try {
      const res = await api.patch(`/admin/testimonials/${id}`, patch);
      setTestimonials((prev) => prev.map((t) => (t._id === id ? res.data.testimonial : t)));
      setViewing((prev) => (prev && prev._id === id ? res.data.testimonial : prev));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update testimonial');
    } finally {
      setBusyId(null);
    }
  };

  const stats = useMemo(() => ({
    total: testimonials.length,
    pending: testimonials.filter((t) => t.status === 'pending').length,
    approved: testimonials.filter((t) => t.status === 'approved').length,
    featured: testimonials.filter((t) => t.featured).length,
  }), [testimonials]);

  const visibleTestimonials = useMemo(() => {
    const q = search.trim().toLowerCase();
    return testimonials.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (!q) return true;
      return `${t.name} ${t.role_or_organization || ''}`.toLowerCase().includes(q);
    });
  }, [testimonials, search, statusFilter]);

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Testimonials"
        subtitle="Moderate testimonials submitted by students, mentees, clients, and workspace members."
      />

      <StatCards stats={[
        { label: 'Total Submissions', value: stats.total },
        { label: 'Pending', value: stats.pending, accent: true },
        { label: 'Approved', value: stats.approved },
        { label: 'Featured', value: stats.featured },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by name or role...">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading testimonials...</p>
        ) : visibleTestimonials.length === 0 ? (
          <EmptyState
            icon={MessageSquareQuote}
            title="No testimonials found"
            message={search || statusFilter ? 'No testimonials match your search or filter.' : 'Submitted testimonials will appear here.'}
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role / Organization</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleTestimonials.map((t) => (
                <tr key={t._id}>
                  <td>{t.name}</td>
                  <td>{t.role_or_organization || '—'}</td>
                  <td>{t.rating ? `${t.rating} ★` : '—'}</td>
                  <td><StatusPill tone={STATUS_TONE[t.status]}>{t.status}</StatusPill></td>
                  <td>{t.featured ? <StatusPill tone="teal">Featured</StatusPill> : '—'}</td>
                  <td className="payments-date">{new Date(t.submitted_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    <button type="button" className="btn btn--ghost" onClick={() => setViewing(t)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewing && (
        <Modal title={viewing.name} onClose={() => setViewing(null)}>
          <p className="modal__meta">
            {viewing.role_or_organization || 'No role given'} · {new Date(viewing.submitted_at).toLocaleString()}
          </p>
          {viewing.submitted_by_user_id && (
            <p><strong>Account:</strong> {viewing.submitted_by_user_id.name} ({viewing.submitted_by_user_id.email})</p>
          )}
          {viewing.rating && <p><strong>Rating:</strong> {viewing.rating} ★</p>}
          {viewing.photo_url && <img src={viewing.photo_url} alt="" className="admin-image-preview" />}
          <p>&ldquo;{viewing.message}&rdquo;</p>

          <label>
            Status
            <select
              value={viewing.status}
              disabled={busyId === viewing._id}
              onChange={(e) => updateTestimonial(viewing._id, { status: e.target.value })}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <label style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={viewing.featured}
              disabled={busyId === viewing._id || viewing.status !== 'approved'}
              onChange={(e) => updateTestimonial(viewing._id, { featured: e.target.checked })}
            />
            Feature on Home page {viewing.status !== 'approved' && '(approve first)'}
          </label>
        </Modal>
      )}
    </div>
  );
}
