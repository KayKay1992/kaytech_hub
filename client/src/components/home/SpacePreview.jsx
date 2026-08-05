import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Reveal from '../common/Reveal';
import PlanCard from '../space/PlanCard';
import api from '../../api/axios';

const DURATION_ORDER = ['day', 'week', 'month', 'year'];

export default function SpacePreview() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/space/plans')
      .then((res) => setPlans(res.data.plans))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  // Same fixed Daily -> Weekly -> Monthly -> Yearly order as the full Space
  // page, then trimmed to the first 4 for the Home preview.
  const previewPlans = useMemo(() => [...plans]
    .sort((a, b) => {
      const durationDiff = DURATION_ORDER.indexOf(a.duration) - DURATION_ORDER.indexOf(b.duration);
      return durationDiff !== 0 ? durationDiff : a.price - b.price;
    })
    .slice(0, 4), [plans]);

  const handleReserve = (plan) => navigate(`/space/${plan._id}/reserve`);

  if (!loading && previewPlans.length === 0) return null;

  return (
    <section className="section">
      <Reveal as="div" className="section__header">
        <span className="badge">KayTech Hub</span>
        <h2>Workspace &amp; Co-working Space</h2>
        <p>A reliable place to work — free power, free data, and plans that fit however long you need it.</p>
      </Reveal>

      {loading ? (
        <p>Loading workspace plans...</p>
      ) : (
        <>
          <div className="course-grid">
            {previewPlans.map((plan, i) => (
              <PlanCard plan={plan} index={i} key={plan._id} onReserve={handleReserve} />
            ))}
          </div>

          <div className="courses-overview__more">
            <Link to="/space" className="btn btn--ghost btn--lg">View More Space Plans</Link>
          </div>
        </>
      )}
    </section>
  );
}
