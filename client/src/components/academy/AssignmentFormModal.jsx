import { useState } from 'react';
import Modal from '../common/Modal';

// Used for both creating a new Assignment and editing an existing one,
// scoped to a single cohort. `lessons` is the optional lesson picker list
// (lessons belonging to that cohort's course).
export default function AssignmentFormModal({ initial, lessons, onClose, onSubmit }) {
  const isEditing = Boolean(initial);
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [lessonId, setLessonId] = useState(initial?.lesson_id?._id || initial?.lesson_id || '');
  const [dueDate, setDueDate] = useState(initial?.due_date ? initial.due_date.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit({ title, description, lesson_id: lessonId || null, due_date: dueDate });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save assignment');
      setSaving(false);
    }
  };

  return (
    <Modal title={isEditing ? 'Edit Assignment' : 'New Assignment'} onClose={onClose}>
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label>
          Title
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label>
          Description
          <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>

        <label>
          Lesson (optional)
          <select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
            <option value="">No specific lesson</option>
            {lessons?.map((lesson) => (
              <option key={lesson._id} value={lesson._id}>{lesson.title}</option>
            ))}
          </select>
        </label>

        <label>
          Due date
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
        </label>

        <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Assignment'}
        </button>
      </form>
    </Modal>
  );
}
