import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ResetPassword() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, form.password);
      navigate('/login', { state: { passwordReset: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <section className="auth-page">
        <div className="auth-form">
          <h1>Reset password</h1>
          <p className="form-error">This reset link is missing or invalid.</p>
          <p className="auth-form__switch">
            <Link to="/forgot-password">Request a new link</Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Reset password</h1>
        {error && (
          <>
            <p className="form-error">{error}</p>
            <p className="auth-form__switch">
              <Link to="/forgot-password">Request a new link</Link>
            </p>
          </>
        )}

        <label>
          New password
          <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} />
        </label>

        <label>
          Confirm new password
          <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required minLength={6} />
        </label>

        <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
          {submitting ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </section>
  );
}
