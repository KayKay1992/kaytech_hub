import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, FileEdit, GraduationCap, Plus } from 'lucide-react';
import api from '../../../api/axios';
import ListPageHeader from '../../../components/common/ListPageHeader';
import StatCards from '../../../components/common/StatCards';
import Toolbar from '../../../components/admin/Toolbar';
import StatusPill from '../../../components/admin/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import MentorshipFormModal from './MentorshipFormModal';

const STATUS_TONE = { open: 'teal', closed: 'slate' };
const STATUSES = ['open', 'closed'];

export default function AdminMentorship() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formState, setFormState] = useState(null); // null closed, {} new, program editing

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/mentorship');
      setPrograms(res.data.programs);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load mentorship programs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusToggle = async (program) => {
    setBusyId(program._id);
    setError('');
    try {
      const nextStatus = program.status === 'open' ? 'closed' : 'open';
      await api.patch(`/admin/mentorship/${program._id}`, { status: nextStatus });
      setPrograms((prev) => prev.map((p) => (p._id === program._id ? { ...p, status: nextStatus } : p)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update program status');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaved = (savedProgram) => {
    setPrograms((prev) => {
      const exists = prev.some((p) => p._id === savedProgram._id);
      return exists ? prev.map((p) => (p._id === savedProgram._id ? savedProgram : p)) : [savedProgram, ...prev];
    });
    setFormState(null);
  };

  const stats = useMemo(() => ({
    total: programs.length,
    open: programs.filter((p) => p.status === 'open').length,
    closed: programs.filter((p) => p.status === 'closed').length,
  }), [programs]);

  const visiblePrograms = useMemo(() => {
    const q = search.trim().toLowerCase();
    return programs.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (!q) return true;
      return p.title.toLowerCase().includes(q);
    });
  }, [programs, search, statusFilter]);

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Mentorship Programs"
        subtitle="Create, edit, and close mentorship programs."
        action={{ label: 'New Program', icon: Plus, onClick: () => setFormState({}) }}
      />

      <StatCards stats={[
        { label: 'Total Programs', value: stats.total },
        { label: 'Open', value: stats.open, accent: true },
        { label: 'Closed', value: stats.closed },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by title...">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading mentorship programs...</p>
        ) : visiblePrograms.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="No mentorship programs found"
            message={search || statusFilter ? 'No programs match your search or filter.' : 'Create your first mentorship program to get started.'}
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Price</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePrograms.map((program) => (
                <tr key={program._id}>
                  <td>
                    <div className="admin-table__title-cell">
                      {program.image_url ? (
                        <img src={program.image_url} alt="" className="admin-table__thumb" />
                      ) : (
                        <span className="admin-table__thumb admin-table__thumb--placeholder" />
                      )}
                      <strong>{program.title}</strong>
                    </div>
                  </td>
                  <td>₦{Number(program.price).toLocaleString()}</td>
                  <td>{program.duration}</td>
                  <td><StatusPill tone={STATUS_TONE[program.status]}>{program.status}</StatusPill></td>
                  <td className="payments-date">{new Date(program.created_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    <button type="button" className="btn btn--ghost" onClick={() => setFormState(program)}>
                      <FileEdit size={14} aria-hidden="true" /> Edit
                    </button>
                    <Link to={`/admin/mentorship-registrations?program_id=${program._id}`} className="btn btn--ghost">Registrations</Link>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={busyId === program._id}
                      onClick={() => handleStatusToggle(program)}
                    >
                      {program.status === 'closed' ? (
                        <><ArchiveRestore size={14} aria-hidden="true" /> Reopen</>
                      ) : (
                        <><Archive size={14} aria-hidden="true" /> Close</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formState !== null && (
        <MentorshipFormModal
          program={formState._id ? formState : null}
          onClose={() => setFormState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
