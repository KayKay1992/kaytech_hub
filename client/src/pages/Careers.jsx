import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import Reveal from '../components/common/Reveal';
import api from '../api/axios';

const TYPE_LABELS = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  internship: 'Internship',
  contract: 'Contract',
};

export default function Careers() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/jobs')
      .then((res) => setJobs(res.data.jobs))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load job openings'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Join KayTech Hub"
        title="Careers"
        description="Open roles across teaching, operations, and building the Hub itself."
      />

      <section className="section section--flush-top">
        {error && <p className="form-error">{error}</p>}
        {loading ? (
          <p>Loading openings...</p>
        ) : jobs.length === 0 ? (
          <p>No open positions right now — check back soon.</p>
        ) : (
          <div className="card-grid">
            {jobs.map((job, i) => (
              <Reveal as="div" className="card" key={job._id} index={i}>
                <h3>{job.title}</h3>
                <p>{job.description}</p>
                <div className="card__tags">
                  <span className="badge">{TYPE_LABELS[job.type] || job.type}</span>{' '}
                  <span className="badge">{job.location}</span>
                </div>
                <Link to={`/careers/${job._id}`} className="btn btn--ghost">View Role</Link>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
