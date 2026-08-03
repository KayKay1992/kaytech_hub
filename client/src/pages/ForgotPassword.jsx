import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Forgot password</h1>
        {error && <p className="form-error">{error}</p>}

        {submitted ? (
          <p className="form-success">
            If an account exists with that email, we've sent a reset link. Check your inbox.
          </p>
        ) : (
          <>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>

            <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send reset link'}
            </button>
          </>
        )}

        <p className="auth-form__switch">
          Remembered it? <Link to="/login">Log in</Link>
        </p>
      </form>
    </section>
  );
}
