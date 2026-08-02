import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import PlanCard from '../components/space/PlanCard';
import api from '../api/axios';

const DURATION_ORDER = ['day', 'week', 'month', 'year'];

export default function Space() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/space/plans')
      .then((res) => setPlans(res.data.plans))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load workspace plans'))
      .finally(() => setLoading(false));
  }, []);

  // Fixed Daily -> Weekly -> Monthly -> Yearly order, like a pricing
  // comparison table, regardless of creation order in the database.
  // Same-duration plans are tiebroken by price ascending.
  const sortedPlans = useMemo(() => [...plans].sort((a, b) => {
    const durationDiff = DURATION_ORDER.indexOf(a.duration) - DURATION_ORDER.indexOf(b.duration);
    return durationDiff !== 0 ? durationDiff : a.price - b.price;
  }), [plans]);

  const handleReserve = (plan) => navigate(`/space/${plan._id}/reserve`);

  return (
    <>
      <PageHeader
        eyebrow="KayTech Hub"
        title="Space"
        description="A reliable co-working and research space — free power, free data, and a quiet place to get work done. Compare plans below and reserve your spot."
      />

      <section className="section section--flush-top">
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p>Loading workspace plans...</p>
        ) : plans.length === 0 ? (
          <p>No workspace plans available right now — check back soon.</p>
        ) : (
          <div className="course-grid">
            {sortedPlans.map((plan, i) => (
              <PlanCard plan={plan} index={i} key={plan._id} onReserve={handleReserve} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
