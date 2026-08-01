import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, Boxes, FileEdit, Plus } from 'lucide-react';
import api from '../../../api/axios';
import ListPageHeader from '../../../components/common/ListPageHeader';
import StatCards from '../../../components/common/StatCards';
import Toolbar from '../../../components/admin/Toolbar';
import StatusPill from '../../../components/admin/StatusPill';
import EmptyState from '../../../components/common/EmptyState';

const STATUS_TONE = { active: 'teal', inactive: 'slate' };
const STATUSES = ['active', 'inactive'];
const CATEGORY_LABELS = {
  'web-development': 'Web Development',
  consultation: 'Consultation',
  branding: 'Branding',
  marketing: 'Marketing',
  'ai-integration': 'AI Integration',
};

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [servicesRes, revenueRes] = await Promise.all([
        api.get('/admin/services'),
        api.get('/admin/services/revenue'),
      ]);
      setServices(servicesRes.data.services);
      setTotalRevenue(revenueRes.data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusToggle = async (service) => {
    setBusyId(service._id);
    setError('');
    try {
      const nextStatus = service.status === 'active' ? 'inactive' : 'active';
      await api.patch(`/admin/services/${service._id}`, { status: nextStatus });
      setServices((prev) => prev.map((s) => (s._id === service._id ? { ...s, status: nextStatus } : s)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update service status');
    } finally {
      setBusyId(null);
    }
  };

  const stats = useMemo(() => ({
    total: services.length,
    active: services.filter((s) => s.status === 'active').length,
    inactive: services.filter((s) => s.status === 'inactive').length,
  }), [services]);

  const visibleServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (!q) return true;
      return `${s.title} ${s.category || ''}`.toLowerCase().includes(q);
    });
  }, [services, search, statusFilter]);

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Services"
        subtitle="Manage the services offered on the public Services page."
        action={{ label: 'New Service', icon: Plus, to: '/admin/services/new' }}
      />

      <StatCards stats={[
        { label: 'Total Service Revenue', value: `₦${Number(totalRevenue).toLocaleString()}`, accent: true },
        { label: 'Total Services', value: stats.total },
        { label: 'Active', value: stats.active },
        { label: 'Inactive', value: stats.inactive },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by title or category...">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading services...</p>
        ) : visibleServices.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title="No services found"
            message={search || statusFilter ? 'No services match your search or filter.' : 'Create your first service to get started.'}
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Starting Price</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleServices.map((service) => (
                <tr key={service._id}>
                  <td>
                    <div className="admin-table__title-cell">
                      {service.image_url ? (
                        <img src={service.image_url} alt="" className="admin-table__thumb" />
                      ) : (
                        <span className="admin-table__thumb admin-table__thumb--placeholder" />
                      )}
                      <div>
                        <strong>{service.title}</strong><br />
                        <span className="payments-muted">{CATEGORY_LABELS[service.category] || service.category}</span>
                      </div>
                    </div>
                  </td>
                  <td>{service.starting_price ? `₦${Number(service.starting_price).toLocaleString()}` : '—'}</td>
                  <td><StatusPill tone={STATUS_TONE[service.status]}>{service.status}</StatusPill></td>
                  <td className="payments-date">{new Date(service.created_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/services/${service._id}/edit`} className="btn btn--ghost">
                      <FileEdit size={14} aria-hidden="true" /> Edit
                    </Link>
                    <Link to={`/admin/service-requests?service_id=${service._id}`} className="btn btn--ghost">Requests</Link>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={busyId === service._id}
                      onClick={() => handleStatusToggle(service)}
                    >
                      {service.status === 'inactive' ? (
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
    </div>
  );
}
