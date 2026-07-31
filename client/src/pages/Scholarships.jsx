import { useEffect, useState } from 'react';
import api from '../api/axios';
import PageHeader from '../components/common/PageHeader';
import ScholarshipCard from '../components/scholarships/ScholarshipCard';

export default function Scholarships() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/scholarships')
      .then((res) => setPrograms(res.data.programs))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load scholarship programs'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="KayTech Academy"
        title="Scholarships"
        description="Funded and discounted places on our courses for applicants who qualify."
      />

      <section className="section section--flush-top">
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p>Loading scholarship programs...</p>
        ) : programs.length === 0 ? (
          <p>No scholarship programs open right now — check back soon.</p>
        ) : (
          <div className="course-grid">
            {programs.map((program, i) => (
              <ScholarshipCard program={program} index={i} key={program._id} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
