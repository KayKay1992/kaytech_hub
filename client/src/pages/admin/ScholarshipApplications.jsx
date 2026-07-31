import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

const STATUSES = ['pending', 'approved', 'rejected'];

export default function ScholarshipApplications() {
  const { id } = useParams();
  const [program, setProgram] = useState(null);
  const [applications, setApplications] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/admin/scholarships/${id}`),
      api.get(`/admin/scholarships/${id}/applications`),
      api.get('/admin/academy/courses'),
    ])
      .then(([programRes, appsRes, coursesRes]) => {
        setProgram(programRes.data.program);
        setApplications(appsRes.data.applications);
        setCourses(coursesRes.data.courses);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load applications'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (appId, status) => {
    setBusyId(appId);
    setError('');
    try {
      await api.patch(`/admin/scholarships/applications/${appId}`, { status });
      setApplications((prev) => prev.map((a) => (a._id === appId ? { ...a, status } : a)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update application status');
    } finally {
      setBusyId(null);
    }
  };

  const handleAssignCourse = async (appId, assigned_course_id) => {
    setBusyId(appId);
    setError('');
    try {
      await api.patch(`/admin/scholarships/applications/${appId}`, { assigned_course_id });
      const course = courses.find((c) => c._id === assigned_course_id);
      setApplications((prev) => prev.map((a) => (a._id === appId ? { ...a, assigned_course_id: course || null } : a)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign course');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <h1>Applications{program ? `: ${program.title}` : ''}</h1>
      <p className="admin-dashboard__subtitle">
        <Link to="/admin/scholarships">&larr; Back to Scholarship Programs</Link>
      </p>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p>Loading applications...</p>
        ) : applications.length === 0 ? (
          <p>No applications received for this program yet.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Contact</th>
                <th>Requested Course</th>
                <th>Status</th>
                <th>Assign Course</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id}>
                  <td>{app.applicant_name}</td>
                  <td>{app.email}{app.phone ? ` · ${app.phone}` : ''}</td>
                  <td>{app.course_id?.title || '—'}</td>
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
                  <td>
                    <select
                      value={app.assigned_course_id?._id || app.assigned_course_id || ''}
                      disabled={busyId === app._id}
                      onChange={(e) => handleAssignCourse(app._id, e.target.value)}
                    >
                      <option value="">Not assigned</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c._id}>{c.title}</option>
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
