import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, Building2, FileEdit, Plus } from 'lucide-react';
import api from '../../../api/axios';
import ListPageHeader from '../../../components/common/ListPageHeader';
import StatCards from '../../../components/common/StatCards';
import Toolbar from '../../../components/admin/Toolbar';
import StatusPill from '../../../components/admin/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import PlanFormModal from './PlanFormModal';

const STATUS_TONE = { active: 'teal', inactive: 'slate' };
const STATUSES = ['active', 'inactive'];
const DURATIONS = ['day', 'week', 'month', 'year'];
const DURATION_LABELS = { day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Yearly' };

export default function AdminSpacePlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [formState, setFormState] = useState(null); // null closed, {} new, plan editing

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/space/plans');
      setPlans(res.data.plans);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load workspace plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusToggle = async (plan) => {
    setBusyId(plan._id);
    setError('');
    try {
      const nextStatus = plan.status === 'active' ? 'inactive' : 'active';
      await api.patch(`/admin/space/plans/${plan._id}`, { status: nextStatus });
      setPlans((prev) => prev.map((p) => (p._id === plan._id ? { ...p, status: nextStatus } : p)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update plan status');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaved = (savedPlan) => {
    setPlans((prev) => {
      const exists = prev.some((p) => p._id === savedPlan._id);
      return exists ? prev.map((p) => (p._id === savedPlan._id ? savedPlan : p)) : [savedPlan, ...prev];
    });
    setFormState(null);
  };

  const stats = useMemo(() => ({
    total: plans.length,
    active: plans.filter((p) => p.status === 'active').length,
    inactive: plans.filter((p) => p.status === 'inactive').length,
  }), [plans]);

  const visiblePlans = useMemo(() => {
    const q = search.trim().toLowerCase();
    return plans.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (durationFilter && p.duration !== durationFilter) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q);
    });
  }, [plans, search, statusFilter, durationFilter]);

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Workspace Plans"
        subtitle="Create, edit, and manage Space plans by duration."
        action={{ label: 'New Plan', icon: Plus, onClick: () => setFormState({}) }}
      />

      <StatCards stats={[
        { label: 'Total Plans', value: stats.total },
        { label: 'Active', value: stats.active, accent: true },
        { label: 'Inactive', value: stats.inactive },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by name...">
        <select value={durationFilter} onChange={(e) => setDurationFilter(e.target.value)}>
          <option value="">All durations</option>
          {DURATIONS.map((d) => <option key={d} value={d}>{DURATION_LABELS[d]}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading workspace plans...</p>
        ) : visiblePlans.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No workspace plans found"
            message={search || statusFilter || durationFilter ? 'No plans match your search or filter.' : 'Create your first workspace plan to get started.'}
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Perks</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePlans.map((plan) => (
                <tr key={plan._id}>
                  <td>
                    <div className="admin-table__title-cell">
                      {plan.image_url ? (
                        <img src={plan.image_url} alt="" className="admin-table__thumb" />
                      ) : (
                        <span className="admin-table__thumb admin-table__thumb--placeholder" />
                      )}
                      <strong>{plan.name}</strong>
                    </div>
                  </td>
                  <td>{DURATION_LABELS[plan.duration]}</td>
                  <td>₦{Number(plan.price).toLocaleString()}</td>
                  <td>{plan.perks.length}</td>
                  <td><StatusPill tone={STATUS_TONE[plan.status]}>{plan.status}</StatusPill></td>
                  <td className="payments-date">{new Date(plan.created_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    <button type="button" className="btn btn--ghost" onClick={() => setFormState(plan)}>
                      <FileEdit size={14} aria-hidden="true" /> Edit
                    </button>
                    <Link to={`/admin/space/subscriptions?plan_id=${plan._id}`} className="btn btn--ghost">Subscriptions</Link>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={busyId === plan._id}
                      onClick={() => handleStatusToggle(plan)}
                    >
                      {plan.status === 'inactive' ? (
                        <><ArchiveRestore size={14} aria-hidden="true" /> Activate</>
                      ) : (
                        <><Archive size={14} aria-hidden="true" /> Deactivate</>
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
        <PlanFormModal
          plan={formState._id ? formState : null}
          onClose={() => setFormState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
