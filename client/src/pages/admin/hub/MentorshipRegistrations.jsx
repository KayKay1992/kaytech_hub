import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';
import api from '../../../api/axios';
import ListPageHeader from '../../../components/common/ListPageHeader';
import StatCards from '../../../components/common/StatCards';
import Toolbar from '../../../components/admin/Toolbar';
import EmptyState from '../../../components/common/EmptyState';
import Modal from '../../../components/common/Modal';

const STATUSES = ['registered', 'attending', 'completed'];
const PAYMENT_STATUSES = ['pending', 'paid'];
const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];
const methodLabel = (value) => PAYMENT_METHODS.find((m) => m.value === value)?.label || value;
const money = (n) => `₦${Number(n || 0).toLocaleString()}`;
const todayStr = () => new Date().toISOString().slice(0, 10);
const emptyPaymentForm = { amount: '', payment_method: '', date: todayStr(), note: '' };

export default function AdminMentorshipRegistrations() {
  const [searchParams] = useSearchParams();
  const programIdFilter = searchParams.get('program_id') || '';

  const [registrations, setRegistrations] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewing, setViewing] = useState(null);
  const [viewingPayments, setViewingPayments] = useState([]);
  const [viewingPaymentsLoading, setViewingPaymentsLoading] = useState(false);

  const [payingRegistration, setPayingRegistration] = useState(null);
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSaving, setPaymentSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (programIdFilter) params.program_id = programIdFilter;
      const [registrationsRes, revenueRes] = await Promise.all([
        api.get('/admin/mentorship/registrations', { params }),
        api.get('/admin/mentorship/revenue'),
      ]);
      setRegistrations(registrationsRes.data.registrations);
      setTotalRevenue(revenueRes.data.total);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programIdFilter]);

  useEffect(() => {
    if (!viewing) {
      setViewingPayments([]);
      return;
    }
    setViewingPaymentsLoading(true);
    api.get(`/admin/mentorship/registrations/${viewing._id}/payments`)
      .then((res) => setViewingPayments(res.data.payments))
      .catch(() => setViewingPayments([]))
      .finally(() => setViewingPaymentsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewing?._id]);

  const updateField = async (id, field, value) => {
    setBusyId(id);
    setError('');
    try {
      await api.patch(`/admin/mentorship/registrations/${id}`, { [field]: value });
      setRegistrations((prev) => prev.map((r) => (r._id === id ? { ...r, [field]: value } : r)));
      setViewing((prev) => (prev && prev._id === id ? { ...prev, [field]: value } : prev));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update registration');
    } finally {
      setBusyId(null);
    }
  };

  const openPayment = (registration) => {
    setViewing(null);
    setPayingRegistration(registration);
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
      const res = await api.post(`/admin/mentorship/registrations/${payingRegistration._id}/payments`, paymentForm);
      // Recording a payment can auto-flip payment_status (e.g. total now
      // covers the program price) — sync that back into the list.
      const updatedRegistration = res.data.registration;
      setRegistrations((prev) => prev.map((r) => (r._id === updatedRegistration._id ? { ...r, payment_status: updatedRegistration.payment_status } : r)));
      const revenueRes = await api.get('/admin/mentorship/revenue');
      setTotalRevenue(revenueRes.data.total);
      setViewing({ ...payingRegistration, payment_status: updatedRegistration.payment_status });
      setPayingRegistration(null);
    } catch (err) {
      setPaymentError(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setPaymentSaving(false);
    }
  };

  const stats = useMemo(() => ({
    total: registrations.length,
    registered: registrations.filter((r) => r.status === 'registered').length,
    attending: registrations.filter((r) => r.status === 'attending').length,
    paid: registrations.filter((r) => r.payment_status === 'paid').length,
  }), [registrations]);

  const visibleRegistrations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return registrations.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (!q) return true;
      return `${r.full_name} ${r.email}`.toLowerCase().includes(q);
    });
  }, [registrations, search, statusFilter]);

  const viewingPaymentsTotal = viewingPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Mentorship Registrations"
        subtitle={programIdFilter
          ? <>Registrations for this program. <Link to="/admin/mentorship-registrations">(clear filter)</Link></>
          : 'Registrations across all mentorship programs.'}
      />

      <StatCards stats={[
        { label: 'Total Mentorship Revenue', value: money(totalRevenue), accent: true },
        { label: 'Total Registrations', value: stats.total },
        { label: 'Registered', value: stats.registered },
        { label: 'Attending', value: stats.attending },
        { label: 'Paid', value: stats.paid },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by name or email...">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading registrations...</p>
        ) : visibleRegistrations.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No registrations found"
            message={search || statusFilter ? 'No registrations match your search or filter.' : 'Mentorship registrations will appear here once submitted.'}
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Program</th>
                <th>Contact</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRegistrations.map((r) => {
                const isBusy = busyId === r._id;
                return (
                  <tr key={r._id}>
                    <td>{r.full_name}</td>
                    <td>{r.program_id?.title || '—'}</td>
                    <td>{r.email}<br />{r.phone}</td>
                    <td>
                      <select value={r.payment_status} disabled={isBusy} onChange={(e) => updateField(r._id, 'payment_status', e.target.value)}>
                        {PAYMENT_STATUSES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={r.status} disabled={isBusy} onChange={(e) => updateField(r._id, 'status', e.target.value)}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="payments-date">{new Date(r.registered_at).toLocaleDateString()}</td>
                    <td className="admin-table__actions">
                      <button type="button" className="btn btn--ghost" onClick={() => setViewing(r)}>View</button>
                      <button type="button" className="btn btn--primary" onClick={() => openPayment(r)}>Record Payment</button>
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
          <p className="modal__meta">{viewing.email} · {viewing.phone} · {new Date(viewing.registered_at).toLocaleString()}</p>
          <p><strong>Program:</strong> {viewing.program_id?.title || '—'}</p>
          <p><strong>Occupation/status:</strong> {viewing.occupation_or_status}</p>
          <p><strong>Experience level:</strong> {viewing.experience_level}</p>
          <p><strong>Reason for joining:</strong> {viewing.reason_for_joining}</p>
          {viewing.how_heard_about_us && <p><strong>How they heard about us:</strong> {viewing.how_heard_about_us}</p>}

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
              {viewing.program_id?.price ? ` of ${money(viewing.program_id.price)} program fee` : ''}
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

      {payingRegistration && (
        <Modal title={`Record Payment: ${payingRegistration.full_name}`} onClose={() => setPayingRegistration(null)}>
          <p className="modal__meta">{payingRegistration.program_id?.title || '—'}</p>
          <form className="auth-form" onSubmit={handleRecordPayment}>
            {paymentError && <p className="form-error">{paymentError}</p>}

            <label>
              Amount (₦)
              <input
                type="number" min="0" step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 50000"
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
                placeholder="e.g. Deposit, installment 2, final payment..."
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
