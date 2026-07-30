import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../api/axios';
import Reveal from '../../../components/common/Reveal';

const STATUS_CLASSES = {
  draft: 'invite-status--used',
  published: 'invite-status--unused',
  archived: 'invite-status--expired',
};

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/academy/courses');
      setCourses(res.data.courses);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleArchiveToggle = async (course) => {
    setBusyId(course._id);
    setError('');
    try {
      const nextStatus = course.status === 'archived' ? 'draft' : 'archived';
      await api.patch(`/admin/academy/courses/${course._id}`, { status: nextStatus });
      setCourses((prev) => prev.map((c) => (c._id === course._id ? { ...c, status: nextStatus } : c)));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update course status');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <Reveal as="div">
        <div className="admin-page-header">
          <div>
            <h1>Courses</h1>
            <p className="admin-dashboard__subtitle">Create, edit, and archive Academy courses.</p>
          </div>
          <Link to="/admin/academy/courses/new" className="btn btn--primary">New Course</Link>
        </div>
      </Reveal>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p>Loading courses...</p>
        ) : courses.length === 0 ? (
          <p>No courses yet.</p>
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course._id}>
                  <td>{course.title}</td>
                  <td>{course.category || '—'}</td>
                  <td>₦{Number(course.price).toLocaleString()}</td>
                  <td>
                    <span className={`invite-status ${STATUS_CLASSES[course.status] || ''}`}>{course.status}</span>
                  </td>
                  <td>{new Date(course.created_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/academy/courses/${course._id}/edit`} className="btn btn--ghost">Edit</Link>
                    <Link to={`/admin/academy/courses/${course._id}/content`} className="btn btn--ghost">Content</Link>
                    <Link to={`/admin/academy/cohorts?course_id=${course._id}`} className="btn btn--ghost">Cohorts</Link>
                    <Link to={`/admin/academy/registrations?course_id=${course._id}`} className="btn btn--ghost">Registrations</Link>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={busyId === course._id}
                      onClick={() => handleArchiveToggle(course)}
                    >
                      {course.status === 'archived' ? 'Unarchive' : 'Archive'}
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
