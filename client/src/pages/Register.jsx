import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HoneypotField from '../components/common/HoneypotField';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', inviteCode: '', photo: null, agreedToTerms: false, website: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handlePhotoChange = (e) => {
    setForm({ ...form, photo: e.target.files[0] || null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/login', { state: { justRegistered: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        {error && <p className="form-error">{error}</p>}

        <HoneypotField value={form.website} onChange={handleChange} />

        <label>
          Full name
          <input type="text" name="name" value={form.name} onChange={handleChange} required />
        </label>

        <label>
          Email
          <input type="email" name="email" value={form.email} onChange={handleChange} required />
        </label>

        <label>
          Phone
          <input type="tel" name="phone" value={form.phone} onChange={handleChange} />
        </label>

        <label>
          Password
          <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
        </label>

        <label>
          Invite Code (optional)
          <input
            type="text"
            name="inviteCode"
            value={form.inviteCode}
            onChange={handleChange}
            placeholder="Have a code from an admin? Enter it here"
          />
        </label>

        <div className="auth-form__field">
          <span className="auth-form__field-label">Profile photo (optional)</span>
          <label className={`file-input-label ${form.photo ? 'file-input-label--chosen' : ''}`} title={form.photo?.name}>
            {form.photo ? `📎 ${form.photo.name}` : '📎 Choose photo'}
            <input type="file" accept="image/*" className="sr-only-file-input" onChange={handlePhotoChange} />
          </label>
        </div>

        <label className="auth-form__checkbox-label">
          <input type="checkbox" name="agreedToTerms" checked={form.agreedToTerms} onChange={handleChange} required />
          <span>
            I agree to the <Link to="/terms" target="_blank" rel="noreferrer">Terms of Service</Link> and{' '}
            <Link to="/privacy" target="_blank" rel="noreferrer">Privacy Policy</Link>
          </span>
        </label>

        <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Sign up'}
        </button>

        <p className="auth-form__switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </section>
  );
}
