import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import api from '../../../api/axios';

const CATEGORIES = [
  { value: 'web-development', label: 'Web Development' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'branding', label: 'Business Branding & Marketing' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'ai-integration', label: 'AI Integration for Businesses' },
];

const MAX_GALLERY_IMAGES = 3;

const EMPTY_FORM = {
  title: '', category: '', description: '', detailed_description: '',
  starting_price: '', status: 'active',
};

// Full-page create/edit form for a Service — the other Hub admin entities
// use a modal, but this one carries a lot more content (multiple images,
// a features list, a step-by-step process) than fits well in one.
export default function ServiceForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [features, setFeatures] = useState(['']);
  const [processSteps, setProcessSteps] = useState([{ title: '', description: '' }]);

  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const [existingGalleryUrls, setExistingGalleryUrls] = useState([]);
  const [newGalleryFiles, setNewGalleryFiles] = useState([]);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    api.get(`/admin/services/${id}`)
      .then((res) => {
        const service = res.data.service;
        setForm({
          title: service.title,
          category: service.category,
          description: service.description,
          detailed_description: service.detailed_description || '',
          starting_price: service.starting_price || '',
          status: service.status,
        });
        setFeatures(service.features.length > 0 ? service.features : ['']);
        setProcessSteps(service.process_steps.length > 0 ? service.process_steps : [{ title: '', description: '' }]);
        setCurrentImageUrl(service.image_url || '');
        setExistingGalleryUrls(service.gallery_images || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load service'))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const updateFeature = (index, value) => {
    setFeatures((prev) => prev.map((f, i) => (i === index ? value : f)));
  };
  const addFeature = () => setFeatures((prev) => [...prev, '']);
  const removeFeature = (index) => setFeatures((prev) => prev.filter((_, i) => i !== index));

  const updateStep = (index, field, value) => {
    setProcessSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };
  const addStep = () => setProcessSteps((prev) => [...prev, { title: '', description: '' }]);
  const removeStep = (index) => setProcessSteps((prev) => prev.filter((_, i) => i !== index));

  const remainingGallerySlots = MAX_GALLERY_IMAGES - existingGalleryUrls.length - newGalleryFiles.length;

  const handleGalleryFilesChange = (e) => {
    const picked = Array.from(e.target.files || []).slice(0, Math.max(remainingGallerySlots, 0));
    setNewGalleryFiles((prev) => [...prev, ...picked].slice(0, MAX_GALLERY_IMAGES - existingGalleryUrls.length));
    e.target.value = '';
  };
  const removeExistingGalleryImage = (url) => setExistingGalleryUrls((prev) => prev.filter((u) => u !== url));
  const removeNewGalleryFile = (index) => setNewGalleryFiles((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      data.append('features', JSON.stringify(features.map((f) => f.trim()).filter(Boolean)));
      data.append('process_steps', JSON.stringify(
        processSteps
          .map((s) => ({ title: s.title.trim(), description: s.description.trim() }))
          .filter((s) => s.title)
      ));
      if (imageFile) data.append('image', imageFile);
      newGalleryFiles.forEach((file) => data.append('gallery_images', file));

      if (isEditing) {
        data.append('existing_gallery_images', JSON.stringify(existingGalleryUrls));
        await api.patch(`/admin/services/${id}`, data);
      } else {
        await api.post('/admin/services', data);
      }
      navigate('/admin/services');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-dashboard"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>{isEditing ? 'Edit Service' : 'New Service'}</h1>
      <p className="admin-dashboard__subtitle">
        <Link to="/admin/services">&larr; Back to Services</Link>
      </p>

      <form className="auth-form job-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label>
          Title
          <input type="text" name="title" value={form.title} onChange={handleChange} required />
        </label>

        <label>
          Category
          <select name="category" value={form.category} onChange={handleChange} required>
            <option value="">Select a category...</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </label>

        <label>
          Starting price (₦, optional)
          <input type="number" name="starting_price" min="0" value={form.starting_price} onChange={handleChange} />
        </label>

        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <label>
          Short description
          <textarea name="description" rows={3} value={form.description} onChange={handleChange} required placeholder="Shown on the service card" />
        </label>

        <label>
          Detailed description
          <textarea name="detailed_description" rows={5} value={form.detailed_description} onChange={handleChange} placeholder="Fuller pitch, shown on the detail page" />
        </label>

        <label>
          Cover image
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} />
        </label>
        {currentImageUrl && !imageFile && (
          <img src={currentImageUrl} alt="Current cover" className="admin-image-preview" />
        )}

        <fieldset className="admin-list-field">
          <legend>What's Included</legend>
          {features.map((feature, i) => (
            <div className="admin-list-field__row" key={i}>
              <input
                type="text"
                value={feature}
                onChange={(e) => updateFeature(i, e.target.value)}
                placeholder={`Feature ${i + 1}`}
              />
              <button type="button" className="btn btn--ghost admin-list-field__remove" onClick={() => removeFeature(i)} aria-label="Remove feature">
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn--ghost" onClick={addFeature}>
            <Plus size={14} aria-hidden="true" /> Add Feature
          </button>
        </fieldset>

        <fieldset className="admin-list-field">
          <legend>How It Works</legend>
          {processSteps.map((step, i) => (
            <div className="admin-list-field__step" key={i}>
              <div className="admin-list-field__step-header">
                <strong>Step {i + 1}</strong>
                <button type="button" className="btn btn--ghost admin-list-field__remove" onClick={() => removeStep(i)} aria-label="Remove step">
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
              <input
                type="text"
                value={step.title}
                onChange={(e) => updateStep(i, 'title', e.target.value)}
                placeholder="Step title, e.g. Consultation"
              />
              <textarea
                rows={2}
                value={step.description}
                onChange={(e) => updateStep(i, 'description', e.target.value)}
                placeholder="Step description (optional)"
              />
            </div>
          ))}
          <button type="button" className="btn btn--ghost" onClick={addStep}>
            <Plus size={14} aria-hidden="true" /> Add Step
          </button>
        </fieldset>

        <fieldset className="admin-list-field">
          <legend>Gallery Images (up to {MAX_GALLERY_IMAGES})</legend>
          {existingGalleryUrls.length > 0 && (
            <div className="service-gallery">
              {existingGalleryUrls.map((url) => (
                <div className="admin-list-field__gallery-item" key={url}>
                  <img src={url} alt="" className="service-gallery__image" />
                  <button type="button" className="btn btn--ghost admin-list-field__remove" onClick={() => removeExistingGalleryImage(url)}>
                    <X size={14} aria-hidden="true" /> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {newGalleryFiles.length > 0 && (
            <ul className="admin-list-field__pending-files">
              {newGalleryFiles.map((file, i) => (
                <li key={i}>
                  {file.name}
                  <button type="button" className="btn btn--ghost admin-list-field__remove" onClick={() => removeNewGalleryFile(i)} aria-label="Remove image">
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {remainingGallerySlots > 0 && (
            <input type="file" accept="image/*" multiple onChange={handleGalleryFilesChange} />
          )}
        </fieldset>

        <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Service'}
        </button>
      </form>
    </div>
  );
}
