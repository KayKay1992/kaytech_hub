import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import api from '../../../api/axios';
import ListPageHeader from '../../../components/common/ListPageHeader';
import StatCards from '../../../components/common/StatCards';
import Toolbar from '../../../components/admin/Toolbar';
import StatusPill from '../../../components/admin/StatusPill';
import EmptyState from '../../../components/common/EmptyState';

const STAGE_TONE = {
  new: 'amber', contacted: 'teal', proposal_sent: 'teal',
  negotiating: 'teal', won: 'teal', lost: 'danger',
};
const STAGES = ['new', 'contacted', 'proposal_sent', 'negotiating', 'won', 'lost'];
const STAGE_LABELS = {
  new: 'New', contacted: 'Contacted', proposal_sent: 'Proposal Sent',
  negotiating: 'Negotiating', won: 'Won', lost: 'Lost',
};
const TRAINING_TYPE_LABELS = {
  staff_training: 'Staff Training', ai_training: 'AI Training',
  software_training: 'Software Training', other: 'Other',
};

export default function AdminCorporateTraining() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/corporate-training/requests');
      setRequests(res.data.requests);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load corporate training requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: requests.length,
    new: requests.filter((r) => r.stage === 'new').length,
    active: requests.filter((r) => ['contacted', 'proposal_sent', 'negotiating'].includes(r.stage)).length,
    won: requests.filter((r) => r.stage === 'won').length,
  }), [requests]);

  const visibleRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (stageFilter && r.stage !== stageFilter) return false;
      if (!q) return true;
      return `${r.company_name} ${r.contact_person_name} ${r.contact_email}`.toLowerCase().includes(q);
    });
  }, [requests, search, stageFilter]);

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Corporate Training"
        subtitle={<>Sales pipeline for company training requests. <Link to="/admin/corporate-clients">View Clients &rarr;</Link></>}
      />

      <StatCards stats={[
        { label: 'Total Requests', value: stats.total },
        { label: 'New', value: stats.new, accent: true },
        { label: 'In Pipeline', value: stats.active },
        { label: 'Won', value: stats.won },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by company, contact, or email...">
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading requests...</p>
        ) : visibleRequests.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No requests found"
            message={search || stageFilter ? 'No requests match your search or filter.' : 'Corporate training requests will appear here once submitted.'}
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Training Type</th>
                <th>Stage</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map((r) => (
                <tr key={r._id}>
                  <td><strong>{r.company_name}</strong></td>
                  <td>{r.contact_person_name}<br /><span className="payments-muted">{r.contact_email}</span></td>
                  <td>{TRAINING_TYPE_LABELS[r.training_type] || r.training_type}</td>
                  <td><StatusPill tone={STAGE_TONE[r.stage]}>{STAGE_LABELS[r.stage]}</StatusPill></td>
                  <td className="payments-date">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/corporate-training/${r._id}`} className="btn btn--primary">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
