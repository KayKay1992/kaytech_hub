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
const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Part Payment' },
  { value: 'paid', label: 'Completed Payment' },
];
const methodLabel = (value) => PAYMENT_METHODS.find((m) => m.value === value)?.label || '—';
const money = (n) => `₦${Number(n || 0).toLocaleString()}`;

const emptyCreateForm = { studentId: '', cohortId: '', amount: '', status: 'pending', amountPaid: '', method: '', note: '' };
const emptyEditForm = { amount: '', status: 'pending', amountPaid: '', method: '', note: '' };

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');

  // Create
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [cohortOptions, setCohortOptions] = useState([]);
  const [cohortsLoading, setCohortsLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSaving, setCreateSaving] = useState(false);

  // Edit
  const [editing, setEditing] = useState(null); // payment object
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Delete
  const [confirmingId, setConfirmingId] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [paymentsRes, studentsRes] = await Promise.all([
        api.get('/admin/academy/payments'),
        api.get('/users', { params: { role: 'student' } }),
      ]);
      setPayments(paymentsRes.data.payments);
      setStudents(studentsRes.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const byStatus = (s) => payments.filter((p) => p.status === s);
    return {
      pendingCount: byStatus('pending').length,
      partialCount: byStatus('partial').length,
      paidCount: byStatus('paid').length,
      totalCollected: payments.reduce((sum, p) => sum + (p.amount_paid || 0), 0),
    };
  }, [payments]);

  const visiblePayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      if (tab !== 'all' && p.status !== tab) return false;
      if (!q) return true;
      const haystack = `${p.student_id?.name || ''} ${p.student_id?.email || ''} ${p.cohort_id?.name || ''} ${p.cohort_id?.course_id?.title || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [payments, tab, search]);

  // ---------- Create ----------

  const openCreate = () => {
    setCreateForm(emptyCreateForm);
    setCohortOptions([]);
    setCreateError('');
    setCreating(true);
  };

  const paidCohortIdsFor = (studentId) => new Set(
    payments.filter((p) => p.student_id?._id === studentId).map((p) => p.cohort_id?._id),
  );

  const handleCreateStudentChange = async (studentId) => {
    setCreateForm((f) => ({ ...f, studentId, cohortId: '' }));
    setCohortOptions([]);
    if (!studentId) return;
    setCohortsLoading(true);
    try {
      const res = await api.get('/admin/academy/enrollments', { params: { student_id: studentId } });
      const taken = paidCohortIdsFor(studentId);
      setCohortOptions(res.data.enrollments.filter((e) => !taken.has(e.cohort_id?._id)));
    } catch {
      setCohortOptions([]);
    } finally {
      setCohortsLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    const { studentId, cohortId, amount, status, amountPaid, method, note } = createForm;
    if (!studentId || !cohortId) {
      setCreateError('Please select a student and a cohort.');
      return;
    }
    if (amount === '' || Number(amount) < 0) {
      setCreateError('Please enter a valid total amount.');
      return;
    }
    if (status !== 'pending' && !method) {
      setCreateError('Payment method is required once any money has been received.');
      return;
    }
    if (status === 'partial' && (amountPaid === '' || Number(amountPaid) <= 0 || Number(amountPaid) >= Number(amount))) {
      setCreateError('Amount paid must be greater than 0 and less than the total for a part payment.');
      return;
    }
    setCreateSaving(true);
    try {
      const res = await api.post('/admin/academy/payments', {
        student_id: studentId,
        cohort_id: cohortId,
        amount,
        status,
        amount_paid: amountPaid,
        payment_method: method,
        reference_note: note,
      });
      setPayments((prev) => [res.data.payment, ...prev]);
      setCreating(false);
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create payment');
    } finally {
      setCreateSaving(false);
    }
  };

  // ---------- Edit ----------

  const openEdit = (payment) => {
    setEditing(payment);
    setEditForm({
      amount: String(payment.amount),
      status: payment.status,
      amountPaid: payment.status === 'partial' ? String(payment.amount_paid) : '',
      method: payment.payment_method || '',
      note: payment.reference_note || '',
    });
    setEditError('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    const { amount, status, amountPaid, method, note } = editForm;
    if (amount === '' || Number(amount) < 0) {
      setEditError('Please enter a valid total amount.');
      return;
    }
    if (status !== 'pending' && !method) {
      setEditError('Payment method is required once any money has been received.');
      return;
    }
    if (status === 'partial' && (amountPaid === '' || Number(amountPaid) <= 0 || Number(amountPaid) >= Number(amount))) {
      setEditError('Amount paid must be greater than 0 and less than the total for a part payment.');
      return;
    }
    setEditSaving(true);
    try {
      const res = await api.patch(`/admin/academy/payments/${editing._id}`, {
        amount,
        status,
        amount_paid: amountPaid,
        payment_method: method,
        reference_note: note,
      });
      setPayments((prev) => prev.map((p) => (p._id === editing._id ? res.data.payment : p)));
      setEditing(null);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update payment');
    } finally {
      setEditSaving(false);
    }
  };

  // ---------- Delete ----------

  const handleDelete = async (id) => {
    setDeleteBusy(true);
    setError('');
    try {
      await api.delete(`/admin/academy/payments/${id}`);
      setPayments((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete payment');
    } finally {
      setDeleteBusy(false);
      setConfirmingId(null);
    }
  };

  const renderAmountCell = (p) => {
    if (p.status === 'paid') {
      return (
        <>
          <span className="payments-amount">{money(p.amount)}</span>
          <br /><span className="payments-muted payments-muted--paid">Paid in full</span>
        </>
      );
    }
    if (p.status === 'partial') {
      const balance = p.amount - p.amount_paid;
      return (
        <>
          <span className="payments-amount">{money(p.amount)}</span>
          <div className="payments-balance-track" aria-hidden="true">
            <div className="payments-balance-fill" style={{ width: `${Math.min(100, (p.amount_paid / p.amount) * 100)}%` }} />
          </div>
          <span className="payments-muted">{money(p.amount_paid)} paid &middot; {money(balance)} due</span>
        </>
      );
    }
    return <span className="payments-amount">{money(p.amount)}</span>;
  };

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>Payments</h1>
            <p className="admin-dashboard__subtitle">Offline payment tracking for Academy enrollments — bank transfer or cash, recorded manually.</p>
          </div>
          <button type="button" className="btn btn--primary" onClick={openCreate}>Record Payment</button>
        </div>
      </Reveal>

      <div className="stat-grid payments-stat-grid">
        <Reveal as="div" className="stat-card" index={0}>
          <span className="stat-card__value">{stats.pendingCount}</span>
          <span className="stat-card__label">Pending</span>
        </Reveal>
        <Reveal as="div" className="stat-card" index={1}>
          <span className="stat-card__value">{stats.partialCount}</span>
          <span className="stat-card__label">Part Payment</span>
        </Reveal>
        <Reveal as="div" className="stat-card" index={2}>
          <span className="stat-card__value">{stats.paidCount}</span>
          <span className="stat-card__label">Completed</span>
        </Reveal>
        <Reveal as="div" className="stat-card stat-card--accent" index={3}>
          <span className="stat-card__value">{money(stats.totalCollected)}</span>
          <span className="stat-card__label">Total Collected</span>
        </Reveal>
      </div>

      <div className="payments-toolbar">
        <div className="notification-tabs">
          <button type="button" className={tab === 'pending' ? 'is-active' : ''} onClick={() => setTab('pending')}>
            Pending {stats.pendingCount > 0 && `(${stats.pendingCount})`}
          </button>
          <button type="button" className={tab === 'partial' ? 'is-active' : ''} onClick={() => setTab('partial')}>
            Part Payment {stats.partialCount > 0 && `(${stats.partialCount})`}
          </button>
          <button type="button" className={tab === 'paid' ? 'is-active' : ''} onClick={() => setTab('paid')}>Completed</button>
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
        ) : visiblePayments.length === 0 ? (
          <p className="payments-empty">
            {search ? 'No payments match your search.' : `No ${tab === 'all' ? '' : tab} payments to show.`}
          </p>
        ) : (
          <table className="invite-table payments-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course / Cohort</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Method</th>
                <th>Note</th>
                <th>Paid At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePayments.map((p) => (
                <tr key={p._id}>
                  <td>{p.student_id?.name || '—'}<br /><span className="payments-muted">{p.student_id?.email}</span></td>
                  <td>{p.cohort_id?.course_id?.title || '—'}<br /><span className="payments-muted">{p.cohort_id?.name}</span></td>
                  <td className="payments-amount-cell">{renderAmountCell(p)}</td>
                  <td><PaymentStatusBadge status={p.status} /></td>
                  <td>{methodLabel(p.payment_method)}</td>
                  <td className="payments-note" title={p.reference_note || ''}>{p.reference_note || '—'}</td>
                  <td className="payments-date">{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '—'}</td>
                  <td>
                    {confirmingId === p._id ? (
                      <span className="confirm-delete">
                        <span>Delete this payment?</span>
                        <button type="button" className="btn btn--danger" disabled={deleteBusy} onClick={() => handleDelete(p._id)}>
                          {deleteBusy ? 'Deleting...' : 'Confirm'}
                        </button>
                        <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(null)}>Cancel</button>
                      </span>
                    ) : (
                      <div className="admin-table__actions">
                        <button type="button" className="btn btn--ghost" onClick={() => openEdit(p)}>Edit</button>
                        <button type="button" className="btn btn--ghost" onClick={() => setConfirmingId(p._id)}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <Modal title="Record Payment" onClose={() => setCreating(false)}>
          <form className="auth-form" onSubmit={handleCreate}>
            {createError && <p className="form-error">{createError}</p>}

            <label>
              Student
              <select value={createForm.studentId} onChange={(e) => handleCreateStudentChange(e.target.value)} required>
                <option value="">Select a student...</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                ))}
              </select>
            </label>

            <label>
              Cohort
              <select
                value={createForm.cohortId}
                onChange={(e) => setCreateForm((f) => ({ ...f, cohortId: e.target.value }))}
                disabled={!createForm.studentId || cohortsLoading}
                required
              >
                <option value="">
                  {!createForm.studentId ? 'Select a student first...' : cohortsLoading ? 'Loading cohorts...' : cohortOptions.length === 0 ? 'No eligible enrollments' : 'Select a cohort...'}
                </option>
                {cohortOptions.map((enr) => (
                  <option key={enr._id} value={enr.cohort_id?._id}>
                    {enr.cohort_id?.course_id?.title} — {enr.cohort_id?.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Total amount
              <input
                type="number" min="0" step="0.01"
                value={createForm.amount}
                onChange={(e) => setCreateForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 150000"
                required
              />
            </label>

            <label>
              Status
              <select value={createForm.status} onChange={(e) => setCreateForm((f) => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>

            {createForm.status === 'partial' && (
              <label>
                Amount paid so far
                <input
                  type="number" min="0" step="0.01"
                  value={createForm.amountPaid}
                  onChange={(e) => setCreateForm((f) => ({ ...f, amountPaid: e.target.value }))}
                  placeholder="e.g. 50000"
                  required
                />
              </label>
            )}

            {createForm.status !== 'pending' && (
              <label>
                Payment method
                <select value={createForm.method} onChange={(e) => setCreateForm((f) => ({ ...f, method: e.target.value }))} required>
                  <option value="">Select a method...</option>
                  {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </label>
            )}

            <label>
              Reference / note (optional)
              <textarea
                rows={3}
                value={createForm.note}
                onChange={(e) => setCreateForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="e.g. Bank transfer ref #12345, or 'paid in cash at the office'"
              />
            </label>

            <button type="submit" className="btn btn--primary btn--full" disabled={createSaving}>
              {createSaving ? 'Saving...' : 'Record Payment'}
            </button>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title={`Edit Payment: ${editing.student_id?.name || ''}`} onClose={() => setEditing(null)}>
          <p className="modal__meta">{editing.cohort_id?.course_id?.title} · {editing.cohort_id?.name}</p>
          <form className="auth-form" onSubmit={handleEdit}>
            {editError && <p className="form-error">{editError}</p>}

            <label>
              Total amount
              <input
                type="number" min="0" step="0.01"
                value={editForm.amount}
                onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </label>

            <label>
              Status
              <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>

            {editForm.status === 'partial' && (
              <label>
                Amount paid so far
                <input
                  type="number" min="0" step="0.01"
                  value={editForm.amountPaid}
                  onChange={(e) => setEditForm((f) => ({ ...f, amountPaid: e.target.value }))}
                  placeholder="e.g. 50000"
                  required
                />
              </label>
            )}

            {editForm.status !== 'pending' && (
              <label>
                Payment method
                <select value={editForm.method} onChange={(e) => setEditForm((f) => ({ ...f, method: e.target.value }))} required>
                  <option value="">Select a method...</option>
                  {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </label>
            )}

            <label>
              Reference / note (optional)
              <textarea
                rows={3}
                value={editForm.note}
                onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="e.g. Bank transfer ref #12345, or 'paid in cash at the office'"
              />
            </label>

            <button type="submit" className="btn btn--primary btn--full" disabled={editSaving}>
              {editSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
