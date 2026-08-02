import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import api from '../../../api/axios';
import ListPageHeader from '../../../components/common/ListPageHeader';
import StatCards from '../../../components/common/StatCards';
import Toolbar from '../../../components/admin/Toolbar';
import StatusPill from '../../../components/admin/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import Modal from '../../../components/common/Modal';

const STATUS_TONE = { pending: 'amber', active: 'teal', expired: 'slate' };
const STATUSES = ['pending', 'active', 'expired'];
const PAYMENT_STATUSES = ['pending', 'paid'];
const DURATIONS = ['day', 'week', 'month', 'year'];
const DURATION_LABELS = { day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Yearly' };
const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];
const methodLabel = (value) => PAYMENT_METHODS.find((m) => m.value === value)?.label || value;
const money = (n) => `₦${Number(n || 0).toLocaleString()}`;
const dateStr = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const todayStr = () => new Date().toISOString().slice(0, 10);
const emptyPaymentForm = { amount: '', payment_method: '', date: todayStr(), note: '' };

export default function AdminSpaceSubscriptions() {
  const [searchParams] = useSearchParams();
  const planIdFilter = searchParams.get('plan_id') || '';

  const [subscriptions, setSubscriptions] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [durationFilter, setDurationFilter] = useState('');
  const [viewing, setViewing] = useState(null);
  const [viewingPayments, setViewingPayments] = useState([]);
  const [viewingPaymentsLoading, setViewingPaymentsLoading] = useState(false);

  const [payingSubscription, setPayingSubscription] = useState(null);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (planIdFilter) params.plan_id = planIdFilter;
      if (durationFilter) params.duration = durationFilter;
      const [subsRes, revenueRes] = await Promise.all([
        api.get('/admin/space/subscriptions', { params }),
        api.get('/admin/space/revenue'),
      ]);
      setSubscriptions(subsRes.data.subscriptions);
      setTotalRevenue(revenueRes.data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planIdFilter, durationFilter]);

  useEffect(() => {
    if (!viewing) {
      setViewingPayments([]);
      return;
    }
    setViewingPaymentsLoading(true);
    api.get(`/admin/space/subscriptions/${viewing._id}/payments`)
      .then((res) => setViewingPayments(res.data.payments))
      .catch(() => setViewingPayments([]))
      .finally(() => setViewingPaymentsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewing?._id]);

  const updateField = async (id, field, value) => {
    setBusyId(id);
    setError('');
    try {
      const res = await api.patch(`/admin/space/subscriptions/${id}`, { [field]: value });
      const updated = res.data.subscription;
      setSubscriptions((prev) => prev.map((s) => (s._id === id ? { ...s, ...updated } : s)));
      setViewing((prev) => (prev && prev._id === id ? { ...prev, ...updated } : prev));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update subscription');
    } finally {
      setBusyId(null);
    }
  };

  const openPayment = (subscription) => {
    setViewing(null);
    setPayingSubscription(subscription);
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
      const res = await api.post(`/admin/space/subscriptions/${payingSubscription._id}/payments`, paymentForm);
      // Recording a payment can auto-flip payment_status/status (e.g. total
      // now covers the plan price and the membership activates) — sync
      // that back into the list.
      const updatedSubscription = res.data.subscription;
      setSubscriptions((prev) => prev.map((s) => (s._id === updatedSubscription._id ? { ...s, ...updatedSubscription } : s)));
      const revenueRes = await api.get('/admin/space/revenue');
      setTotalRevenue(revenueRes.data.total);
      setViewing({ ...payingSubscription, ...updatedSubscription });
      setPayingSubscription(null);
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentSaving(false);
    }
  };

  const stats = useMemo(() => ({
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === 'active').length,
    pending: subscriptions.filter((s) => s.status === 'pending').length,
    expired: subscriptions.filter((s) => s.status === 'expired').length,
  }), [subscriptions]);

  const visibleSubscriptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return subscriptions.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (!q) return true;
      return `${s.full_name} ${s.email}`.toLowerCase().includes(q);
    });
  }, [subscriptions, search, statusFilter]);

  const viewingPaymentsTotal = viewingPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Workspace Subscriptions"
        subtitle={planIdFilter
          ? <>Subscriptions for this plan. <Link to="/admin/space/subscriptions">(clear filter)</Link></>
          : 'Reservations across all workspace plans.'}
      />

      <StatCards stats={[
        { label: 'Total Space Revenue', value: money(totalRevenue), accent: true },
        { label: 'Total Subscriptions', value: stats.total },
        { label: 'Active', value: stats.active },
        { label: 'Pending', value: stats.pending },
        { label: 'Expired', value: stats.expired },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by name or email...">
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
          <p className="payments-empty">Loading subscriptions...</p>
        ) : visibleSubscriptions.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No subscriptions found"
            message={search || statusFilter || durationFilter ? 'No subscriptions match your search or filter.' : 'Workspace reservations will appear here once submitted.'}
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Plan</th>
                <th>Contact</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Start / End</th>
                <th>Reserved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleSubscriptions.map((s) => {
                const isBusy = busyId === s._id;
                return (
                  <tr key={s._id}>
                    <td>{s.full_name}</td>
                    <td>{s.plan_id?.name || '—'} <span className="payments-muted">({DURATION_LABELS[s.plan_id?.duration] || '—'})</span></td>
                    <td>{s.email}<br />{s.phone}</td>
                    <td>
                      <select value={s.payment_status} disabled={isBusy} onChange={(e) => updateField(s._id, 'payment_status', e.target.value)}>
                        {PAYMENT_STATUSES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td><StatusPill tone={STATUS_TONE[s.status]}>{s.status}</StatusPill></td>
                    <td className="payments-date">{dateStr(s.start_date)} – {dateStr(s.end_date)}</td>
                    <td className="payments-date">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="admin-table__actions">
                      <button type="button" className="btn btn--ghost" onClick={() => setViewing(s)}>View</button>
                      <button type="button" className="btn btn--primary" onClick={() => openPayment(s)}>Record Payment</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {viewing && (
        <Modal title={viewing.full_name} onClose={() => setViewing(null)}>
          <p className="modal__meta">{viewing.email} · {viewing.phone} · {new Date(viewing.created_at).toLocaleString()}</p>
          <p><strong>Plan:</strong> {viewing.plan_id?.name || '—'} ({DURATION_LABELS[viewing.plan_id?.duration] || '—'})</p>
          <p><strong>Address:</strong> {viewing.address}</p>
          <p><strong>Occupation/purpose:</strong> {viewing.occupation_or_purpose}</p>
          <p><strong>Valid ID:</strong> {viewing.valid_id_type} · {viewing.valid_id_number}</p>
          <p><strong>Emergency contact:</strong> {viewing.emergency_contact_name} · {viewing.emergency_contact_phone}</p>
          <p><strong>Membership:</strong> {dateStr(viewing.start_date)} – {dateStr(viewing.end_date)}</p>

          <div className="admin-table__actions" style={{ marginTop: 16 }}>
            <label style={{ flex: 1 }}>
              Payment status
              <select
                value={viewing.payment_status}
                disabled={busyId === viewing._id}
                onChange={(e) => updateField(viewing._id, 'payment_status', e.target.value)}
              >
                {PAYMENT_STATUSES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label style={{ flex: 1 }}>
              Status
              <select
                value={viewing.status}
                disabled={busyId === viewing._id}
                onChange={(e) => updateField(viewing._id, 'status', e.target.value)}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>

          <div className="payout-student-list" style={{ marginTop: 20 }}>
            <p className="modal__meta">
              <strong>Payments recorded:</strong> {money(viewingPaymentsTotal)}
              {viewing.plan_id?.price ? ` of ${money(viewing.plan_id.price)} plan price` : ''}
              {viewingPayments.length > 0 ? ` · ${viewingPayments.length} payment${viewingPayments.length === 1 ? '' : 's'}` : ''}
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

      {payingSubscription && (
        <Modal title={`Record Payment: ${payingSubscription.full_name}`} onClose={() => setPayingSubscription(null)}>
          <p className="modal__meta">{payingSubscription.plan_id?.name || '—'}</p>
          <form className="auth-form" onSubmit={handleRecordPayment}>
            {paymentError && <p className="form-error">{paymentError}</p>}

            <label>
              Amount (₦)
              <input
                type="number" min="0" step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 20000"
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
                placeholder="e.g. Deposit, renewal, full payment..."
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
