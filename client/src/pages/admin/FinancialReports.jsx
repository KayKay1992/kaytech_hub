import { useState } from 'react';
import api from '../../api/axios';
import Reveal from '../../components/common/Reveal';

const toInputDate = (d) => d.toISOString().slice(0, 10);
const today = new Date();
const defaultFrom = toInputDate(new Date(today.getFullYear(), today.getMonth(), 1));
const defaultTo = toInputDate(today);

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export default function AdminFinancialReports() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');

  const handleExport = async (type, filenamePrefix) => {
    setError('');
    setDownloading(type);
    try {
      const res = await api.get(`/admin/reports/export/${type}`, {
        params: { from: from || undefined, to: to || undefined },
        responseType: 'blob',
      });
      downloadBlob(new Blob([res.data], { type: 'text/csv' }), `${filenamePrefix}_${from || 'all'}_to_${to || 'all'}.csv`);
    } catch (err) {
      setError('Failed to generate export. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>Financial Reports</h1>
            <p className="admin-dashboard__subtitle">
              Export revenue and instructor payout records as CSV for your accountant or tax filing. Leave the date fields blank to export all-time.
            </p>
          </div>
        </div>
      </Reveal>

      {error && <p className="form-error">{error}</p>}

      <Reveal as="div" className="card" index={0}>
        <h2>Date Range</h2>
        <p className="payments-muted">Applies to both exports below. Defaults to the current month.</p>
        <div className="reports-date-range">
          <label>
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} max={to || undefined} />
          </label>
          <label>
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} min={from || undefined} />
          </label>
          <button type="button" className="btn btn--ghost" onClick={() => { setFrom(''); setTo(''); }}>
            Clear (All-Time)
          </button>
        </div>
      </Reveal>

      <div className="card-grid card-grid--two reports-export-grid">
        <Reveal as="section" className="card" index={1}>
          <h2>Combined Revenue</h2>
          <p className="payments-muted">
            All collected income across Academy, Services, Mentorship, Space, and Corporate Training — one sorted CSV with date, business line, description, amount, payment method, and status.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            disabled={downloading === 'revenue'}
            onClick={() => handleExport('revenue', 'revenue-export')}
          >
            {downloading === 'revenue' ? 'Preparing...' : 'Export Revenue CSV'}
          </button>
        </Reveal>

        <Reveal as="section" className="card" index={2}>
          <h2>Instructor Payouts</h2>
          <p className="payments-muted">
            Instructor payout expenses — date, instructor, cohort, amount, and paid/unpaid status. Kept separate from revenue since this is money going out.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            disabled={downloading === 'payouts'}
            onClick={() => handleExport('payouts', 'instructor-payouts-export')}
          >
            {downloading === 'payouts' ? 'Preparing...' : 'Export Payouts CSV'}
          </button>
        </Reveal>
      </div>
    </div>
  );
}
