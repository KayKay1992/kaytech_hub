import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users2 } from 'lucide-react';
import api from '../../../api/axios';
import ListPageHeader from '../../../components/common/ListPageHeader';
import StatCards from '../../../components/common/StatCards';
import Toolbar from '../../../components/admin/Toolbar';
import StatusPill from '../../../components/admin/StatusPill';
import EmptyState from '../../../components/common/EmptyState';

const STATUS_TONE = { active: 'teal', inactive: 'slate' };
const STATUSES = ['active', 'inactive'];

const money = (n) => `₦${Number(n || 0).toLocaleString()}`;

export default function AdminCorporateClients() {
  const [clients, setClients] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [clientsRes, revenueRes] = await Promise.all([
        api.get('/admin/corporate-training/clients'),
        api.get('/admin/corporate-training/revenue'),
      ]);
      setClients(clientsRes.data.clients);
      setTotalRevenue(revenueRes.data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter((c) => c.status === 'active').length,
    inactive: clients.filter((c) => c.status === 'inactive').length,
  }), [clients]);

  const visibleClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (!q) return true;
      return `${c.company_name} ${c.contact_person_name} ${c.contact_email}`.toLowerCase().includes(q);
    });
  }, [clients, search, statusFilter]);

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Corporate Clients"
        subtitle={<>Ongoing corporate training relationships. <Link to="/admin/corporate-training">View Pipeline &rarr;</Link></>}
      />

      <StatCards stats={[
        { label: 'Total Corporate Training Revenue', value: money(totalRevenue), accent: true },
        { label: 'Total Clients', value: stats.total },
        { label: 'Active', value: stats.active },
        { label: 'Inactive', value: stats.inactive },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by company, contact, or email...">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading clients...</p>
        ) : visibleClients.length === 0 ? (
          <EmptyState
            icon={Users2}
            title="No clients found"
            message={search || statusFilter ? 'No clients match your search or filter.' : 'Clients appear here once a corporate training request converts.'}
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Outstanding</th>
                <th>Client Since</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleClients.map((c) => (
                <tr key={c._id}>
                  <td><strong>{c.company_name}</strong></td>
                  <td>{c.contact_person_name}<br /><span className="payments-muted">{c.contact_email}</span></td>
                  <td><StatusPill tone={STATUS_TONE[c.status]}>{c.status}</StatusPill></td>
                  <td>
                    {c.outstanding_amount > 0 ? (
                      <StatusPill tone="amber">{money(c.outstanding_amount)} pending</StatusPill>
                    ) : (
                      <span className="payments-muted">Paid up</span>
                    )}
                  </td>
                  <td className="payments-date">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/corporate-clients/${c._id}`} className="btn btn--primary">View</Link>
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
