import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../../../api/axios';

const EMPTY_FORM = {
  course_id: '', instructor_id: '', name: '',
  start_date: '', end_date: '', rate_per_student: '', status: 'upcoming',
};

const toDateInputValue = (date) => (date ? new Date(date).toISOString().slice(0, 10) : '');

export default function CohortForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({ ...EMPTY_FORM, course_id: searchParams.get('course_id') || '' });
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOptions = api.get('/admin/academy/courses');
    const loadInstructors = api.get('/users', { params: { role: 'instructor' } });
    const loadCohort = isEditing ? api.get(`/admin/academy/cohorts/${id}`) : Promise.resolve(null);

    Promise.all([loadOptions, loadInstructors, loadCohort])
      .then(([coursesRes, instructorsRes, cohortRes]) => {
        setCourses(coursesRes.data.courses);
        setInstructors(instructorsRes.data.users);
        if (cohortRes) {
          const cohort = cohortRes.data.cohort;
          setForm({
            course_id: cohort.course_id?._id || cohort.course_id,
            instructor_id: cohort.instructor_id?._id || cohort.instructor_id,
            name: cohort.name,
            start_date: toDateInputValue(cohort.start_date),
            end_date: toDateInputValue(cohort.end_date),
            rate_per_student: cohort.rate_per_student,
            status: cohort.status,
          });
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load form data'))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEditing) {
        await api.patch(`/admin/academy/cohorts/${id}`, form);
      } else {
        await api.post('/admin/academy/cohorts', form);
      }
      navigate('/admin/academy/cohorts');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save cohort');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-dashboard"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>{isEditing ? 'Edit Cohort' : 'New Cohort'}</h1>
      <p className="admin-dashboard__subtitle">
        <Link to="/admin/academy/cohorts">&larr; Back to Cohorts</Link>
      </p>

      <form className="auth-form job-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label>
          Course
          <select name="course_id" value={form.course_id} onChange={handleChange} required>
            <option value="">Select a course...</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </label>

        <label>
          Instructor
          <select name="instructor_id" value={form.instructor_id} onChange={handleChange} required>
            <option value="">Select an instructor...</option>
            {instructors.map((i) => (
              <option key={i._id} value={i._id}>{i.name} ({i.email})</option>
            ))}
          </select>
        </label>

        <label>
          Cohort name
          <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Cohort 4 - July 2026" required />
        </label>

        <label>
          Start date
          <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
        </label>

        <label>
          End date
          <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required />
        </label>

        <label>
          Rate per student (₦)
          <input type="number" name="rate_per_student" min="0" value={form.rate_per_student} onChange={handleChange} required />
        </label>

        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="upcoming">Upcoming</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </label>

        <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Cohort'}
        </button>
      </form>
    </div>
  );
}
