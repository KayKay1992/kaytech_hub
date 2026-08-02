import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import api from '../../../api/axios';
import Modal from '../../../components/common/Modal';

const DURATIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly' },
];

const EMPTY_FORM = { name: '', duration: '', price: '', status: 'active' };

// Create/edit form for a WorkspacePlan, shown as a modal from the list.
export default function PlanFormModal({ plan, onClose, onSaved }) {
  const isEditing = Boolean(plan);

  const [form, setForm] = useState(() => (plan ? {
    name: plan.name,
    duration: plan.duration,
    price: plan.price,
    status: plan.status,
  } : EMPTY_FORM));
  const [perks, setPerks] = useState(() => (plan?.perks?.length ? plan.perks : ['']));
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const updatePerk = (index, value) => setPerks((prev) => prev.map((p, i) => (i === index ? value : p)));
  const addPerk = () => setPerks((prev) => [...prev, '']);
  const removePerk = (index) => setPerks((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      data.append('perks', JSON.stringify(perks.map((p) => p.trim()).filter(Boolean)));
      if (imageFile) data.append('image', imageFile);

      const res = isEditing
        ? await api.patch(`/admin/space/plans/${plan._id}`, data)
        : await api.post('/admin/space/plans', data);

      onSaved(res.data.plan);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save workspace plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEditing ? 'Edit Workspace Plan' : 'New Workspace Plan'} onClose={onClose} size="lg">
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label>
          Name
          <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Monthly Access" required />
        </label>

        <label>
          Duration
          <select name="duration" value={form.duration} onChange={handleChange} required>
            <option value="">Select...</option>
            {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </label>

        <label>
          Price (₦)
          <input type="number" name="price" min="0" value={form.price} onChange={handleChange} required />
        </label>

        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label>
          Cover image
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} />
        </label>
        {plan?.image_url && !imageFile && (
          <img src={plan.image_url} alt="Current cover" className="admin-image-preview" />
        )}

        <fieldset className="admin-list-field">
          <legend>Perks</legend>
          {perks.map((perk, i) => (
            <div className="admin-list-field__row" key={i}>
              <input
                type="text"
                value={perk}
                onChange={(e) => updatePerk(i, e.target.value)}
                placeholder={`Perk ${i + 1}, e.g. Free high-speed WiFi`}
              />
              <button type="button" className="btn btn--ghost admin-list-field__remove" onClick={() => removePerk(i)} aria-label="Remove perk">
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn--ghost" onClick={addPerk}>
            <Plus size={14} aria-hidden="true" /> Add Perk
          </button>
        </fieldset>

        <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Plan'}
        </button>
      </form>
    </Modal>
  );
}
