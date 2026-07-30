import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../../api/axios';

const EMPTY_FORM = {
  title: '', description: '', category: '', duration: '',
  price: '', requirements: '', curriculum: '', status: 'draft',
};

export default function CourseForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    api.get(`/admin/academy/courses/${id}`)
      .then((res) => {
        const course = res.data.course;
        setForm({
          title: course.title,
          description: course.description,
          category: course.category || '',
          duration: course.duration || '',
          price: course.price,
          requirements: course.requirements || '',
          curriculum: course.curriculum || '',
          status: course.status,
        });
        setCurrentImageUrl(course.image_url || '');
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load course'))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (imageFile) data.append('image', imageFile);

      if (isEditing) {
        await api.patch(`/admin/academy/courses/${id}`, data);
      } else {
        await api.post('/admin/academy/courses', data);
      }
      navigate('/admin/academy/courses');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-dashboard"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>{isEditing ? 'Edit Course' : 'New Course'}</h1>
      <p className="admin-dashboard__subtitle">
        <Link to="/admin/academy/courses">&larr; Back to Courses</Link>
      </p>

      <form className="auth-form job-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label>
          Title
          <input type="text" name="title" value={form.title} onChange={handleChange} required />
        </label>

        <label>
          Category
          <input type="text" name="category" value={form.category} onChange={handleChange} placeholder="e.g. Web Development" />
        </label>

        <label>
          Duration
          <input type="text" name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 12 weeks" />
        </label>

        <label>
          Price (₦)
          <input type="number" name="price" min="0" value={form.price} onChange={handleChange} required />
        </label>

        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
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
          Curriculum overview
          <textarea name="curriculum" rows={4} value={form.curriculum} onChange={handleChange} placeholder="One topic per line" />
        </label>

        <label>
          Cover image
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} />
        </label>
        {currentImageUrl && !imageFile && (
          <img src={currentImageUrl} alt="Current cover" className="admin-image-preview" />
        )}

        <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Course'}
        </button>
      </form>
    </div>
  );
}
