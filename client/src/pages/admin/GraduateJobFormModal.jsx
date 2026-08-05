import { useState } from 'react';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';

const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

const EMPTY_FORM = {
  company_name: '',
  job_title: '',
  job_description: '',
  location: '',
  employment_type: '',
  how_to_apply: '',
  status: 'open',
};

// Create/edit form for a GraduateJobListing, shown as a modal from the list.
export default function GraduateJobFormModal({ job, onClose, onSaved }) {
  const isEditing = Boolean(job);

  const [form, setForm] = useState(() => (job ? {
    company_name: job.company_name,
    job_title: job.job_title,
    job_description: job.job_description,
    location: job.location,
    employment_type: job.employment_type,
    how_to_apply: job.how_to_apply,
    status: job.status,
  } : EMPTY_FORM));
  const [logoFile, setLogoFile] = useState(null);
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
      if (logoFile) data.append('image', logoFile);

      const res = isEditing
        ? await api.patch(`/admin/graduate-jobs/${job._id}`, data)
        : await api.post('/admin/graduate-jobs', data);

      onSaved(res.data.job);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save job listing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEditing ? 'Edit Job Listing' : 'New Job Listing'} onClose={onClose} size="lg">
      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label>
          Company name
          <input type="text" name="company_name" value={form.company_name} onChange={handleChange} required />
        </label>

        <label>
          Company logo (optional)
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0] || null)} />
        </label>
        {job?.company_logo_url && !logoFile && (
          <img src={job.company_logo_url} alt="Current logo" className="admin-image-preview" />
        )}

        <label>
          Job title
          <input type="text" name="job_title" value={form.job_title} onChange={handleChange} placeholder="e.g. Frontend Developer" required />
        </label>

        <label>
          Job description
          <textarea name="job_description" rows={5} value={form.job_description} onChange={handleChange} required />
        </label>

        <label>
          Location
          <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Port Harcourt or Remote" required />
        </label>

        <label>
          Employment type
          <select name="employment_type" value={form.employment_type} onChange={handleChange} required>
            <option value="">Select...</option>
            {EMPLOYMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>

        <label>
          How to apply (link or email)
          <input type="text" name="how_to_apply" value={form.how_to_apply} onChange={handleChange} placeholder="https://... or jobs@company.com" required />
        </label>

        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </label>

        <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Post Job'}
        </button>
      </form>
    </Modal>
  );
}
