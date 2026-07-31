import { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';
import PayoutStatusBadge from '../../../components/academy/PayoutStatusBadge';

const money = (n) => `₦${Number(n || 0).toLocaleString()}`;

function TransactionLog({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return <p className="payout-history-empty">No transactions yet — this ledger starts moving once a student payment is verified.</p>;
  }
  const sorted = [...transactions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return (
    <ul className="payout-history-list">
      {sorted.map((t, i) => (
        <li key={i} className={`payout-history-row payout-history-row--${t.type}`}>
          <span className="payout-history-row__type">{t.type === 'accrual' ? 'Accrual' : 'Paid Out'}</span>
          <span className="payout-history-row__detail">
            {t.type === 'accrual'
              ? `${money(t.amount)} (${t.percent_used}% of a verified payment${t.student_id?.name ? ` from ${t.student_id.name}` : ''})`
              : `${money(t.amount)} paid to instructor`}
          </span>
          <span className="payout-history-row__date">{new Date(t.created_at).toLocaleString()}</span>
        </li>
      ))}
    </ul>
  );
}

function PayoutRow({ p, onPay, paying }) {
  const [expanded, setExpanded] = useState(false);
  const derivedStatus = p.unpaid_amount > 0 ? 'unpaid' : (p.paid_amount > 0 ? 'paid' : 'unpaid');

  return (
    <>
      <tr>
        <td>{p.instructor_id?.name || '—'}<br /><span className="payments-muted">{p.instructor_id?.email}</span></td>
        <td>{p.cohort_id?.course_id?.title || '—'}<br /><span className="payments-muted">{p.cohort_id?.name}</span></td>
        <td className="is-numeric">{p.students_count}</td>
        <td className="is-numeric">{p.payout_percent_used}%</td>
        <td className="is-numeric payments-amount">{money(p.unpaid_amount)}</td>
        <td className="is-numeric">{money(p.paid_amount)}</td>
        <td className="is-numeric">
          <span className="payout-projected" title="Not yet collected — potential future payout if every outstanding student balance for this cohort gets paid">
            {money(p.projected_additional_payout)}
          </span>
        </td>
        <td><PayoutStatusBadge status={derivedStatus} /></td>
        <td className="payments-date">{p.last_paid_at ? new Date(p.last_paid_at).toLocaleDateString() : '—'}</td>
        <td>
          <div className="admin-table__actions">
            {p.unpaid_amount > 0 ? (
              <button type="button" className="btn btn--primary" disabled={paying} onClick={() => onPay(p._id)}>
                {paying ? 'Paying...' : `Pay ${money(p.unpaid_amount)}`}
              </button>
            ) : (
              <span className="payments-muted payments-muted--paid">{p.paid_amount > 0 ? 'Settled' : 'Nothing Due Yet'}</span>
            )}
            <button type="button" className="btn btn--ghost" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Hide History' : 'History'}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="payout-history-tr">
          <td colSpan={10}>
            <TransactionLog transactions={p.transactions} />
          </td>
        </tr>
      )}
    </>
  );
}

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('unpaid');
  const [search, setSearch] = useState('');
  const [payingId, setPayingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async ({ silent } = {}) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/academy/payouts');
      setPayouts(res.data.payouts);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payouts');
    } finally {
      if (silent) setRefreshing(false); else setLoading(false);
    }
  };

  // A new verified student payment updates the ledger server-side the
  // moment it happens, but this tab won't see it until we refetch — reload
  // (quietly, without blanking the table) whenever the tab regains focus.
  useEffect(() => {
    load();
    const onFocus = () => load({ silent: true });
    const onVisibility = () => { if (document.visibilityState === 'visible') load({ silent: true }); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const stats = useMemo(() => {
    const unpaidRows = payouts.filter((p) => p.unpaid_amount > 0);
    const settledRows = payouts.filter((p) => p.unpaid_amount === 0 && p.paid_amount > 0);
    return {
      unpaidCount: unpaidRows.length,
      settledCount: settledRows.length,
      amountOwed: payouts.reduce((sum, p) => sum + (p.unpaid_amount || 0), 0),
      amountPaid: payouts.reduce((sum, p) => sum + (p.paid_amount || 0), 0),
      projectedAdditional: payouts.reduce((sum, p) => sum + (p.projected_additional_payout || 0), 0),
    };
  }, [payouts]);

  const visiblePayouts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payouts.filter((p) => {
      if (tab === 'unpaid' && !(p.unpaid_amount > 0)) return false;
      if (tab === 'settled' && !(p.unpaid_amount === 0 && p.paid_amount > 0)) return false;
      if (!q) return true;
      const haystack = `${p.instructor_id?.name || ''} ${p.instructor_id?.email || ''} ${p.cohort_id?.name || ''} ${p.cohort_id?.course_id?.title || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [payouts, tab, search]);

  const payInstructor = async (id) => {
    setPayingId(id);
    setError('');
    try {
      const res = await api.post(`/admin/academy/payouts/${id}/pay`);
      setPayouts((prev) => prev.map((p) => (p._id === id ? res.data.payout : p)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record payout');
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <Reveal as="div" className="dashboard-hero">
        <div className="dashboard-hero__glow dashboard-hero__glow--one" aria-hidden="true" />
        <div className="dashboard-hero__glow dashboard-hero__glow--two" aria-hidden="true" />

        <div className="dashboard-hero__content">
          <span className="badge badge--on-dark">Academy · Payouts</span>
          <h1 className="dashboard-hero__title">Instructor Payouts</h1>
          <p className="dashboard-hero__subtitle">
            Each verified student payment adds the instructor's share straight to "Unpaid" for that cohort. Pay it out whenever you send the money offline — new payments after that start accruing fresh from ₦0.
          </p>
          <div className="dashboard-hero__pills">
            <span className="dashboard-hero__pill"><strong>{money(stats.amountPaid)}</strong>&nbsp;Total Paid Out</span>
            <span className="dashboard-hero__pill"><strong>{stats.unpaidCount}</strong>&nbsp;Unpaid</span>
          </div>
        </div>

        <div className="payout-hero__figure">
          <span className="payout-hero__figure-value">{money(stats.amountOwed)}</span>
          <span className="payout-hero__figure-label">Amount Owed</span>
        </div>
      </Reveal>

      <div className="stat-grid payments-stat-grid" style={{ marginTop: 32 }}>
        <Reveal as="div" className="stat-card" index={0}>
          <span className="stat-card__value">{stats.unpaidCount}</span>
          <span className="stat-card__label">Unpaid</span>
        </Reveal>
        <Reveal as="div" className="stat-card" index={1}>
          <span className="stat-card__value">{stats.settledCount}</span>
          <span className="stat-card__label">Settled</span>
        </Reveal>
        <Reveal as="div" className="stat-card stat-card--accent" index={2}>
          <span className="stat-card__value">{money(stats.amountOwed)}</span>
          <span className="stat-card__label">Amount Owed</span>
        </Reveal>
        <Reveal as="div" className="stat-card" index={3}>
          <span className="stat-card__value">{money(stats.amountPaid)}</span>
          <span className="stat-card__label">Total Paid Out</span>
        </Reveal>
        <Reveal as="div" className="stat-card stat-card--projected" index={4}>
          <span className="stat-card__value">{money(stats.projectedAdditional)}</span>
          <span className="stat-card__label">Projected Additional</span>
          <span className="stat-card__hint">Not yet collected — potential, not real, until students pay</span>
        </Reveal>
      </div>

      <div className="payments-toolbar">
        <div className="notification-tabs">
          <button type="button" className={tab === 'unpaid' ? 'is-active' : ''} onClick={() => setTab('unpaid')}>
            Unpaid {stats.unpaidCount > 0 && `(${stats.unpaidCount})`}
          </button>
          <button type="button" className={tab === 'settled' ? 'is-active' : ''} onClick={() => setTab('settled')}>Settled</button>
          <button type="button" className={tab === 'all' ? 'is-active' : ''} onClick={() => setTab('all')}>All</button>
        </div>
        <div className="user-filters payments-search">
          <input
            type="text"
            placeholder="Search by instructor, course, or cohort..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="btn btn--ghost" disabled={refreshing} onClick={() => load({ silent: true })}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading payouts...</p>
        ) : visiblePayouts.length === 0 ? (
          <p className="payments-empty">
            {search ? 'No payouts match your search.' : `No ${tab === 'all' ? '' : tab} payouts to show.`}
          </p>
        ) : (
          <table className="invite-table payments-table">
            <thead>
              <tr>
                <th>Instructor</th>
                <th>Course / Cohort</th>
                <th className="is-numeric">Students</th>
                <th className="is-numeric">Payout %</th>
                <th className="is-numeric">Unpaid</th>
                <th className="is-numeric">Paid</th>
                <th className="is-numeric">Projected</th>
                <th>Status</th>
                <th>Last Paid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visiblePayouts.map((p) => (
                <PayoutRow key={p._id} p={p} paying={payingId === p._id} onPay={payInstructor} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
