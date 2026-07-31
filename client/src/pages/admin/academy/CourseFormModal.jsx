import { useState } from 'react';
import api from '../../../api/axios';
import Modal from '../../../components/common/Modal';

const EMPTY_FORM = {
  title: '', description: '', category: '', duration: '',
  price: '', requirements: '', curriculum: '', status: 'draft',
};

// Create/edit form for a Course, shown as a modal from the Courses list —
// internal admin actions stay fast and functional, not a separate page.
export default function CourseFormModal({ course, onClose, onSaved }) {
  const isEditing = Boolean(course);

  const [form, setForm] = useState(() => (course ? {
    title: course.title,
    description: course.description,
    category: course.category || '',
    duration: course.duration || '',
    price: course.price,
    requirements: course.requirements || '',
    curriculum: course.curriculum || '',
    status: course.status,
  } : EMPTY_FORM));
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (imageFile) data.append('image', imageFile);

      const res = isEditing
        ? await api.patch(`/admin/academy/courses/${course._id}`, data)
        : await api.post('/admin/academy/courses', data);

      onSaved(res.data.course);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEditing ? 'Edit Course' : 'New Course'} onClose={onClose} size="lg">
      <form className="auth-form" onSubmit={handleSubmit}>
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
        {course?.image_url && !imageFile && (
          <img src={course.image_url} alt="Current cover" className="admin-image-preview" />
        )}

        <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Course'}
        </button>
      </form>
    </Modal>
  );
}
