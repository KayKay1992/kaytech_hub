import { useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';

const EVENT_TYPES = [
  { value: 'seminar', label: 'Seminar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'career_fair', label: 'Career Fair' },
];

const toDateInputValue = (date) => (date ? new Date(date).toISOString().slice(0, 10) : '');

const EMPTY_FORM = {
  title: '', description: '', date: '', location: '', type: 'seminar',
  is_paid: false, price: '', max_participants: '',
};

// Create/edit form for an Event, shown as a modal from the list — the field
// set is small enough that a full page (like BlogPostForm) would be overkill.
export default function EventFormModal({ event, onClose, onSaved }) {
  const isEditing = Boolean(event);

  const [form, setForm] = useState(() => (event ? {
    title: event.title,
    description: event.description,
    date: toDateInputValue(event.date),
    location: event.location,
    type: event.type,
    is_paid: Boolean(event.is_paid),
    price: event.price ?? '',
    max_participants: event.max_participants ?? '',
  } : EMPTY_FORM));
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (imageFile) data.append('image', imageFile);

      const res = isEditing
        ? await api.patch(`/admin/events/${event._id}`, data)
        : await api.post('/admin/events', data);

      onSaved(res.data.event);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEditing ? 'Edit Event' : 'New Event'} onClose={onClose} size="lg">
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label>
          Title
          <input type="text" name="title" value={form.title} onChange={handleChange} required />
        </label>

        <label>
          Date
          <input type="date" name="date" value={form.date} onChange={handleChange} required />
        </label>

        <label>
          Location
          <input type="text" name="location" value={form.location} onChange={handleChange} required />
        </label>

        <label>
          Type
          <select name="type" value={form.type} onChange={handleChange}>
            {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>

        <label>
          Description
          <textarea name="description" rows={4} value={form.description} onChange={handleChange} required />
        </label>

        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" name="is_paid" checked={form.is_paid} onChange={handleChange} />
          This is a paid event
        </label>

        {form.is_paid && (
          <label>
            Price (₦)
            <input type="number" name="price" min="0" value={form.price} onChange={handleChange} required />
          </label>
        )}

        <label>
          Max participants (optional — leave blank for unlimited)
          <input type="number" name="max_participants" min="1" value={form.max_participants} onChange={handleChange} />
        </label>

        <label>
          Cover image
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} />
        </label>
        {event?.image_url && !imageFile && (
          <img src={event.image_url} alt="Current cover" className="admin-image-preview" />
        )}

        <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Event'}
        </button>
      </form>
    </Modal>
  );
}
