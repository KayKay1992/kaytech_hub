import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, BookOpen, FileEdit, Plus } from 'lucide-react';
import api from '../../../api/axios';
import ListPageHeader from '../../../components/common/ListPageHeader';
import StatCards from '../../../components/common/StatCards';
import Toolbar from '../../../components/admin/Toolbar';
import StatusPill from '../../../components/admin/StatusPill';
import EmptyState from '../../../components/common/EmptyState';
import CourseFormModal from './CourseFormModal';

const STATUS_TONE = { draft: 'amber', published: 'teal', archived: 'slate' };
const STATUSES = ['draft', 'published', 'archived'];

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [cohortCountByCourseId, setCohortCountByCourseId] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formState, setFormState] = useState(null); // null closed, {} new, course editing

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [coursesRes, cohortsRes] = await Promise.all([
        api.get('/admin/academy/courses'),
        api.get('/admin/academy/cohorts'),
      ]);
      setCourses(coursesRes.data.courses);
      const counts = {};
      cohortsRes.data.cohorts.forEach((c) => {
        const id = c.course_id?._id || c.course_id;
        counts[id] = (counts[id] || 0) + 1;
      });
      setCohortCountByCourseId(counts);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
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

  const handleSaved = (savedCourse) => {
    setCourses((prev) => {
      const exists = prev.some((c) => c._id === savedCourse._id);
      return exists ? prev.map((c) => (c._id === savedCourse._id ? savedCourse : c)) : [savedCourse, ...prev];
    });
    setFormState(null);
  };

  const stats = useMemo(() => ({
    total: courses.length,
    published: courses.filter((c) => c.status === 'published').length,
    draft: courses.filter((c) => c.status === 'draft').length,
  }), [courses]);

  const visibleCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (!q) return true;
      return `${c.title} ${c.category || ''}`.toLowerCase().includes(q);
    });
  }, [courses, search, statusFilter]);

  return (
    <div className="admin-dashboard">
      <ListPageHeader
        title="Courses"
        subtitle="Create, edit, and archive Academy courses."
        action={{ label: 'New Course', icon: Plus, onClick: () => setFormState({}) }}
      />

      <StatCards stats={[
        { label: 'Total Courses', value: stats.total },
        { label: 'Published', value: stats.published, accent: true },
        { label: 'Draft', value: stats.draft },
      ]} />

      <Toolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search by title or category...">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Toolbar>

      {error && <p className="form-error">{error}</p>}

      <div className="invite-table-wrap">
        {loading ? (
          <p className="payments-empty">Loading courses...</p>
        ) : visibleCourses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses found"
            message={search || statusFilter ? 'No courses match your search or filter.' : 'Create your first course to get started.'}
          />
        ) : (
          <table className="invite-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Price</th>
                <th>Status</th>
                <th className="is-numeric">Cohorts</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleCourses.map((course) => (
                <tr key={course._id}>
                  <td>
                    <div className="admin-table__title-cell">
                      {course.image_url ? (
                        <img src={course.image_url} alt="" className="admin-table__thumb" />
                      ) : (
                        <span className="admin-table__thumb admin-table__thumb--placeholder" />
                      )}
                      <div>
                        <strong>{course.title}</strong><br />
                        <span className="payments-muted">{course.category || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td>₦{Number(course.price).toLocaleString()}</td>
                  <td><StatusPill tone={STATUS_TONE[course.status]}>{course.status}</StatusPill></td>
                  <td className="is-numeric">{cohortCountByCourseId[course._id] || 0}</td>
                  <td className="payments-date">{new Date(course.created_at).toLocaleDateString()}</td>
                  <td className="admin-table__actions">
                    <button type="button" className="btn btn--ghost" onClick={() => setFormState(course)}>
                      <FileEdit size={14} aria-hidden="true" /> Edit
                    </button>
                    <Link to={`/admin/academy/courses/${course._id}/content`} className="btn btn--ghost">Content</Link>
                    <Link to={`/admin/academy/cohorts?course_id=${course._id}`} className="btn btn--ghost">Cohorts</Link>
                    <Link to={`/admin/academy/registrations?course_id=${course._id}`} className="btn btn--ghost">Registrations</Link>
                    <button
                      type="button"
                      className="btn btn--ghost"
                      disabled={busyId === course._id}
                      onClick={() => handleArchiveToggle(course)}
                    >
                      {course.status === 'archived' ? (
                        <><ArchiveRestore size={14} aria-hidden="true" /> Unarchive</>
                      ) : (
                        <><Archive size={14} aria-hidden="true" /> Archive</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {formState !== null && (
        <CourseFormModal
          course={formState._id ? formState : null}
          onClose={() => setFormState(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
