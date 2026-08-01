import { useEffect, useState } from 'react';
import api from '../api/axios';
import PageHeader from '../components/common/PageHeader';
import MentorshipCard from '../components/mentorship/MentorshipCard';

export default function Mentorship() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/mentorship')
      .then((res) => setPrograms(res.data.programs))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load mentorship programs'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="KayTech Hub"
        title="Mentorship"
        description="A paid mentorship program pairing you with people who've done the work."
      />

      <section className="section section--flush-top">
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p>Loading mentorship programs...</p>
        ) : programs.length === 0 ? (
          <p>No mentorship programs open right now — check back soon.</p>
        ) : (
          <div className="course-grid">
            {programs.map((program, i) => (
              <MentorshipCard program={program} index={i} key={program._id} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
