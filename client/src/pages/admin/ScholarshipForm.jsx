import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

const EMPTY_FORM = { title: '', description: '', requirements: '', course_id: '', applies_to_all_courses: false, status: 'open' };

// The select needs a third state beyond "no course" (empty) and "one specific
// course" (a course id) — "every course, including ones added later" isn't a
// snapshot of today's course list, so it's a flag, not a stored id list.
const ALL_COURSES_VALUE = 'ALL';

export default function ScholarshipForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [courses, setCourses] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCourses = api.get('/admin/academy/courses');
    const loadProgram = isEditing ? api.get(`/admin/scholarships/${id}`) : Promise.resolve(null);

    Promise.all([loadCourses, loadProgram])
      .then(([coursesRes, programRes]) => {
        setCourses(coursesRes.data.courses);
        if (programRes) {
          const program = programRes.data.program;
          setForm({
            title: program.title,
            description: program.description,
            requirements: program.requirements || '',
            course_id: program.course_id?._id || program.course_id || '',
            applies_to_all_courses: program.applies_to_all_courses || false,
            status: program.status,
          });
          setCurrentImageUrl(program.image_url || '');
        }
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load form data'))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCourseSelectionChange = (e) => {
    const value = e.target.value;
    if (value === ALL_COURSES_VALUE) {
      setForm({ ...form, applies_to_all_courses: true, course_id: '' });
    } else {
      setForm({ ...form, applies_to_all_courses: false, course_id: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (imageFile) data.append('image', imageFile);

      if (isEditing) {
        await api.patch(`/admin/scholarships/${id}`, data);
      } else {
        await api.post('/admin/scholarships', data);
      }
      navigate('/admin/scholarships');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save scholarship program');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-dashboard"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>{isEditing ? 'Edit Scholarship Program' : 'New Scholarship Program'}</h1>
      <p className="admin-dashboard__subtitle">
        <Link to="/admin/scholarships">&larr; Back to Scholarships</Link>
      </p>

      <form className="auth-form job-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label>
          Title
          <input type="text" name="title" value={form.title} onChange={handleChange} required />
        </label>

        <label>
          Related course (optional)
          <select
            name="course_selection"
            value={form.applies_to_all_courses ? ALL_COURSES_VALUE : form.course_id}
            onChange={handleCourseSelectionChange}
          >
            <option value="">No related course</option>
            <option value={ALL_COURSES_VALUE}>All available courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.title}</option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </label>

        <label>
          Description
          <textarea name="description" rows={4} value={form.description} onChange={handleChange} required />
        </label>

        <label>
          Requirements
          <textarea name="requirements" rows={3} value={form.requirements} onChange={handleChange} placeholder="One requirement per line" />
        </label>

        <label>
          Cover image
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} />
        </label>
        {currentImageUrl && !imageFile && (
          <img src={currentImageUrl} alt="Current cover" className="admin-image-preview" />
        )}

        <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Program'}
        </button>
      </form>
    </div>
  );
}
