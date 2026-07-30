import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

const STATUSES = ['new', 'reviewed', 'shortlisted', 'rejected'];

export default function JobApplications() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/admin/jobs/${id}`),
      api.get(`/admin/jobs/${id}/applications`),
    ])
      .then(([jobRes, appsRes]) => {
        setJob(jobRes.data.job);
        setApplications(appsRes.data.applications);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load applications'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (appId, status) => {
    setBusyId(appId);
    setError('');
    try {
      await api.patch(`/admin/applications/${appId}`, { status });
      setApplications((prev) => prev.map((a) => (a._id === appId ? { ...a, status } : a)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update application status');
    } finally {
      setBusyId(null);
    }
  };

  // Resumes aren't publicly hosted — request a short-lived signed URL each
  // time. Open the tab synchronously first so the browser doesn't treat the
  // later redirect as a blocked popup.
  const viewResume = async (appId) => {
    const newTab = window.open('', '_blank');
    setError('');
    try {
      const res = await api.get(`/admin/applications/${appId}/resume-url`);
      if (newTab) newTab.location.href = res.data.url;
    } catch (err) {
      if (newTab) newTab.close();
      setError(err.response?.data?.message || 'Failed to open resume');
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Applications{job ? `: ${job.title}` : ''}</h1>
      <p className="admin-dashboard__subtitle">
        <Link to="/admin/careers">&larr; Back to Job Listings</Link>
      </p>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p>Loading applications...</p>
        ) : applications.length === 0 ? (
          <p>No applications received for this listing yet.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Contact</th>
                <th>Cover Note</th>
                <th>Resume</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id}>
                  <td>{app.full_name}</td>
                  <td>{app.email}{app.phone ? ` · ${app.phone}` : ''}</td>
                  <td className="job-applications__note">{app.cover_note || '—'}</td>
                  <td>
                    <button type="button" className="btn btn--ghost" onClick={() => viewResume(app._id)}>
                      View Resume
                    </button>
                  </td>
                  <td>
                    <select
                      value={app.status}
                      disabled={busyId === app._id}
                      onChange={(e) => handleStatusChange(app._id, e.target.value)}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>{new Date(app.submitted_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
