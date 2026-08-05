import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import api from '../../api/axios';
import ListPageHeader from '../../components/common/ListPageHeader';
import StatCards from '../../components/common/StatCards';
import Toolbar from '../../components/admin/Toolbar';
import EmptyState from '../../components/common/EmptyState';

// Read-only by design — there is no edit/delete affordance anywhere on this
// page, and the backend exposes no write endpoints for this resource. If
// old entries ever need pruning for storage, that's a deliberate DB-level
// action, not something this UI should offer.
const formatActionType = (actionType) => actionType.split('.').join(' — ').split('_').join(' ');

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionTypes, setActionTypes] = useState([]);
  const [actors, setActors] = useState([]);
  const [actionTypeFilter, setActionTypeFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    api.get('/admin/audit-log/meta')
      .then((res) => {
        setActionTypes(res.data.action_types);
        setActors(res.data.actors);
      })
      .catch(() => {});
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page };
      if (actionTypeFilter) params.action_type = actionTypeFilter;
      if (actorFilter) params.actor_id = actorFilter;
      if (fromFilter) params.from = fromFilter;
      if (toFilter) params.to = toFilter;

      const res = await api.get('/admin/audit-log', { params });
      setEntries(res.data.entries);
      setPages(res.data.pages);
      setTotal(res.data.total);

      const todayStr = new Date().toISOString().slice(0, 10);
      const todayRes = await api.get('/admin/audit-log', { params: { from: todayStr, to: todayStr, limit: 1 } });
      setTodayCount(todayRes.data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, actionTypeFilter, actorFilter, fromFilter, toFilter]);

  const handleFilterChange = (setter) => (value) => {
    setPage(1);
    setter(value);
  };

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Audit Log"
        subtitle="A read-only, chronological record of sensitive actions taken across the platform. Entries cannot be edited or deleted here."
      />

      <StatCards stats={[
        { label: 'Total Logged Actions', value: total },
        { label: 'Actions Today', value: todayCount },
        { label: 'Distinct Action Types', value: actionTypes.length },
      ]} />

      <Toolbar>
        <select value={actionTypeFilter} onChange={(e) => handleFilterChange(setActionTypeFilter)(e.target.value)}>
          <option value="">All action types</option>
          {actionTypes.map((type) => (
            <option key={type} value={type}>{formatActionType(type)}</option>
          ))}
        </select>
        <select value={actorFilter} onChange={(e) => handleFilterChange(setActorFilter)(e.target.value)}>
          <option value="">All admins</option>
          {actors.map((actor) => (
            <option key={actor._id} value={actor._id}>{actor.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={fromFilter}
          onChange={(e) => handleFilterChange(setFromFilter)(e.target.value)}
          aria-label="From date"
        />
        <input
          type="date"
          value={toFilter}
          onChange={(e) => handleFilterChange(setToFilter)(e.target.value)}
          aria-label="To date"
        />
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading audit log...</p>
        ) : entries.length === 0 ? (
          <EmptyState icon={ScrollText} title="No entries found" message="No audit log entries match this filter." />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry._id}>
                  <td className="payments-date">{new Date(entry.created_at).toLocaleString()}</td>
                  <td>{entry.actor_id?.name || 'Unknown'}</td>
                  <td><code>{entry.action_type}</code></td>
                  <td>{entry.target_type}{entry.target_id ? ` #${String(entry.target_id).slice(-6)}` : ''}</td>
                  <td>{entry.details || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="admin-pagination">
          <button type="button" className="btn btn--ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>Page {page} of {pages}</span>
          <button type="button" className="btn btn--ghost" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
