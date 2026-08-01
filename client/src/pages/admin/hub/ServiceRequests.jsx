import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import api from '../../../api/axios';
import ListPageHeader from '../../../components/common/ListPageHeader';
import StatCards from '../../../components/common/StatCards';
import Toolbar from '../../../components/admin/Toolbar';
import StatusPill from '../../../components/admin/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import Modal from '../../../components/common/Modal';

const STATUS_TONE = { new: 'amber', contacted: 'teal', 'in-progress': 'teal', completed: 'slate' };
const STATUSES = ['new', 'contacted', 'in-progress', 'completed'];
const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];
const methodLabel = (value) => PAYMENT_METHODS.find((m) => m.value === value)?.label || value;
const money = (n) => `₦${Number(n || 0).toLocaleString()}`;
const todayStr = () => new Date().toISOString().slice(0, 10);
const emptyPaymentForm = { amount: '', payment_method: '', date: todayStr(), note: '' };

export default function AdminServiceRequests() {
  const [searchParams] = useSearchParams();
  const serviceIdFilter = searchParams.get('service_id') || '';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewing, setViewing] = useState(null);
  const [viewingPayments, setViewingPayments] = useState([]);
  const [viewingPaymentsLoading, setViewingPaymentsLoading] = useState(false);

  const [payingRequest, setPayingRequest] = useState(null);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (serviceIdFilter) params.service_id = serviceIdFilter;
      const res = await api.get('/admin/services/requests', { params });
      setRequests(res.data.requests);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load service requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceIdFilter]);

  useEffect(() => {
    if (!viewing) {
      setViewingPayments([]);
      return;
    }
    setViewingPaymentsLoading(true);
    api.get(`/admin/services/requests/${viewing._id}/payments`)
      .then((res) => setViewingPayments(res.data.payments))
      .catch(() => setViewingPayments([]))
      .finally(() => setViewingPaymentsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewing?._id]);

  const updateStatus = async (id, status) => {
    setBusyId(id);
    setError('');
    try {
      await api.patch(`/admin/services/requests/${id}`, { status });
      setRequests((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
      setViewing((prev) => (prev && prev._id === id ? { ...prev, status } : prev));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update request status');
    } finally {
      setBusyId(null);
    }
  };

  const openPayment = (request) => {
    setViewing(null);
    setPayingRequest(request);
    setPaymentForm(emptyPaymentForm);
    setPaymentError('');
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPaymentError('');
    const { amount, payment_method } = paymentForm;
    if (!amount || Number(amount) <= 0) {
      setPaymentError('Please enter a valid payment amount.');
      return;
    }
    if (!payment_method) {
      setPaymentError('Please select a payment method.');
      return;
    }
    setPaymentSaving(true);
    try {
      await api.post(`/admin/services/requests/${payingRequest._id}/payments`, paymentForm);
      setViewing(payingRequest);
      setPayingRequest(null);
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentSaving(false);
    }
  };

  const stats = useMemo(() => ({
    total: requests.length,
    new: requests.filter((r) => r.status === 'new').length,
    inProgress: requests.filter((r) => r.status === 'contacted' || r.status === 'in-progress').length,
    completed: requests.filter((r) => r.status === 'completed').length,
  }), [requests]);

  const visibleRequests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      return `${r.name} ${r.email} ${r.company_name || ''}`.toLowerCase().includes(q);
    });
  }, [requests, search, statusFilter]);

  const viewingPaymentsTotal = viewingPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Service Requests"
        subtitle={serviceIdFilter
          ? <>Requests for this service. <Link to="/admin/service-requests">(clear filter)</Link></>
          : 'Consulting requests submitted across all services.'}
      />

      <StatCards stats={[
        { label: 'Total Requests', value: stats.total },
        { label: 'New', value: stats.new, accent: true },
        { label: 'In Progress', value: stats.inProgress },
        { label: 'Completed', value: stats.completed },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by name, email, or company...">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading requests...</p>
        ) : visibleRequests.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No requests found"
            message={search || statusFilter ? 'No requests match your search or filter.' : 'Service requests will appear here once submitted.'}
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Service</th>
                <th>Company</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map((r) => (
                <tr key={r._id}>
                  <td>{r.name}</td>
                  <td>{r.service_id?.title || '—'}</td>
                  <td>{r.company_name || '—'}</td>
                  <td><StatusPill tone={STATUS_TONE[r.status]}>{r.status}</StatusPill></td>
                  <td className="payments-date">{new Date(r.submitted_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    <button type="button" className="btn btn--ghost" onClick={() => setViewing(r)}>View</button>
                    <button type="button" className="btn btn--primary" onClick={() => openPayment(r)}>Record Payment</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {viewing && (
        <Modal title={viewing.name} onClose={() => setViewing(null)}>
          <p className="modal__meta">{viewing.email} · {viewing.phone} · {new Date(viewing.submitted_at).toLocaleString()}</p>
          <p><strong>Service:</strong> {viewing.service_id?.title || '—'}</p>
          {viewing.company_name && <p><strong>Company:</strong> {viewing.company_name}</p>}
          <p><strong>Message:</strong> {viewing.message}</p>

          <label>
            Status
            <select
              value={viewing.status}
              disabled={busyId === viewing._id}
              onChange={(e) => updateStatus(viewing._id, e.target.value)}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>

          <div className="payout-student-list" style={{ marginTop: 20 }}>
            <p className="modal__meta">
              <strong>Payments recorded:</strong> {money(viewingPaymentsTotal)}
              {viewingPayments.length > 0 ? ` across ${viewingPayments.length} payment${viewingPayments.length === 1 ? '' : 's'}` : ''}
            </p>
            {viewingPaymentsLoading ? (
              <p className="payments-empty">Loading payments...</p>
            ) : viewingPayments.length === 0 ? (
              <p className="payments-empty">No payments recorded yet.</p>
            ) : (
              viewingPayments.map((p) => (
                <div className="payout-student-row" key={p._id}>
                  <div className="payout-student-row__info">
                    <strong>{money(p.amount)}</strong>
                    <span className="payments-muted">
                      {methodLabel(p.payment_method)} · {new Date(p.date).toLocaleDateString()}
                      {p.note ? ` · ${p.note}` : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
            <button type="button" className="btn btn--primary btn--full" style={{ marginTop: 12 }} onClick={() => openPayment(viewing)}>
              Record Payment
            </button>
          </div>
        </Modal>
      )}

      {payingRequest && (
        <Modal title={`Record Payment: ${payingRequest.name}`} onClose={() => setPayingRequest(null)}>
          <p className="modal__meta">{payingRequest.service_id?.title || '—'}</p>
          <form className="auth-form" onSubmit={handleRecordPayment}>
            {paymentError && <p className="form-error">{paymentError}</p>}

            <label>
              Amount (₦)
              <input
                type="number" min="0" step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 100000"
                required
              />
            </label>

            <label>
              Payment method
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm((f) => ({ ...f, payment_method: e.target.value }))}
                required
              >
                <option value="">Select a method...</option>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </label>

            <label>
              Date
              <input
                type="date"
                value={paymentForm.date}
                onChange={(e) => setPaymentForm((f) => ({ ...f, date: e.target.value }))}
                required
              />
            </label>

            <label>
              Note (optional)
              <textarea
                rows={3}
                value={paymentForm.note}
                onChange={(e) => setPaymentForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="e.g. Deposit, final payment, milestone 1..."
              />
            </label>

            <button type="submit" className="btn btn--primary btn--full" disabled={paymentSaving}>
              {paymentSaving ? 'Saving...' : 'Record Payment'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
