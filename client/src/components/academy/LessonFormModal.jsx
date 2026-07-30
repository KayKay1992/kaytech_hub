import { useState } from 'react';
import Modal from '../common/Modal';

// Used for both creating a new Lesson and editing an existing one.
// Existing resources (links or previously uploaded files) are loaded as
// editable label/url rows so they survive an edit unless removed.
export default function LessonFormModal({ initial, onClose, onSubmit }) {
  const isEditing = Boolean(initial);
  const [title, setTitle] = useState(initial?.title || '');
  const [order, setOrder] = useState(initial?.order ?? '');
  const [codingExercise, setCodingExercise] = useState(initial?.coding_exercise || '');
  const [links, setLinks] = useState(
    initial?.resources?.length ? initial.resources.map((r) => ({ label: r.label, url: r.url })) : [{ label: '', url: '' }]
  );
  const [notesFile, setNotesFile] = useState(null);
  const [resourceFiles, setResourceFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateLink = (index, field, value) => {
    setLinks((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const addLinkRow = () => setLinks((prev) => [...prev, { label: '', url: '' }]);
  const removeLinkRow = (index) => setLinks((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = new FormData();
      data.append('title', title);
      if (order !== '') data.append('order', order);
      data.append('coding_exercise', codingExercise);

      const validLinks = links.filter((l) => l.label.trim() && l.url.trim());
      data.append('resource_links', JSON.stringify(validLinks));

      if (notesFile) data.append('notes_file', notesFile);
      resourceFiles.forEach((file) => data.append('resource_files', file));

      await onSubmit(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save lesson');
      setSaving(false);
    }
  };

  return (
    <Modal title={isEditing ? 'Edit Lesson' : 'New Lesson'} onClose={onClose}>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        {isEditing && (
          <p className="job-applications__note">Saving will move this lesson back to "Pending" for admin review.</p>
        )}

        <label>
          Title
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label>
          Order
          <input type="number" min="0" value={order} onChange={(e) => setOrder(e.target.value)} placeholder="Display order" />
        </label>

        <label>
          Coding exercise (text/markdown)
          <textarea rows={5} value={codingExercise} onChange={(e) => setCodingExercise(e.target.value)} />
        </label>

        <label>
          Notes file (PDF)
          {initial?.notes_file_url && !notesFile && (
            <span className="job-applications__note">Current: <a href={initial.notes_file_url} target="_blank" rel="noreferrer">view PDF</a> (choose a file to replace)</span>
          )}
          <input type="file" accept="application/pdf" onChange={(e) => setNotesFile(e.target.files[0] || null)} />
        </label>

        <label>Resources (links)</label>
        {links.map((link, index) => (
          <div className="academy-resource-row" key={index}>
            <input
              type="text"
              placeholder="Label"
              value={link.label}
              onChange={(e) => updateLink(index, 'label', e.target.value)}
            />
            <input
              type="url"
              placeholder="https://..."
              value={link.url}
              onChange={(e) => updateLink(index, 'url', e.target.value)}
            />
            <button type="button" className="btn btn--ghost" onClick={() => removeLinkRow(index)}>Remove</button>
          </div>
        ))}
        <button type="button" className="btn btn--ghost" onClick={addLinkRow}>+ Add link</button>

        <label>
          Resource files (upload)
          <input type="file" multiple onChange={(e) => setResourceFiles(Array.from(e.target.files || []))} />
        </label>

        <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Lesson'}
        </button>
      </form>
    </Modal>
  );
}
