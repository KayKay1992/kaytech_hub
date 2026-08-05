import { useEffect, useState } from 'react';
import { Briefcase, MapPin, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';
import EmptyState from '../common/EmptyState';

const TYPE_LABELS = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
};

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isUrl = (value) => /^https?:\/\//i.test(value.trim());

function applyHref(howToApply) {
  const value = howToApply.trim();
  if (isEmail(value)) return `mailto:${value}`;
  if (isUrl(value)) return value;
  return `https://${value}`;
}

// Job Board — visible only to Alumni Forum members (students with at least
// one Certificate, plus instructors/admin). Same access rule and 403
// handling pattern as the Alumni Forum/Directory: the server checks live
// Certificate state, this just renders whatever it's told.
export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessMessage, setAccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/graduate-jobs')
      .then((res) => setJobs(res.data.jobs))
      .catch((err) => {
        if (err.response?.status === 403) {
          setAccessMessage(err.response.data.message || "You don't have access to the Job Board.");
        } else {
          setError(err.response?.data?.message || 'Failed to load the job board');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="payments-empty">Loading job board...</p>;
  }

  if (accessMessage) {
    return (
      <div className="forum-access-denied">
        <ShieldAlert size={32} aria-hidden="true" />
        <h2>Job Board</h2>
        <p>{accessMessage}</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <h1>Job Board</h1>
          <p className="admin-dashboard__subtitle">
            Roles from partner companies, posted just for KayTech Hub graduates.
          </p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No open roles right now"
          message="Check back soon — partner companies post here as new openings come in."
        />
      ) : (
        <div className="dashboard-course-grid">
          {jobs.map((job) => (
            <div key={job._id} className="card job-board-card">
              <div className="job-board-card__head">
                <span className="job-board-card__logo">
                  {job.company_logo_url ? (
                    <img src={job.company_logo_url} alt={job.company_name} />
                  ) : (
                    <Briefcase size={20} aria-hidden="true" />
                  )}
                </span>
                <div>
                  <h3 className="job-board-card__title">{job.job_title}</h3>
                  <p className="job-board-card__company">{job.company_name}</p>
                </div>
              </div>

              <div className="card__tags">
                <span className="badge">{TYPE_LABELS[job.employment_type] || job.employment_type}</span>{' '}
                <span className="badge"><MapPin size={12} aria-hidden="true" /> {job.location}</span>
              </div>

              <p className="job-board-card__description">{job.job_description}</p>

              <a
                href={applyHref(job.how_to_apply)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary job-board-card__apply-btn"
              >
                Apply Now
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
