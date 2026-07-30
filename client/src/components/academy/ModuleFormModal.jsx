import { useState } from 'react';
import Modal from '../common/Modal';

// Used for both creating a new Module and editing an existing one.
export default function ModuleFormModal({ initial, onClose, onSubmit }) {
  const isEditing = Boolean(initial);
  const [title, setTitle] = useState(initial?.title || '');
  const [order, setOrder] = useState(initial?.order ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({ title, order });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save module');
      setSaving(false);
    }
  };

  return (
    <Modal title={isEditing ? 'Edit Module' : 'New Module'} onClose={onClose}>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        {isEditing && (
          <p className="job-applications__note">Saving will move this module back to "Pending" for admin review.</p>
        )}

        <label>
          Title
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label>
          Order
          <input type="number" min="0" value={order} onChange={(e) => setOrder(e.target.value)} placeholder="Display order" />
        </label>

        <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Module'}
        </button>
      </form>
    </Modal>
  );
}
