import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../common/Reveal';
import MentorshipCard from '../mentorship/MentorshipCard';
import api from '../../api/axios';

export default function MentorshipPreview() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/mentorship')
      .then((res) => setPrograms(res.data.programs.slice(0, 4)))
      .catch(() => setPrograms([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && programs.length === 0) return null;

  return (
    <section className="section">
      <Reveal as="div" className="section__header">
        <span className="badge">KayTech Hub</span>
        <h2>Mentorship Programs</h2>
        <p>Paired guidance from people who've done the work, in a track built for where you're at.</p>
      </Reveal>

      {loading ? (
        <p>Loading mentorship programs...</p>
      ) : (
        <>
          <div className="course-grid">
            {programs.map((program, i) => (
              <MentorshipCard program={program} index={i} key={program._id} />
            ))}
          </div>

          <div className="courses-overview__more">
            <Link to="/mentorship" className="btn btn--ghost btn--lg">View More Mentorship Programs</Link>
          </div>
        </>
      )}
    </section>
  );
}
