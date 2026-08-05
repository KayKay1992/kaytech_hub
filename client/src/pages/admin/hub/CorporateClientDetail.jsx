import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';
import StatCards from '../../../components/common/StatCards';
import StatusPill from '../../../components/admin/StatusPill';
import Modal from '../../../components/common/Modal';

const STATUS_TONE = { active: 'teal', inactive: 'slate' };
const CLIENT_STATUSES = ['active', 'inactive'];
const INVOICE_STATUS_TONE = { unpaid: 'amber', paid: 'teal' };
const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
];
const methodLabel = (value) => PAYMENT_METHODS.find((m) => m.value === value)?.label || value;

const money = (n) => `₦${Number(n || 0).toLocaleString()}`;
const emptyInvoiceForm = { description: '', amount: '', due_date: '' };
const emptyPaidForm = { payment_method: '' };

export default function AdminCorporateClientDetail() {
  const { id } = useParams();

  const [client, setClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);

  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm);
  const [invoiceError, setInvoiceError] = useState('');
  const [invoiceSaving, setInvoiceSaving] = useState(false);

  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paidForm, setPaidForm] = useState(emptyPaidForm);
  const [paidError, setPaidError] = useState('');
  const [paidSaving, setPaidSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [clientRes, invoicesRes] = await Promise.all([
        api.get(`/admin/corporate-training/clients/${id}`),
        api.get(`/admin/corporate-training/clients/${id}/invoices`),
      ]);
      setClient(clientRes.data.client);
      setInvoices(invoicesRes.data.invoices);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (status) => {
    setStatusSaving(true);
    setError('');
    try {
      const res = await api.patch(`/admin/corporate-training/clients/${id}`, { status });
      setClient(res.data.client);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update client status');
    } finally {
      setStatusSaving(false);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setInvoiceError('');
    const { description, amount, due_date } = invoiceForm;
    if (!description || !amount || !due_date) {
      setInvoiceError('Please fill in all fields.');
      return;
    }
    if (Number(amount) <= 0) {
      setInvoiceError('Please enter a valid amount.');
      return;
    }
    setInvoiceSaving(true);
    try {
      const res = await api.post(`/admin/corporate-training/clients/${id}/invoices`, invoiceForm);
      setInvoices((prev) => [res.data.invoice, ...prev]);
      setCreatingInvoice(false);
      setInvoiceForm(emptyInvoiceForm);
    } catch (err) {
      setInvoiceError(err.response?.data?.message || 'Failed to create invoice');
    } finally {
      setInvoiceSaving(false);
    }
  };

  const openMarkPaid = (invoice) => {
    setPayingInvoice(invoice);
    setPaidForm(emptyPaidForm);
    setPaidError('');
  };

  const handleMarkPaid = async (e) => {
    e.preventDefault();
    setPaidError('');
    if (!paidForm.payment_method) {
      setPaidError('Please select a payment method.');
      return;
    }
    setPaidSaving(true);
    try {
      const res = await api.patch(`/admin/corporate-training/invoices/${payingInvoice._id}/paid`, paidForm);
      setInvoices((prev) => prev.map((i) => (i._id === res.data.invoice._id ? res.data.invoice : i)));
      setPayingInvoice(null);
    } catch (err) {
      setPaidError(err.response?.data?.message || 'Failed to mark invoice as paid');
    } finally {
      setPaidSaving(false);
    }
  };

  const stats = useMemo(() => {
    const paidInvoices = invoices.filter((i) => i.status === 'paid');
    const unpaidInvoices = invoices.filter((i) => i.status === 'unpaid');
    return {
      totalPaid: paidInvoices.reduce((sum, i) => sum + i.amount, 0),
      totalUnpaid: unpaidInvoices.reduce((sum, i) => sum + i.amount, 0),
      invoiceCount: invoices.length,
    };
  }, [invoices]);

  if (loading) {
    return <div className="admin-dashboard"><p className="payments-empty">Loading client...</p></div>;
  }
  if (!client) {
    return <div className="admin-dashboard"><p className="form-error">{error || 'Client not found'}</p></div>;
  }

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>{client.company_name}</h1>
            <p className="admin-dashboard__subtitle">
              <Link to="/admin/corporate-clients">&larr; Back to Corporate Clients</Link>
            </p>
          </div>
          <select value={client.status} disabled={statusSaving} onChange={(e) => handleStatusChange(e.target.value)}>
            {CLIENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Reveal>

      {error && <p className="form-error">{error}</p>}

      <div className="card" style={{ marginTop: 8, marginBottom: 24 }}>
        <p><strong>Contact:</strong> {client.contact_person_name}</p>
        <p><strong>Email:</strong> {client.contact_email}</p>
        <p><strong>Phone:</strong> {client.contact_phone}</p>
        {client.source_request_id && (
          <p><Link to={`/admin/corporate-training/${client.source_request_id}`}>View original request &rarr;</Link></p>
        )}
        <p className="payments-muted">Client since {new Date(client.created_at).toLocaleDateString()}</p>
      </div>

      <StatCards stats={[
        { label: 'Total Invoiced', value: stats.invoiceCount },
        { label: 'Paid', value: money(stats.totalPaid), accent: true },
        { label: 'Outstanding', value: money(stats.totalUnpaid) },
      ]} />

      <div className="admin-page-header" style={{ marginTop: 32 }}>
        <div><h2 style={{ margin: 0 }}>Invoices</h2></div>
        <button type="button" className="btn btn--primary" onClick={() => setCreatingInvoice(true)}>New Invoice</button>
      </div>

      <div className="invite-table-wrap">
        {invoices.length === 0 ? (
          <p className="payments-empty">No invoices created yet.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td>{inv.invoice_number}</td>
                  <td>{inv.description}</td>
                  <td>{money(inv.amount)}</td>
                  <td className="payments-date">{new Date(inv.due_date).toLocaleDateString()}</td>
                  <td>
                    <StatusPill tone={INVOICE_STATUS_TONE[inv.status]}>{inv.status}</StatusPill>
                    {inv.status === 'paid' && inv.payment_method && (
                      <div className="payments-muted">{methodLabel(inv.payment_method)} · {new Date(inv.paid_at).toLocaleDateString()}</div>
                    )}
                  </td>
                  <td className="admin-table__actions">
                    <a href={inv.pdf_url} target="_blank" rel="noreferrer" className="btn btn--ghost">Download PDF</a>
                    {inv.status === 'unpaid' && (
                      <button type="button" className="btn btn--primary" onClick={() => openMarkPaid(inv)}>Mark Paid</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creatingInvoice && (
        <Modal title={`New Invoice: ${client.company_name}`} onClose={() => setCreatingInvoice(false)}>
          <form className="auth-form" onSubmit={handleCreateInvoice}>
            {invoiceError && <p className="form-error">{invoiceError}</p>}

            <label>
              Description
              <textarea
                rows={3}
                value={invoiceForm.description}
                onChange={(e) => setInvoiceForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. AI Training Program — 20 staff, 2-day workshop"
                required
              />
            </label>

            <label>
              Amount (₦)
              <input
                type="number" min="0" step="0.01"
                value={invoiceForm.amount}
                onChange={(e) => setInvoiceForm((f) => ({ ...f, amount: e.target.value }))}
                required
              />
            </label>

            <label>
              Due date
              <input
                type="date"
                value={invoiceForm.due_date}
                onChange={(e) => setInvoiceForm((f) => ({ ...f, due_date: e.target.value }))}
                required
              />
            </label>

            <button type="submit" className="btn btn--primary btn--full" disabled={invoiceSaving}>
              {invoiceSaving ? 'Generating PDF...' : 'Create Invoice'}
            </button>
          </form>
        </Modal>
      )}

      {payingInvoice && (
        <Modal title={`Mark Paid: ${payingInvoice.invoice_number}`} onClose={() => setPayingInvoice(null)}>
          <form className="auth-form" onSubmit={handleMarkPaid}>
            {paidError && <p className="form-error">{paidError}</p>}
            <p className="modal__meta">{money(payingInvoice.amount)}</p>

            <label>
              Payment method
              <select
                value={paidForm.payment_method}
                onChange={(e) => setPaidForm((f) => ({ ...f, payment_method: e.target.value }))}
                required
              >
                <option value="">Select a method...</option>
                {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </label>

            <button type="submit" className="btn btn--primary btn--full" disabled={paidSaving}>
              {paidSaving ? 'Saving...' : 'Mark as Paid'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
