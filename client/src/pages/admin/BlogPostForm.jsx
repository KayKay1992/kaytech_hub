import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';

const EMPTY_FORM = { title: '', content: '', status: 'draft' };

// Full-page create/edit form for a BlogPost — content is a long article
// body, so this follows the Service/Jobs full-page pattern rather than a modal.
export default function BlogPostForm() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) return;
    api.get(`/admin/blog/${id}`)
      .then((res) => {
        const post = res.data.post;
        setForm({ title: post.title, content: post.content, status: post.status });
        setCurrentImageUrl(post.image_url || '');
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load blog post'))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (imageFile) data.append('image', imageFile);

      if (isEditing) {
        await api.patch(`/admin/blog/${id}`, data);
      } else {
        await api.post('/admin/blog', data);
      }
      navigate('/admin/blog');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save blog post');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="admin-dashboard"><p>Loading...</p></div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>{isEditing ? 'Edit Blog Post' : 'New Blog Post'}</h1>
      <p className="admin-dashboard__subtitle">
        <Link to="/admin/blog">&larr; Back to Blog</Link>
      </p>

      <form className="auth-form job-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label>
          Title
          <input type="text" name="title" value={form.title} onChange={handleChange} required />
        </label>

        <label>
          Status
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>

        <label>
          Content
          <textarea name="content" rows={12} value={form.content} onChange={handleChange} required />
        </label>

        <label>
          Cover image
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0] || null)} />
        </label>
        {currentImageUrl && !imageFile && (
          <img src={currentImageUrl} alt="Current cover" className="admin-image-preview" />
        )}

        <button type="submit" className="btn btn--primary btn--full" disabled={saving}>
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Post'}
        </button>
      </form>
    </div>
  );
}
