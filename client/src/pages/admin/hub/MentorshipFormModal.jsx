import { useState } from 'react';
import api from '../../../api/axios';
import Modal from '../../../components/common/Modal';

const EMPTY_FORM = { title: '', description: '', price: '', duration: '', schedule_info: '', status: 'open' };

// Create/edit form for a MentorshipProgram, shown as a modal from the list.
export default function MentorshipFormModal({ program, onClose, onSaved }) {
  const isEditing = Boolean(program);

  const [form, setForm] = useState(() => (program ? {
    title: program.title,
    description: program.description,
    price: program.price,
    duration: program.duration,
    schedule_info: program.schedule_info || '',
    status: program.status,
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
        ? await api.patch(`/admin/mentorship/${program._id}`, data)
        : await api.post('/admin/mentorship', data);

      onSaved(res.data.program);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save mentorship program');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEditing ? 'Edit Mentorship Program' : 'New Mentorship Program'} onClose={onClose} size="lg">
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label>
          Title
          <input type="text" name="title" value={form.title} onChange={handleChange} required />
        </label>

        <label>
          Price (₦)
          <input type="number" name="price" min="0" value={form.price} onChange={handleChange} required />
        </label>

        <label>
          Duration
          <input type="text" name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 8 weeks" required />
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
          Schedule info
          <textarea name="schedule_info" rows={3} value={form.schedule_info} onChange={handleChange} placeholder="e.g. Weekly 1:1 calls, every Tuesday 6pm" />
        </label>

        <label>
          Cover image
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} />
        </label>
        {program?.image_url && !imageFile && (
          <img src={program.image_url} alt="Current cover" className="admin-image-preview" />
        )}

        <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Program'}
        </button>
      </form>
    </Modal>
  );
}
