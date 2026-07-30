import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

const EMPTY_FORM = { title: '', description: '', requirements: '', location: '', type: 'full-time' };

export default function JobForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    api.get(`/admin/jobs/${id}`)
      .then((res) => {
        const job = res.data.job;
        setForm({
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          location: job.location,
          type: job.type,
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load job listing'))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEditing) {
        await api.patch(`/admin/jobs/${id}`, form);
      } else {
        await api.post('/admin/jobs', form);
      }
      navigate('/admin/careers');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save job listing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-dashboard"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>{isEditing ? 'Edit Job Listing' : 'New Job Listing'}</h1>
      <p className="admin-dashboard__subtitle">
        <Link to="/admin/careers">&larr; Back to Job Listings</Link>
      </p>

      <form className="auth-form job-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label>
          Title
          <input type="text" name="title" value={form.title} onChange={handleChange} required />
        </label>

        <label>
          Location
          <input type="text" name="location" value={form.location} onChange={handleChange} required />
        </label>

        <label>
          Type
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
            <option value="contract">Contract</option>
          </select>
        </label>

        <label>
          Description
          <textarea name="description" rows={4} value={form.description} onChange={handleChange} required />
        </label>

        <label>
          Requirements
          <textarea name="requirements" rows={5} value={form.requirements} onChange={handleChange} required />
        </label>

        <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Listing'}
        </button>
      </form>
    </div>
  );
}
