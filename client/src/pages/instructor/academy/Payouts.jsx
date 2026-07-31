import { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';
import PayoutStatusBadge from '../../../components/academy/PayoutStatusBadge';
import PaymentStatusBadge from '../../../components/academy/PaymentStatusBadge';

const money = (n) => `₦${Number(n || 0).toLocaleString()}`;

function StudentPaymentRow({ s }) {
  return (
    <div className="payout-student-row">
      <div className="payout-student-row__info">
        <strong>{s.name}</strong>
      </div>
      <div className="payout-student-row__amount">
        <span className="payments-amount">{money(s.amount)}</span>
        {s.status === 'paid' && <span className="payments-muted payments-muted--paid">Paid in full</span>}
        {s.status === 'partial' && (
          <>
            <div className="payments-balance-track" aria-hidden="true">
              <div className="payments-balance-fill" style={{ width: `${Math.min(100, (s.amount_paid / s.amount) * 100)}%` }} />
            </div>
            <span className="payments-muted">{money(s.amount_paid)} paid &middot; {money(s.balance)} due</span>
          </>
        )}
        {s.status === 'pending' && (
          <>
            <div className="payments-balance-track" aria-hidden="true">
              <div className="payments-balance-fill" style={{ width: '0%' }} />
            </div>
            <span className="payments-muted">Not paid yet &middot; {money(s.balance)} due</span>
          </>
        )}
      </div>
      <PaymentStatusBadge status={s.status} />
    </div>
  );
}

function PayoutCard({ p, index }) {
  const [expanded, setExpanded] = useState(false);
  const students = p.student_payments || [];
  const status = p.unpaid_amount > 0 ? 'unpaid' : (p.paid_amount > 0 ? 'paid' : 'unpaid');

  return (
    <Reveal as="div" className={`payout-card ${status === 'paid' ? 'payout-card--paid' : ''}`} index={index}>
      <div className="payout-card__header">
        <div>
          <span className="payout-card__eyebrow">{p.cohort_id?.course_id?.title || 'Course'}</span>
          <h3 className="payout-card__title">{p.cohort_id?.name || 'Cohort'}</h3>
        </div>
        <PayoutStatusBadge status={status} />
      </div>

      <div className="payout-card__figure">
        <span className="payout-card__figure-value">{money(p.unpaid_amount)}</span>
        <span className="payout-card__figure-label">Awaiting Payout</span>
      </div>

      <p className="payout-card__note">You earn {p.payout_percent_used}% of each verified student payment for this cohort.</p>

      <div className="payout-card__meta">
        <div className="payout-card__meta-item">
          <span className="payout-card__meta-label">Students Enrolled</span>
          <span className="payout-card__meta-value">{p.students_count}</span>
        </div>
        <div className="payout-card__meta-item">
          <span className="payout-card__meta-label">Already Paid Out</span>
          <span className="payout-card__meta-value">{money(p.paid_amount)}</span>
          {p.last_paid_at && <span className="payments-muted">as of {new Date(p.last_paid_at).toLocaleDateString()}</span>}
        </div>
      </div>

      <div>
        <span className="payout-card__payments-label">Student Payment Status</span>
        <div className="payout-card__payments">
          <span className="payout-chip payout-chip--paid"><strong>{p.payment_breakdown?.paid ?? 0}</strong> Paid</span>
          <span className="payout-chip payout-chip--partial"><strong>{p.payment_breakdown?.partial ?? 0}</strong> Owing</span>
          <span className="payout-chip payout-chip--pending"><strong>{p.payment_breakdown?.pending ?? 0}</strong> Not Paid</span>
        </div>
      </div>

      {students.length > 0 && (
        <>
          <button type="button" className="btn btn--ghost payout-student-toggle" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Hide Student Payments' : 'View Student Payments'}
          </button>

          {expanded && (
            <div className="payout-student-list">
              {students.map((s) => <StudentPaymentRow s={s} key={s.student_id || s.email} />)}
            </div>
          )}
        </>
      )}
    </Reveal>
  );
}

export default function InstructorPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = async ({ silent } = {}) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await api.get('/instructor/payouts');
      setPayouts(res.data.payouts);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your payouts');
    } finally {
      if (silent) setRefreshing(false); else setLoading(false);
    }
  };

  // A verified student payment updates the ledger server-side immediately,
  // but this page won't see it until we refetch — reload (quietly, without
  // blanking the page) whenever the tab regains focus.
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

  const stats = useMemo(() => ({
    amountOwed: payouts.reduce((sum, p) => sum + (p.unpaid_amount || 0), 0),
    amountPaid: payouts.reduce((sum, p) => sum + (p.paid_amount || 0), 0),
    totalStudents: payouts.reduce((sum, p) => sum + (p.students_count || 0), 0),
    cohortCount: payouts.length,
  }), [payouts]);

  if (loading) return <div className="admin-dashboard"><p>Loading your payouts...</p></div>;

  return (
    <div className="admin-dashboard">
      <Reveal as="div" className="dashboard-hero">
        <div className="dashboard-hero__glow dashboard-hero__glow--one" aria-hidden="true" />
        <div className="dashboard-hero__glow dashboard-hero__glow--two" aria-hidden="true" />

        <div className="dashboard-hero__content">
          <span className="badge badge--on-dark">Instructor Earnings</span>
          <h1 className="dashboard-hero__title">Your Payouts</h1>
          <p className="dashboard-hero__subtitle">
            You earn a share of every verified student payment for the cohorts you teach, paid to you offline once admin confirms.
          </p>
          <div className="dashboard-hero__pills">
            <span className="dashboard-hero__pill"><strong>{stats.cohortCount}</strong>&nbsp;Cohorts</span>
            <span className="dashboard-hero__pill"><strong>{stats.totalStudents}</strong>&nbsp;Students Taught</span>
          </div>
        </div>

        <div className="payout-hero__figure">
          <span className="payout-hero__figure-value">{money(stats.amountOwed)}</span>
          <span className="payout-hero__figure-label">Awaiting Payout</span>
          <button type="button" className="btn btn--ghost-on-dark payout-hero__refresh" disabled={refreshing} onClick={() => load({ silent: true })}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </Reveal>

      {error && <p className="form-error" style={{ marginTop: 20 }}>{error}</p>}

      <div className="stat-grid payments-stat-grid" style={{ marginTop: 32 }}>
        <Reveal as="div" className="stat-card stat-card--accent" index={0}>
          <span className="stat-card__value">{money(stats.amountOwed)}</span>
          <span className="stat-card__label">Awaiting Payout</span>
        </Reveal>
        <Reveal as="div" className="stat-card" index={1}>
          <span className="stat-card__value">{money(stats.amountPaid)}</span>
          <span className="stat-card__label">Already Paid Out</span>
        </Reveal>
        <Reveal as="div" className="stat-card" index={2}>
          <span className="stat-card__value">{stats.totalStudents}</span>
          <span className="stat-card__label">Students Taught</span>
        </Reveal>
      </div>

      {payouts.length === 0 ? (
        <p className="academy-lesson-list__empty" style={{ marginTop: 28 }}>
          You're not assigned to any cohorts yet — payouts will show up here once admin assigns you to one.
        </p>
      ) : (
        <div className="payout-grid">
          {payouts.map((p, i) => <PayoutCard p={p} index={i} key={p._id} />)}
        </div>
      )}
    </div>
  );
}
