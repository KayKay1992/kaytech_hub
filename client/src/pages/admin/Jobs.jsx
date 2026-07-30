import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import Reveal from '../../components/common/Reveal';

const TYPE_LABELS = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  internship: 'Internship',
  contract: 'Contract',
};

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/jobs');
      setJobs(res.data.jobs);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load job listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const toggleStatus = async (job) => {
    setBusyId(job._id);
    setError('');
    try {
      const nextStatus = job.status === 'open' ? 'closed' : 'open';
      await api.patch(`/admin/jobs/${job._id}`, { status: nextStatus });
      setJobs((prev) => prev.map((j) => (j._id === job._id ? { ...j, status: nextStatus } : j)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>Job Listings</h1>
            <p className="admin-dashboard__subtitle">Create, edit, and open/close career openings.</p>
          </div>
          <Link to="/admin/careers/new" className="btn btn--primary">New Listing</Link>
        </div>
      </Reveal>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p>Loading job listings...</p>
        ) : jobs.length === 0 ? (
          <p>No job listings yet.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Location</th>
                <th>Status</th>
                <th>Posted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id}>
                  <td>{job.title}</td>
                  <td>{TYPE_LABELS[job.type] || job.type}</td>
                  <td>{job.location}</td>
                  <td>
                    <span className={`invite-status ${job.status === 'open' ? 'invite-status--unused' : 'invite-status--used'}`}>
                      {job.status === 'open' ? 'Open' : 'Closed'}
                    </span>
                  </td>
                  <td>{new Date(job.posted_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/careers/${job._id}/edit`} className="btn btn--ghost">Edit</Link>
                    <Link to={`/admin/careers/${job._id}/applications`} className="btn btn--ghost">Applications</Link>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={busyId === job._id}
                      onClick={() => toggleStatus(job)}
                    >
                      {job.status === 'open' ? 'Close' : 'Reopen'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
