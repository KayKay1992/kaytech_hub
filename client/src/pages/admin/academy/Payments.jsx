import { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';
import Modal from '../../../components/common/Modal';
import PaymentStatusBadge from '../../../components/academy/PaymentStatusBadge';

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];
const methodLabel = (value) => PAYMENT_METHODS.find((m) => m.value === value)?.label || '—';
const money = (n) => `₦${Number(n || 0).toLocaleString()}`;

function InstallmentList({ payments, onMarkPaid, onDelete, busyId }) {
  if (!payments || payments.length === 0) {
    return <p className="payments-empty">No installments recorded yet.</p>;
  }
  return (
    <div className="payout-student-list">
      {payments.map((p) => (
        <div className="payout-student-row" key={p._id}>
          <div className="payout-student-row__info">
            <strong>{money(p.amount)}</strong>
            <span className="payments-muted">
              {p.status === 'paid'
                ? `${methodLabel(p.payment_method)} · ${new Date(p.paid_at).toLocaleDateString()}`
                : `Recorded ${new Date(p.created_at).toLocaleDateString()}`}
              {p.reference_note ? ` · ${p.reference_note}` : ''}
            </span>
          </div>
          <PaymentStatusBadge status={p.status} />
          <div className="admin-table__actions">
            {p.status === 'pending' ? (
              <>
                <button type="button" className="btn btn--primary" disabled={busyId === p._id} onClick={() => onMarkPaid(p)}>Mark Paid</button>
                <button type="button" className="btn btn--ghost" disabled={busyId === p._id} onClick={() => onDelete(p._id)}>
                  {busyId === p._id ? 'Deleting...' : 'Delete'}
                </button>
              </>
            ) : (
              <span className="payments-muted payments-muted--paid">Verified</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EnrollmentRow({ enr, onAddInstallment, onMarkPaid, onDelete, onSendReminder, busyId, reminderBusyId, justSentAt }) {
  const [expanded, setExpanded] = useState(false);
  const canRemind = enr.status !== 'dropped' && enr.balance_remaining > 0;

  return (
    <>
      <tr>
        <td>{enr.student_id?.name || '—'}<br /><span className="payments-muted">{enr.student_id?.email}</span></td>
        <td>{enr.cohort_id?.course_id?.title || '—'}<br /><span className="payments-muted">{enr.cohort_id?.name}</span></td>
        <td className="is-numeric">{money(enr.total_fee)}</td>
        <td className="is-numeric">{money(enr.amount_paid)}</td>
        <td className="is-numeric payments-amount">{money(enr.balance_remaining)}</td>
        <td><PaymentStatusBadge status={enr.payment_status} /></td>
        <td>
          <span className="payments-muted">
            {enr.last_reminder_sent_at ? new Date(enr.last_reminder_sent_at).toLocaleDateString() : 'Never'}
          </span>
        </td>
        <td>
          <div className="admin-table__actions">
            <button type="button" className="btn btn--primary" onClick={() => onAddInstallment(enr)}>+ Installment</button>
            <button type="button" className="btn btn--ghost" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Hide History' : `History (${enr.payments?.length || 0})`}
            </button>
            {canRemind && (
              <span className="payments-reminder-action">
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={reminderBusyId === enr._id}
                  onClick={() => onSendReminder(enr)}
                >
                  {reminderBusyId === enr._id ? 'Sending...' : 'Send Reminder Now'}
                </button>
                {justSentAt && (
                  <span className="payments-muted payments-reminder-confirm">
                    Reminder sent on {justSentAt}
                  </span>
                )}
              </span>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="payout-history-tr">
          <td colSpan={8}>
            <InstallmentList payments={enr.payments} onMarkPaid={onMarkPaid} onDelete={onDelete} busyId={busyId} />
          </td>
        </tr>
      )}
    </>
  );
}

const emptyInstallmentForm = { amount: '', status: 'pending', method: '', note: '' };

export default function AdminPayments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('outstanding');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [reminderBusyId, setReminderBusyId] = useState(null);
  const [justSentReminders, setJustSentReminders] = useState({});

  const [addingTo, setAddingTo] = useState(null);
  const [installmentForm, setInstallmentForm] = useState(emptyInstallmentForm);
  const [addError, setAddError] = useState('');
  const [addSaving, setAddSaving] = useState(false);

  const [markingPaid, setMarkingPaid] = useState(null);
  const [markMethod, setMarkMethod] = useState('');
  const [markError, setMarkError] = useState('');
  const [markSaving, setMarkSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/academy/enrollments');
      setEnrollments(res.data.enrollments);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const outstanding = enrollments.filter((e) => e.balance_remaining > 0);
    const settled = enrollments.filter((e) => e.balance_remaining === 0 && e.amount_paid > 0);
    return {
      outstandingCount: outstanding.length,
      settledCount: settled.length,
      totalCollected: enrollments.reduce((sum, e) => sum + (e.amount_paid || 0), 0),
      totalOutstanding: enrollments.reduce((sum, e) => sum + (e.balance_remaining || 0), 0),
    };
  }, [enrollments]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrollments.filter((e) => {
      if (tab === 'outstanding' && !(e.balance_remaining > 0)) return false;
      if (tab === 'settled' && !(e.balance_remaining === 0 && e.amount_paid > 0)) return false;
      if (!q) return true;
      const haystack = `${e.student_id?.name || ''} ${e.student_id?.email || ''} ${e.cohort_id?.name || ''} ${e.cohort_id?.course_id?.title || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [enrollments, tab, search]);

  const openAdd = (enr) => {
    setAddingTo(enr);
    setInstallmentForm(emptyInstallmentForm);
    setAddError('');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setAddError('');
    const { amount, status, method, note } = installmentForm;
    if (amount === '' || Number(amount) <= 0) {
      setAddError('Please enter a valid installment amount.');
      return;
    }
    if (status === 'paid' && !method) {
      setAddError('Payment method is required to record this installment as already received.');
      return;
    }
    setAddSaving(true);
    try {
      await api.post('/admin/academy/payments', {
        student_id: addingTo.student_id._id,
        cohort_id: addingTo.cohort_id._id,
        amount,
        status,
        payment_method: method,
        reference_note: note,
      });
      await load();
      setAddingTo(null);
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to record installment');
    } finally {
      setAddSaving(false);
    }
  };

  const openMarkPaid = (payment) => {
    setMarkingPaid(payment);
    setMarkMethod('');
    setMarkError('');
  };

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    setMarkError('');
    if (!markMethod) {
      setMarkError('Please select a payment method.');
      return;
    }
    setMarkSaving(true);
    try {
      await api.patch(`/admin/academy/payments/${markingPaid._id}`, { status: 'paid', payment_method: markMethod });
      await load();
      setMarkingPaid(null);
    } catch (err) {
      setMarkError(err.response?.data?.message || 'Failed to mark installment paid');
    } finally {
      setMarkSaving(false);
    }
  };

  const handleSendReminder = async (enr) => {
    setReminderBusyId(enr._id);
    setError('');
    try {
      const res = await api.post(`/admin/academy/enrollments/${enr._id}/send-reminder`);
      const sentAt = res.data.enrollment?.last_reminder_sent_at;
      setJustSentReminders((m) => ({ ...m, [enr._id]: sentAt ? new Date(sentAt).toLocaleDateString() : new Date().toLocaleDateString() }));
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reminder');
    } finally {
      setReminderBusyId(null);
    }
  };

  const handleDelete = async (paymentId) => {
    setBusyId(paymentId);
    setError('');
    try {
      await api.delete(`/admin/academy/payments/${paymentId}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete installment');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>Payments</h1>
            <p className="admin-dashboard__subtitle">
              Offline installment tracking for Academy enrollments — students can pay in parts; each verified installment updates their balance and the instructor payout ledger.
            </p>
          </div>
        </div>
      </Reveal>

      <div className="stat-grid payments-stat-grid">
        <Reveal as="div" className="stat-card" index={0}>
          <span className="stat-card__value">{stats.outstandingCount}</span>
          <span className="stat-card__label">With Balance Owing</span>
        </Reveal>
        <Reveal as="div" className="stat-card" index={1}>
          <span className="stat-card__value">{stats.settledCount}</span>
          <span className="stat-card__label">Fully Paid</span>
        </Reveal>
        <Reveal as="div" className="stat-card stat-card--accent" index={2}>
          <span className="stat-card__value">{money(stats.totalCollected)}</span>
          <span className="stat-card__label">Total Collected</span>
        </Reveal>
        <Reveal as="div" className="stat-card" index={3}>
          <span className="stat-card__value">{money(stats.totalOutstanding)}</span>
          <span className="stat-card__label">Total Outstanding</span>
        </Reveal>
      </div>

      <div className="payments-toolbar">
        <div className="notification-tabs">
          <button type="button" className={tab === 'outstanding' ? 'is-active' : ''} onClick={() => setTab('outstanding')}>
            Balance Owing {stats.outstandingCount > 0 && `(${stats.outstandingCount})`}
          </button>
          <button type="button" className={tab === 'settled' ? 'is-active' : ''} onClick={() => setTab('settled')}>Fully Paid</button>
          <button type="button" className={tab === 'all' ? 'is-active' : ''} onClick={() => setTab('all')}>All</button>
        </div>
        <div className="user-filters payments-search">
          <input
            type="text"
            placeholder="Search by student, course, or cohort..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading payments...</p>
        ) : visible.length === 0 ? (
          <p className="payments-empty">
            {search ? 'No enrollments match your search.' : `No enrollments with ${tab === 'all' ? 'any payment activity' : tab === 'outstanding' ? 'a balance owing' : 'a full payment'} to show.`}
          </p>
        ) : (
          <table className="invite-table payments-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course / Cohort</th>
                <th className="is-numeric">Total Fee</th>
                <th className="is-numeric">Paid</th>
                <th className="is-numeric">Balance</th>
                <th>Status</th>
                <th>Last Reminder</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((enr) => (
                <EnrollmentRow
                  key={enr._id}
                  enr={enr}
                  onAddInstallment={openAdd}
                  onMarkPaid={openMarkPaid}
                  onDelete={handleDelete}
                  onSendReminder={handleSendReminder}
                  busyId={busyId}
                  reminderBusyId={reminderBusyId}
                  justSentAt={justSentReminders[enr._id]}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {addingTo && (
        <Modal title={`Record Installment: ${addingTo.student_id?.name || ''}`} onClose={() => setAddingTo(null)}>
          <p className="modal__meta">{addingTo.cohort_id?.course_id?.title} · {addingTo.cohort_id?.name} · Balance: {money(addingTo.balance_remaining)}</p>
          <form className="auth-form" onSubmit={handleAdd}>
            {addError && <p className="form-error">{addError}</p>}

            <label>
              Installment amount (₦)
              <input
                type="number" min="0" step="0.01"
                value={installmentForm.amount}
                onChange={(e) => setInstallmentForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 100000"
                required
              />
            </label>

            <label>
              Status
              <select value={installmentForm.status} onChange={(e) => setInstallmentForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="pending">Pending</option>
                <option value="paid">Already Received</option>
              </select>
            </label>

            {installmentForm.status === 'paid' && (
              <label>
                Payment method
                <select value={installmentForm.method} onChange={(e) => setInstallmentForm((f) => ({ ...f, method: e.target.value }))} required>
                  <option value="">Select a method...</option>
                  {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </label>
            )}

            <label>
              Reference / note (optional)
              <textarea
                rows={3}
                value={installmentForm.note}
                onChange={(e) => setInstallmentForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="e.g. Bank transfer ref #12345, or 'paid in cash at the office'"
              />
            </label>

            <button type="submit" className="btn btn--primary btn--full" disabled={addSaving}>
              {addSaving ? 'Saving...' : 'Record Installment'}
            </button>
          </form>
        </Modal>
      )}

      {markingPaid && (
        <Modal title="Mark Installment Paid" onClose={() => setMarkingPaid(null)}>
          <p className="modal__meta">{money(markingPaid.amount)}{markingPaid.reference_note ? ` · ${markingPaid.reference_note}` : ''}</p>
          <form className="auth-form" onSubmit={handleMarkPaid}>
            {markError && <p className="form-error">{markError}</p>}

            <label>
              Payment method
              <select value={markMethod} onChange={(e) => setMarkMethod(e.target.value)} required>
                <option value="">Select a method...</option>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </label>

            <button type="submit" className="btn btn--primary btn--full" disabled={markSaving}>
              {markSaving ? 'Saving...' : 'Confirm Paid'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
