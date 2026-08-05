import { useEffect, useMemo, useState } from 'react';
import { Archive, ArchiveRestore, Briefcase, FileEdit, Plus, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import ListPageHeader from '../../components/common/ListPageHeader';
import StatCards from '../../components/common/StatCards';
import Toolbar from '../../components/admin/Toolbar';
import StatusPill from '../../components/admin/StatusPill';
import EmptyState from '../../components/common/EmptyState';
import GraduateJobFormModal from './GraduateJobFormModal';

const STATUS_TONE = { open: 'teal', closed: 'slate' };
const STATUSES = ['open', 'closed'];
const TYPE_LABELS = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
};

export default function AdminGraduateJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formState, setFormState] = useState(null); // null closed, {} new, job editing

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/graduate-jobs');
      setJobs(res.data.jobs);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load job listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusToggle = async (job) => {
    setBusyId(job._id);
    setError('');
    try {
      const nextStatus = job.status === 'open' ? 'closed' : 'open';
      await api.patch(`/admin/graduate-jobs/${job._id}`, { status: nextStatus });
      setJobs((prev) => prev.map((j) => (j._id === job._id ? { ...j, status: nextStatus } : j)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update job status');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (job) => {
    setBusyId(job._id);
    setError('');
    try {
      await api.delete(`/admin/graduate-jobs/${job._id}`);
      setJobs((prev) => prev.filter((j) => j._id !== job._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete job listing');
    } finally {
      setBusyId(null);
      setConfirmingId(null);
    }
  };

  const handleSaved = (savedJob) => {
    setJobs((prev) => {
      const exists = prev.some((j) => j._id === savedJob._id);
      return exists ? prev.map((j) => (j._id === savedJob._id ? savedJob : j)) : [savedJob, ...prev];
    });
    setFormState(null);
  };

  const stats = useMemo(() => ({
    total: jobs.length,
    open: jobs.filter((j) => j.status === 'open').length,
    closed: jobs.filter((j) => j.status === 'closed').length,
  }), [jobs]);

  const visibleJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (statusFilter && j.status !== statusFilter) return false;
      if (!q) return true;
      return j.job_title.toLowerCase().includes(q) || j.company_name.toLowerCase().includes(q);
    });
  }, [jobs, search, statusFilter]);

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Graduate Job Board"
        subtitle="Post and manage job openings from partner companies, visible to Alumni Forum members."
        action={{ label: 'New Listing', icon: Plus, onClick: () => setFormState({}) }}
      />

      <StatCards stats={[
        { label: 'Total Listings', value: stats.total },
        { label: 'Open', value: stats.open, accent: true },
        { label: 'Closed', value: stats.closed },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by job title or company...">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading job listings...</p>
        ) : visibleJobs.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No job listings found"
            message={search || statusFilter ? 'No listings match your search or filter.' : 'Post your first graduate job listing to get started.'}
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Job Title</th>
                <th>Location</th>
                <th>Type</th>
                <th>Status</th>
                <th>Posted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleJobs.map((job) => (
                <tr key={job._id}>
                  <td>
                    <div className="admin-table__title-cell">
                      {job.company_logo_url ? (
                        <img src={job.company_logo_url} alt="" className="admin-table__thumb" />
                      ) : (
                        <span className="admin-table__thumb admin-table__thumb--placeholder" />
                      )}
                      <strong>{job.company_name}</strong>
                    </div>
                  </td>
                  <td>{job.job_title}</td>
                  <td>{job.location}</td>
                  <td>{TYPE_LABELS[job.employment_type] || job.employment_type}</td>
                  <td><StatusPill tone={STATUS_TONE[job.status]}>{job.status}</StatusPill></td>
                  <td className="payments-date">{new Date(job.posted_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    {confirmingId === job._id ? (
                      <span className="confirm-delete">
                        <span>Delete this listing?</span>
                        <button type="button" className="btn btn--danger" disabled={busyId === job._id} onClick={() => handleDelete(job)}>
                          {busyId === job._id ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(null)}>Cancel</button>
                      </span>
                    ) : (
                      <>
                        <button type="button" className="btn btn--ghost" onClick={() => setFormState(job)}>
                          <FileEdit size={14} aria-hidden="true" /> Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost"
                          disabled={busyId === job._id}
                          onClick={() => handleStatusToggle(job)}
                        >
                          {job.status === 'closed' ? (
                            <><ArchiveRestore size={14} aria-hidden="true" /> Reopen</>
                          ) : (
                            <><Archive size={14} aria-hidden="true" /> Close</>
                          )}
                        </button>
                        {job.status === 'closed' && (
                          <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(job._id)}>
                            <Trash2 size={14} aria-hidden="true" /> Delete
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formState !== null && (
        <GraduateJobFormModal
          job={formState._id ? formState : null}
          onClose={() => setFormState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
